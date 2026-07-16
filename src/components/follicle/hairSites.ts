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

export type ScalpRegion = "receptor" | "donor";

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
  return (x - b.minX) / b.spanX; // 0..1
}

function normZ(z: number, b: Bounds) {
  return (z - b.minZ) / b.spanZ; // 0..1 (frente ≈ 1 no Lee Perry-Smith)
}

/**
 * Máscara dura da área receptora (topo + linha anterior + vértex).
 * Lee Perry-Smith: +Z = face, -Z = nuca, +Y = topo.
 */
function isReceptorPoint(p: Vector3, n: Vector3, b: Bounds): boolean {
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2; // 0 centro → 1 orelha

  // Fora do topo do crânio
  if (y < 0.62) return false;
  // Normal deve apontar para cima (couro, não face/pescoço)
  if (n.y < 0.22) return false;
  // Remove face (frente + abaixo da linha do cabelo)
  if (n.z > 0.35 && y < 0.78) return false;
  // Remove sobrancelha / testa baixa
  if (z > 0.72 && y < 0.72) return false;
  // Remove orelhas
  if (x > 0.82 && y < 0.78) return false;
  // Faixa útil: do mid-front até a coroa
  // (z muito baixo = nuca profunda → doador, não receptor)
  if (z < 0.22 && n.y < 0.55) return false;

  return true;
}

/**
 * Máscara dura da área doadora (laterais + nuca, cabelo raspado).
 */
function isDonorPoint(p: Vector3, n: Vector3, b: Bounds): boolean {
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  // Faixa média (abaixo do topo calvo, acima do pescoço)
  if (y < 0.38 || y > 0.68) return false;
  // Sem face
  if (n.z > 0.25) return false;
  if (z > 0.62) return false;
  // Laterais ou nuca
  const lateral = x > 0.35 && n.y < 0.45;
  const nape = z < 0.4 && n.z < 0.05 && n.y < 0.55;
  return lateral || nape;
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
  const n = new Vector3();
  const p = new Vector3();

  for (let i = 0; i < count; i += 1) {
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    n.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
    const ok =
      region === "receptor"
        ? isReceptorPoint(p, n, b)
        : isDonorPoint(p, n, b);
    // Peso binário: evita vazamento para a face
    weights[i] = ok ? 1 : 0;
  }

  geometry.setAttribute("hairWeight", new Float32BufferAttribute(weights, 1));
}

/**
 * Semeia folículos só na região anatômica correta.
 * Usa sampler + rejeição dura (garante zero fios na face/orelha).
 */
export function buildHairSites(
  geometry: BufferGeometry,
  count: number,
  region: ScalpRegion = "receptor",
): HairSite[] {
  const geo = geometry.clone();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const b = getBounds(geo);
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
    const ok =
      region === "receptor"
        ? isReceptorPoint(p, nrm, b)
        : isDonorPoint(p, nrm, b);
    if (!ok) continue;

    sites.push({
      position: p.clone(),
      normal: nrm.clone(),
      jitter: Math.random(),
    });
  }

  // Fallback: se o sampler não encheu, usa vértices elegíveis
  if (sites.length < count) {
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const eligible: HairSite[] = [];
    const tp = new Vector3();
    const tn = new Vector3();
    for (let i = 0; i < pos.count; i += 1) {
      tp.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      tn.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
      const ok =
        region === "receptor"
          ? isReceptorPoint(tp, tn, b)
          : isDonorPoint(tp, tn, b);
      if (!ok) continue;
      eligible.push({
        position: tp.clone(),
        normal: tn.clone(),
        jitter: Math.random(),
      });
    }
    while (sites.length < count && eligible.length > 0) {
      const pick = eligible[Math.floor(Math.random() * eligible.length)]!;
      // Pequeno jitter tangencial para não empilhar no mesmo vértice
      const jitterPos = pick.position
        .clone()
        .addScaledVector(pick.normal, 0.01)
        .add(
          new Vector3(
            (Math.random() - 0.5) * 0.04,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.04,
          ),
        );
      sites.push({
        position: jitterPos,
        normal: pick.normal.clone(),
        jitter: Math.random(),
      });
    }
  }

  if (region === "receptor") {
    // Preenche da linha anterior (frente-topo) para trás
    sites.sort((a, c) => {
      const pa = a.position.z * 0.7 + a.position.y * 0.3;
      const pb = c.position.z * 0.7 + c.position.y * 0.3;
      return pb - pa;
    });
  }

  geo.dispose();
  return sites.slice(0, count);
}
