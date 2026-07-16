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
  // Começa um pouco antes do limiar medido (pega a raiz da orelha)
  const earStart = m.earX - 0.1;
  if (ax < earStart) return false;
  if (p.y < m.earY0 || p.y > m.earY1) return false;
  if (p.z < m.earZ0 - 0.15 || p.z > m.earZ1 + 0.2) return false;
  if (Math.abs(n.x) > 0.32 || ax > m.earX) return true;
  return ax > earStart + 0.04;
}

/** Rosto: olhos, nariz, boca, bochechas — nunca recebe fios. */
function isFace(p: Vector3, n: Vector3, m: HeadMetrics): boolean {
  // Hemisfério frontal com normal para frente (abaixo da linha capilar)
  if (
    p.z > m.faceZ - 0.05 &&
    n.z > 0.22 &&
    n.y < 0.55 &&
    p.y < m.topY - 1.05
  ) {
    return true;
  }
  // Nariz / boca / mento (Z bem alto)
  if (p.z > 1.7 && p.y < 2.45 && n.y < 0.7) return true;
  // Órbitas / olhos
  if (
    p.z > 1.35 &&
    p.y > 1.15 &&
    p.y < 2.55 &&
    Math.abs(p.x) < 1.35 &&
    n.z > 0.18 &&
    n.y < 0.55
  ) {
    return true;
  }
  // Boca / lábios / queixo
  if (p.z > 1.15 && p.y < 1.15 && p.y > -0.8 && n.z > 0.12) return true;
  return false;
}

/**
 * Entradas (têmporas) — zona receptora, vazia no Calvo.
 */
export function receptorDensity(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  if (isEar(p, n, m) || isFace(p, n, m)) return 0;
  if (n.y < 0.12) return 0;

  const ax = Math.abs(p.x);
  const yN = (p.y - m.scalpY0) / (m.topY - m.scalpY0 || 1);

  let d = 1;
  d *= band(yN, 0.4, 0.88, 0.1);
  d *= band(p.z, m.faceZ - 1.2, m.faceZ + 0.05, 0.22);
  d *= band(ax, m.earX * 0.32, m.earX * 0.92, m.earX * 0.1);
  d *= smoothstep(0.12, 0.35, n.y);
  return clamp01(d);
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
  if (isFace(p, n, m)) return 0;

  const ax = Math.abs(p.x);

  // Pescoço
  if (p.y < m.scalpY0 - 0.05) return 0;
  if (n.y < -0.35 && p.y < m.scalpY0 + 0.5) return 0;

  // Bloqueio frontal duro: nada com normal de face abaixo da linha capilar
  if (n.z > 0.4 && p.z > 1.1 && p.y < m.topY - 1.0) return 0;

  // Cobertura da calota
  const height = smoothstep(m.scalpY0, m.scalpY0 + 0.5, p.y);
  // Corta o hemisfério facial; só libera se for topo (ny alto)
  const notFace =
    1 -
    smoothstep(1.0, 1.6, p.z) *
      (1 - smoothstep(0.4, 0.7, n.y)) *
      smoothstep(0.0, 0.35, n.z);

  const nearEar =
    smoothstep(m.earX - 0.18, m.earX + 0.02, ax) *
    band(p.y, m.earY0, m.earY1, 0.15) *
    band(p.z, m.earZ0 - 0.1, m.earZ1 + 0.15, 0.15);
  const earFade = 1 - nearEar;

  // Topo / occipital / laterais do crânio (não face)
  const scalpFacing = clamp01(
    smoothstep(0.15, 0.45, n.y) +
      smoothstep(0.4, 0.75, Math.abs(n.x)) * 0.45 * earFade * (n.z < 0.35 ? 1 : 0.2) +
      smoothstep(0.15, 0.55, -n.z) * 0.8,
  );

  let d = height * notFace * earFade * Math.max(scalpFacing, 0.2 * height);
  d *= 1 - receptorDensity(p, n, m);
  return clamp01(d);
}

/** Máscara do couro (inclui entradas vazias) para textura PBR. */
export function scalpSurfaceMask(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  if (isEar(p, n, m) || isFace(p, n, m)) return 0;
  if (p.y < m.scalpY0 - 0.1) return 0;
  return clamp01(smoothstep(m.scalpY0, m.scalpY0 + 0.45, p.y));
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
    if (isEar(p, nrm, m) || isFace(p, nrm, m)) continue;

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
      if (isEar(hp, hn, m) || isFace(hp, hn, m)) continue;
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

export function countFaceHairSites(
  sites: HairSite[],
  geometry: BufferGeometry,
): number {
  const m = computeHeadMetrics(geometry);
  let n = 0;
  for (const s of sites) {
    if (isFace(s.position, s.normal, m)) n += 1;
  }
  return n;
}
