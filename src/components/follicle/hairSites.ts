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
 * Couro cabeludo (calota superior): só a coroa da cabeça.
 * Exclui orelhas (laterais salientes + normal lateral), rosto e pescoço.
 */
function isOnScalp(p: Vector3, n: Vector3, b: Bounds): boolean {
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  if (y < 0.7) return false; // acima da linha das orelhas
  if (n.y < 0.28) return false; // só calota voltada para cima
  if (x > 0.62) return false; // corta saliência das orelhas
  if (Math.abs(n.x) > 0.55 && n.y < 0.5) return false; // faces laterais = orelha/têmpora baixa
  if (z > 0.58 && y < 0.9) return false; // testa / rosto
  // Faixa das orelhas: mid-Z + lateral + altura típica
  if (x > 0.48 && y < 0.78 && z > 0.28 && z < 0.62) return false;
  return true;
}

/**
 * Zona calva a preencher: topo/vértex + linha frontal recuada.
 * É a área grande e brilhante do alto da cabeça (calvície avançada).
 */
function isReceptorPoint(p: Vector3, n: Vector3, b: Bounds): boolean {
  if (!isOnScalp(p, n, b)) return false;
  const z = normZ(p.z, b);

  const top = n.y > 0.55; // calota superior (vértex + topo)
  const front = z > 0.52; // linha anterior recuada (frontal)
  return top || front;
}

/**
 * Cabelo remanescente em ferradura: anel das laterais + nuca da coroa,
 * sempre acima das orelhas. Tem cabelo — mas com calvície acentuada no topo.
 */
function isResidualPoint(p: Vector3, n: Vector3, b: Bounds): boolean {
  if (!isOnScalp(p, n, b)) return false;
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  if (n.y > 0.52) return false; // topo fica calvo
  if (z > 0.5) return false; // frente fica calva (entrada)
  if (x > 0.58) return false; // sem orelha
  if (y < 0.72) return false; // bem acima das orelhas
  return true;
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
