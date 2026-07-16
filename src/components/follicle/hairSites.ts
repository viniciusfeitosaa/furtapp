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

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}

function band(v: number, lo: number, hi: number, e: number) {
  return smoothstep(lo - e, lo, v) * (1 - smoothstep(hi, hi + e, v));
}

/**
 * Densidade da zona receptora (entradas).
 * Controla onde as entradas entram "para dentro" da linha capilar de forma suave.
 */
export function receptorDensity(p: Vector3, n: Vector3, b: Bounds): number {
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  // Evita cabelo no rosto/orelhas usando atenuações suaves em vez de cortes absolutos
  const earFactor = 1 - smoothstep(0.40, 0.48, x) * smoothstep(0.70, 0.85, Math.abs(n.x));
  if (n.y < 0.02) return 0;

  let m = 1;
  m *= band(y, 0.72, 0.89, 0.06);   // Ajustado para focar na faixa de altura das entradas
  m *= band(z, 0.52, 0.72, 0.08);   // Profundidade das têmporas frontais
  m *= band(x, 0.20, 0.55, 0.08);   // Afastamento lateral em relação ao centro (formato de M)
  
  return clamp01(m * earFactor);
}

/**
 * Densidade do cabelo remanescente (estado calvo natural).
 * Mantém as laterais e a nuca cheias, enquanto gera um fade suave na transição das entradas.
 */
export function residualDensity(p: Vector3, n: Vector3, b: Bounds): number {
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  // Atenuações anatômicas orgânicas (substitui os retornos '0' rígidos)
  const neckFade = smoothstep(0.55, 0.62, y);       // Suaviza cabelo descendo para o pescoço
  const faceFade = 1 - smoothstep(0.68, 0.78, z);   // Suaviza aproximação da testa/rosto
  const earFade = 1 - smoothstep(0.52, 0.65, x);    // Suaviza sobre as orelhas

  if (n.y < -0.1) return 0;

  let d = 1;
  d *= neckFade;
  d *= faceFade;
  d *= earFade;

  // Leve rarefação no topo-coroa (Padrão de calvície leve/androgenética natural)
  // Reduz levemente a densidade na coroa (vértice) sem deixar um buraco limpo
  const crownRarefaction = 1 - 0.3 * smoothstep(0.45, 0.65, z) * smoothstep(0.75, 0.88, y);
  d *= crownRarefaction;

  // Retira de forma suave a área das entradas/receptor
  const recDensity = receptorDensity(p, n, b);
  d *= (1 - recDensity * 0.95); // 0.95 garante uma microlinha de transição sutil

  return clamp01(d);
}

function regionDensity(region: ScalpRegion) {
  return region === "receptor" ? receptorDensity : residualDensity;
}

function paintWeight(
  geometry: BufferGeometry,
  region: ScalpRegion,
  b: Bounds,
) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const count = pos.count;
  const weights = new Float32Array(count);
  const dens = regionDensity(region);
  const n = new Vector3();
  const p = new Vector3();

  for (let i = 0; i < count; i += 1) {
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    n.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
    weights[i] = dens(p, n, b);
  }

  geometry.setAttribute("hairWeight", new Float32BufferAttribute(weights, 1));
}

function tangentBasis(n: Vector3, t1: Vector3, t2: Vector3) {
  const ref = Math.abs(n.y) < 0.9 ? UP_REF : X_REF;
  t1.crossVectors(n, ref).normalize();
  t2.crossVectors(n, t1).normalize();
}
const UP_REF = new Vector3(0, 1, 0);
const X_REF = new Vector3(1, 0, 0);

// Diminuído o raio de agrupamento para garantir que os fios de 2 e 3 saiam extremamente juntos
// simulando perfeitamente um único folículo piloso natural
const CLUMP_RADIUS = 0.0028; 

export function buildHairSites(
  geometry: BufferGeometry,
  count: number,
  region: ScalpRegion = "receptor",
): HairSite[] {
  const geo = geometry.clone();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const b = getBounds(geo);
  const dens = regionDensity(region);
  const clump = region === "residual";
  paintWeight(geo, region, b);

  const mesh = new Mesh(geo, new MeshBasicMaterial());
  const sampler = new MeshSurfaceSampler(mesh)
    .setWeightAttribute("hairWeight")
    .build();

  const sites: HairSite[] = [];
  const p = new Vector3();
  const nrm = new Vector3();
  const t1 = new Vector3();
  const t2 = new Vector3();
  const maxTries = count * 60;

  const pushHair = (pos: Vector3, normal: Vector3) => {
    sites.push({
      position: pos.clone(),
      normal: normal.clone(),
      jitter: Math.random(),
    });
  };

  for (let tries = 0; sites.length < count && tries < maxTries; tries += 1) {
    sampler.sample(p, nrm);
    nrm.normalize();
    const d = dens(p, nrm, b);
    if (d < 0.05) continue;

    if (!clump) {
      pushHair(p, nrm);
      continue;
    }

    // Unidades Foliculares baseadas em probabilidade de densidade local
    let unit = 1;
    if (d > 0.4 && Math.random() < d) unit = 2;
    if (d > 0.75 && Math.random() < d - 0.25) unit = 3;

    tangentBasis(nrm, t1, t2);
    for (let h = 0; h < unit && sites.length < count; h += 1) {
      const ang = Math.random() * Math.PI * 2;
      // h === 0 fica exatamente na raiz do poro, h > 0 se espalha muito perto
      const r = h === 0 ? 0 : Math.random() * CLUMP_RADIUS;
      const hp = p
        .clone()
        .addScaledVector(t1, Math.cos(ang) * r)
        .addScaledVector(t2, Math.sin(ang) * r);
      
      // Inclinação muito sutil (ajustado de 0.28 para 0.12 para manter os fios paralelos e organizados)
      const hn = nrm
        .clone()
        .addScaledVector(t1, (Math.random() - 0.5) * 0.12)
        .addScaledVector(t2, (Math.random() - 0.5) * 0.12)
        .normalize();
      pushHair(hp, hn);
    }
  }

  if (region === "receptor") {
    // Ordenação suave para o crescimento do transplante (de trás para a linha frontal)
    sites.sort((a, c) => {
      const pa = a.position.z * 0.7 + a.position.y * 0.3;
      const pb = c.position.z * 0.7 + c.position.y * 0.3;
      return pb - pa;
    });
  }

  geo.dispose();
  return sites.slice(0, count);
}

export function buildScalpShades(geometry: BufferGeometry): {
  residual: Float32Array;
  receptor: Float32Array;
} {
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const b = getBounds(geometry);
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const n = pos.count;
  const residual = new Float32Array(n);
  const receptor = new Float32Array(n);
  const p = new Vector3();
  const nv = new Vector3();
  const SHADE = 0.50; // Ajustado para não escurecer demais a cabeça nas transições

  for (let i = 0; i < n; i += 1) {
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    nv.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
    residual[i] = 1 - SHADE * residualDensity(p, nv, b);
    receptor[i] = 1 - SHADE * receptorDensity(p, nv, b);
  }

  return { residual, receptor };
}
