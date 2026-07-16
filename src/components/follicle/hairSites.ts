import {
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  type BufferGeometry,
} from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

export type HairSite = {
  position: Vector3;
  normal: Vector3;
  jitter: number;
};

/**
 * - residual: cabelo remanescente (ferradura) — “calvo” com entradas severas
 * - receptor: zona a preencher (entradas + frontal + vértex)
 * - donor: laterais/nuca raspadas
 */
export type ScalpRegion = "receptor" | "donor" | "residual";

type Bounds = {
  minY: number;
  spanY: number;
  minX: number;
  spanX: number;
  minZ: number;
  spanZ: number;
};

function getBounds(geometry: BufferGeometry): Bounds {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  return {
    minY: bb.min.y,
    spanY: bb.max.y - bb.min.y || 1,
    minX: bb.min.x,
    spanX: bb.max.x - bb.min.x || 1,
    minZ: bb.min.z,
    spanZ: bb.max.z - bb.min.z || 1,
  };
}

function normY(y: number, b: Bounds) {
  return (y - b.minY) / b.spanY;
}

function normX(x: number, b: Bounds) {
  return (x - b.minX) / b.spanX;
}

function normZ(z: number, b: Bounds) {
  return (z - b.minZ) / b.spanZ;
}

/** Base: só crânio (sem face, orelha, pescoço). */
function isOnScalp(p: Vector3, n: Vector3, b: Bounds): boolean {
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  if (y < 0.5) return false;
  if (x > 0.7) return false; // orelhas
  if (n.y < -0.05) return false; // pescoço
  if (n.z > 0.32 && y < 0.8) return false; // face
  if (z > 0.72 && y < 0.76) return false;
  return true;
}

/**
 * Zona das entradas / frontal / vértex — o que o procedimento preenche.
 * Norwood avançado: M frontal bem aberto + rarefação no topo.
 */
function isReceptorPoint(p: Vector3, n: Vector3, b: Bounds): boolean {
  if (!isOnScalp(p, n, b)) return false;
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  if (y < 0.64) return false;
  if (n.y < 0.18) return false;

  // Entradas profundas (têmporas frontais) — M bem aberto
  const temples = z > 0.5 && y > 0.66 && y < 0.86 && x > 0.18 && x < 0.55;
  // Linha anterior / frontal central
  const frontal = z > 0.5 && y > 0.66 && y < 0.9 && x < 0.42;
  // Vértex / meio do topo
  const vertex = y > 0.76 && z > 0.3 && z < 0.7 && x < 0.5;
  // Ponte mid-scalp rarefeita
  const midFront = z > 0.4 && y > 0.7 && x < 0.4;

  return temples || frontal || vertex || midFront;
}

/**
 * Cabelo remanescente em ferradura (padrão de calvície avançada).
 * Tem cabelo — mas com entradas severas bem evidentes.
 */
function isResidualPoint(p: Vector3, n: Vector3, b: Bounds): boolean {
  if (!isOnScalp(p, n, b)) return false;
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  if (y < 0.56 || y > 0.88) return false;
  if (n.y < 0.1) return false;

  // Zona das entradas / frontal / vértex fica vazia no “Calvo”
  if (z > 0.48 && x < 0.52) return false; // M frontal + entradas
  if (z > 0.55) return false; // nada na linha anterior
  if (y > 0.78 && z > 0.34 && z < 0.68 && x < 0.36) return false; // vértex

  // Ferradura: pilares laterais + corona posterior
  const sidePillar = x > 0.32 && x <= 0.68 && z < 0.5 && y > 0.58;
  const backHorseshoe = z < 0.42 && y > 0.58 && x < 0.62;
  return sidePillar || backHorseshoe;
}

/**
 * Área doadora (laterais + nuca do crânio — sem pescoço/orelha).
 */
function isDonorPoint(p: Vector3, n: Vector3, b: Bounds): boolean {
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  if (y < 0.5 || y > 0.66) return false;
  if (n.z > 0.12) return false;
  if (z > 0.55) return false;
  if (x > 0.7) return false;
  if (n.y < -0.05) return false;

  const lateral = x > 0.38 && x <= 0.7 && n.y < 0.4 && y >= 0.52;
  const nape = z < 0.38 && n.z < 0.0 && n.y < 0.5 && x < 0.55 && y >= 0.52;
  return lateral || nape;
}

function regionTest(region: ScalpRegion) {
  if (region === "receptor") return isReceptorPoint;
  if (region === "residual") return isResidualPoint;
  return isDonorPoint;
}

function paintBinaryWeight(
  geometry: BufferGeometry,
  region: ScalpRegion,
  b: Bounds,
) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const count = pos.count;
  const weights = new Float32Array(count);
  const test = regionTest(region);
  const n = new Vector3();
  const p = new Vector3();

  for (let i = 0; i < count; i += 1) {
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    n.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
    weights[i] = test(p, n, b) ? 1 : 0;
  }

  geometry.setAttribute("hairWeight", new Float32BufferAttribute(weights, 1));
}

export function buildHairSites(
  geometry: BufferGeometry,
  count: number,
  region: ScalpRegion = "receptor",
): HairSite[] {
  const geo = geometry.clone();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const b = getBounds(geo);
  const test = regionTest(region);
  paintBinaryWeight(geo, region, b);

  const mesh = new Mesh(geo, new MeshBasicMaterial());
  const sampler = new MeshSurfaceSampler(mesh)
    .setWeightAttribute("hairWeight")
    .build();

  const sites: HairSite[] = [];
  const p = new Vector3();
  const nrm = new Vector3();
  const maxTries = count * 40;

  for (let tries = 0; sites.length < count && tries < maxTries; tries += 1) {
    sampler.sample(p, nrm);
    nrm.normalize();
    if (!test(p, nrm, b)) continue;
    sites.push({
      position: p.clone(),
      normal: nrm.clone(),
      jitter: Math.random(),
    });
  }

  if (sites.length < count) {
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const eligible: HairSite[] = [];
    const tp = new Vector3();
    const tn = new Vector3();
    for (let i = 0; i < pos.count; i += 1) {
      tp.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      tn.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
      if (!test(tp, tn, b)) continue;
      eligible.push({
        position: tp.clone(),
        normal: tn.clone(),
        jitter: Math.random(),
      });
    }
    let guard = 0;
    while (sites.length < count && eligible.length > 0 && guard < count * 20) {
      guard += 1;
      const pick = eligible[Math.floor(Math.random() * eligible.length)]!;
      const jitterPos = pick.position
        .clone()
        .addScaledVector(pick.normal, 0.008)
        .add(
          new Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.02,
          ),
        );
      if (!test(jitterPos, pick.normal, b)) continue;
      sites.push({
        position: jitterPos,
        normal: pick.normal.clone(),
        jitter: Math.random(),
      });
    }
  }

  if (region === "receptor") {
    // Preenche entradas → frontal → vértex
    sites.sort((a, c) => {
      const pa = a.position.z * 0.75 + a.position.y * 0.25;
      const pb = c.position.z * 0.75 + c.position.y * 0.25;
      return pb - pa;
    });
  }

  geo.dispose();
  return sites.slice(0, count);
}
