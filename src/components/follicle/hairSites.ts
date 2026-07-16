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
 * - residual: cabelo remanescente (ferradura na coroa) — calvície avançada
 * - receptor: zona calva a preencher (frontal + topo + vértex)
 */
export type ScalpRegion = "receptor" | "residual";

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

/**
 * Zona a preencher com enxertos: só as entradas (têmporas).
 * No Calvo, a cabeça inteira tem cabelo — apenas as têmporas ficam vazias.
 */
function isReceptorPoint(p: Vector3, n: Vector3, b: Bounds): boolean {
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  // Faixa da linha anterior / têmporas
  if (y < 0.68 || y > 0.9) return false;
  if (z < 0.48 || z > 0.7) return false;
  // Laterais das entradas (não o centro da testa, nem a orelha)
  if (x < 0.14 || x > 0.5) return false;
  if (n.y < 0.08) return false;
  if (Math.abs(n.x) > 0.75 && x > 0.45) return false; // orelha
  return true;
}

/**
 * Calvo: cabeça inteira preenchida, exceto as entradas (têmporas).
 * Sem orelha, sem nuca baixa, sem rosto.
 */
function isResidualPoint(p: Vector3, n: Vector3, b: Bounds): boolean {
  if (isReceptorPoint(p, n, b)) return false;

  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  // Nuca baixa / pescoço
  if (y < 0.64) return false;
  // Rosto (mantém frontal central cabeludo, corta só testa baixa)
  if (z > 0.68 && y < 0.86) return false;
  if (n.z > 0.5 && z > 0.62 && y < 0.84) return false;
  // Orelha: só a saliência
  if (x > 0.68) return false;
  if (
    x > 0.56 &&
    y > 0.58 &&
    y < 0.74 &&
    z > 0.34 &&
    z < 0.56 &&
    Math.abs(n.x) > 0.72
  ) {
    return false;
  }

  // Cabeça inteira (topo + laterais + occipital alto + frontal central)
  if (y >= 0.64 && y <= 0.96 && x <= 0.66 && z < 0.68 && n.y > -0.15) {
    return true;
  }
  // Occipital alto
  if (z < 0.5 && y >= 0.66 && y <= 0.94 && x < 0.6 && n.y > -0.05) {
    return true;
  }
  return false;
}

function regionTest(region: ScalpRegion) {
  if (region === "receptor") return isReceptorPoint;
  return isResidualPoint;
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
  const maxTries = count * 80;

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
    while (sites.length < count && eligible.length > 0 && guard < count * 40) {
      guard += 1;
      const pick = eligible[Math.floor(Math.random() * eligible.length)]!;
      const jitterPos = pick.position
        .clone()
        .addScaledVector(pick.normal, 0.004)
        .add(
          new Vector3(
            (Math.random() - 0.5) * 0.012,
            (Math.random() - 0.5) * 0.008,
            (Math.random() - 0.5) * 0.012,
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
