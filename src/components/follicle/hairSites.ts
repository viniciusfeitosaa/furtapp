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

/**
 * Métricas do head.glb (Lee Perry-Smith) medidas na malha real.
 * O bbox inclui extremos laterais baixos (|x|≈4.3) que NÃO são orelhas;
 * as orelhas reais estão em |x|≈1.6–1.9, y≈0.5–2.2.
 */
type HeadMetrics = {
  earX: number; // |x| onde a pinna começa
  earY0: number;
  earY1: number;
  earZ0: number;
  earZ1: number;
  scalpY0: number; // acima do pescoço
  faceZ: number; // frente do rosto
  topY: number;
};

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
 * Deriva métricas a partir da geometria (robusto a escala).
 * Orelha = saliência lateral na faixa de altura da cabeça média —
 * NÃO o extremo global de |x| (que fica baixo no bbox).
 */
export function computeHeadMetrics(geometry: BufferGeometry): HeadMetrics {
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const pos = geometry.attributes.position;

  const topY = bb.max.y;
  const midLo = bb.min.y + (bb.max.y - bb.min.y) * 0.48;
  const midHi = bb.min.y + (bb.max.y - bb.min.y) * 0.78;

  // Largura do crânio (percentil alto de |x| no terço superior — sem orelha)
  const vaultXs: number[] = [];
  const midXs: number[] = [];
  for (let i = 0; i < pos.count; i += 1) {
    const x = Math.abs(pos.getX(i));
    const y = pos.getY(i);
    if (y > midHi) vaultXs.push(x);
    if (y >= midLo && y <= midHi) midXs.push(x);
  }
  vaultXs.sort((a, b) => a - b);
  midXs.sort((a, b) => a - b);
  const pct = (arr: number[], p: number) =>
    arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] ?? 1.5;

  const vaultW = pct(vaultXs, 0.97);
  const midW = pct(midXs, 0.995); // inclui orelha
  // Pinna começa um pouco além do crânio e antes da ponta da orelha
  const earX = vaultW + (midW - vaultW) * 0.35;

  return {
    earX,
    earY0: midLo - (bb.max.y - bb.min.y) * 0.05,
    earY1: midHi + (bb.max.y - bb.min.y) * 0.02,
    earZ0: bb.min.z + (bb.max.z - bb.min.z) * 0.25,
    earZ1: bb.min.z + (bb.max.z - bb.min.z) * 0.62,
    scalpY0: bb.min.y + (bb.max.y - bb.min.y) * 0.52,
    faceZ: bb.min.z + (bb.max.z - bb.min.z) * 0.72,
    topY,
  };
}

function isEar(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): boolean {
  const ax = Math.abs(p.x);
  // Ponta / corpo da orelha
  if (ax < m.earX) return false;
  if (p.y < m.earY0 || p.y > m.earY1) return false;
  if (p.z < m.earZ0 || p.z > m.earZ1) return false;
  // Normal predominantemente lateral OU já bem saliente
  if (Math.abs(n.x) > 0.4 || ax > m.earX + (m.earX * 0.12)) return true;
  return ax > m.earX + 0.05;
}

/**
 * Entradas (têmporas) — zona receptora, vazia no Calvo.
 */
export function receptorDensity(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  if (isEar(p, n, m)) return 0;
  if (n.y < 0.05) return 0;

  const ax = Math.abs(p.x);
  const yN = (p.y - m.scalpY0) / (m.topY - m.scalpY0 || 1);
  const zN = (p.z - (m.faceZ - 1.2)) / 1.8;

  let d = 1;
  d *= band(yN, 0.35, 0.85, 0.12);
  d *= band(p.z, m.faceZ - 1.35, m.faceZ + 0.15, 0.25);
  d *= band(ax, m.earX * 0.35, m.earX * 0.95, m.earX * 0.12);
  d *= smoothstep(0.05, 0.25, n.y);
  return clamp01(d * (zN > 0 ? 1 : 0.15));
}

/**
 * Couro cabeludo completo (Calvo): preenche TODA a calota —
 * topo, laterais, occipital — exceto orelha, rosto, pescoço e entradas.
 */
export function residualDensity(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  if (isEar(p, n, m)) return 0;

  const ax = Math.abs(p.x);

  // Pescoço
  if (p.y < m.scalpY0 - 0.15) return 0;
  if (n.y < -0.4 && p.y < m.scalpY0 + 0.4) return 0;

  // Rosto (frente + normal frontal), mantendo linha capilar alta
  const onFace =
    p.z > m.faceZ - 0.15 &&
    n.z > 0.35 &&
    n.y < 0.4 &&
    p.y < m.topY - 0.9;
  if (onFace) return 0;

  // Cobertura da calota: qualquer ponto do crânio acima do pescoço
  // que não seja face/orelha — prioriza normais para cima/lado/trás.
  const height = smoothstep(m.scalpY0 - 0.1, m.scalpY0 + 0.55, p.y);
  const notFace =
    1 -
    smoothstep(m.faceZ - 0.35, m.faceZ + 0.35, p.z) *
      (1 - smoothstep(0.25, 0.55, n.y));
  // Aproxima da orelha sem buraco no parietal: corta só bem na pinna
  const nearEar =
    smoothstep(m.earX - 0.12, m.earX + 0.02, ax) *
    band(p.y, m.earY0, m.earY1, 0.2) *
    band(p.z, m.earZ0, m.earZ1, 0.2);
  const earFade = 1 - nearEar;

  // Aceita topo (ny alto), laterais (nx) e occipital (nz baixo)
  const scalpFacing = clamp01(
    smoothstep(0.05, 0.35, n.y) +
      smoothstep(0.35, 0.7, Math.abs(n.x)) * 0.55 * (1 - nearEar) +
      smoothstep(0.1, 0.5, -n.z) * 0.7,
  );

  let d = height * notFace * earFade * Math.max(scalpFacing, 0.35 * height);
  // Entradas vazias
  d *= 1 - receptorDensity(p, n, m);
  return clamp01(d);
}

/** Máscara do couro (inclui entradas vazias) para textura PBR. */
export function scalpSurfaceMask(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  if (isEar(p, n, m)) return 0;
  if (p.y < m.scalpY0 - 0.2) return 0;
  const onFace =
    p.z > m.faceZ && n.z > 0.4 && n.y < 0.35 && p.y < m.topY - 1.0;
  if (onFace) return 0;
  return clamp01(smoothstep(m.scalpY0 - 0.15, m.scalpY0 + 0.4, p.y));
}

function regionDensity(region: ScalpRegion) {
  return region === "receptor" ? receptorDensity : residualDensity;
}

function paintWeight(
  geometry: BufferGeometry,
  region: ScalpRegion,
  m: HeadMetrics,
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
    weights[i] = dens(p, n, m);
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
const CLUMP_RADIUS = 0.05; // unidades da malha local (~head size 8)

export function buildHairSites(
  geometry: BufferGeometry,
  count: number,
  region: ScalpRegion = "receptor",
): HairSite[] {
  const geo = geometry.clone();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const m = computeHeadMetrics(geo);
  const dens = regionDensity(region);
  const clump = region === "residual";
  paintWeight(geo, region, m);

  const mesh = new Mesh(geo, new MeshBasicMaterial());
  const sampler = new MeshSurfaceSampler(mesh)
    .setWeightAttribute("hairWeight")
    .build();

  const sites: HairSite[] = [];
  const p = new Vector3();
  const nrm = new Vector3();
  const t1 = new Vector3();
  const t2 = new Vector3();
  const maxTries = count * 80;

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
    const d = dens(p, nrm, m);
    if (d < 0.04) continue;
    if (isEar(p, nrm, m)) continue;

    if (!clump) {
      pushHair(p, nrm);
      continue;
    }

    let unit = 1;
    if (d > 0.4 && Math.random() < d) unit = 2;
    if (d > 0.75 && Math.random() < d - 0.25) unit = 3;

    tangentBasis(nrm, t1, t2);
    for (let h = 0; h < unit && sites.length < count; h += 1) {
      const ang = Math.random() * Math.PI * 2;
      const r = h === 0 ? 0 : Math.random() * CLUMP_RADIUS;
      const hp = p
        .clone()
        .addScaledVector(t1, Math.cos(ang) * r)
        .addScaledVector(t2, Math.sin(ang) * r);
      const hn = nrm
        .clone()
        .addScaledVector(t1, (Math.random() - 0.5) * 0.15)
        .addScaledVector(t2, (Math.random() - 0.5) * 0.15)
        .normalize();
      if (isEar(hp, hn, m)) continue;
      pushHair(hp, hn);
    }
  }

  if (region === "receptor") {
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
  surface: Float32Array;
} {
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const m = computeHeadMetrics(geometry);
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const n = pos.count;
  const residual = new Float32Array(n);
  const receptor = new Float32Array(n);
  const surface = new Float32Array(n);
  const p = new Vector3();
  const nv = new Vector3();
  const SHADE = 0.5;

  for (let i = 0; i < n; i += 1) {
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    nv.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
    residual[i] = 1 - SHADE * residualDensity(p, nv, m);
    receptor[i] = 1 - SHADE * receptorDensity(p, nv, m);
    surface[i] = scalpSurfaceMask(p, nv, m);
  }

  return { residual, receptor, surface };
}

export function countEarHairSites(
  sites: HairSite[],
  geometry: BufferGeometry,
): number {
  const m = computeHeadMetrics(geometry);
  let n = 0;
  for (const s of sites) {
    if (isEar(s.position, s.normal, m)) n += 1;
  }
  return n;
}
