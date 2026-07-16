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
  earX: number;
  earY0: number;
  earY1: number;
  earZ0: number;
  earZ1: number;
  scalpY0: number;
  faceZ: number;
  topY: number;
};

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * clamp01(t);
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
  const midW = pct(midXs, 0.995);
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

/**
 * Pinna medida na malha real: |x| 1.62–1.90, y 0.68–2.0, z −0.50–0.33.
 */
const EAR = { cx: 1.74, cy: 1.32, cz: -0.06, rx: 0.3, ry: 0.86, rz: 0.62 };

function earDist2(p: Vector3): number {
  const dx = (Math.abs(p.x) - EAR.cx) / EAR.rx;
  const dy = (p.y - EAR.cy) / EAR.ry;
  const dz = (p.z - EAR.cz) / EAR.rz;
  return dx * dx + dy * dy + dz * dz;
}

/**
 * 0 dentro da orelha, 1 fora.
 * Fade começa mais perto da pinna — mantém densidade até a raiz
 * (evita o "buraco" acima da orelha).
 */
function earKeep(p: Vector3): number {
  return smoothstep(0.9, 1.25, earDist2(p));
}

function isEar(p: Vector3): boolean {
  return earDist2(p) < 1.0;
}

/**
 * Rosto suave com atenuações contínuas.
 * A costeleta fica livre de bloqueios binários na borda.
 */
function faceKeep(p: Vector3, n: Vector3): number {
  let f = 1;
  const central =
    (1 - smoothstep(1.05, 1.35, Math.abs(p.x))) *
    smoothstep(0.7, 1.0, p.z) *
    (1 - smoothstep(2.5, 2.85, p.y));
  f *= 1 - clamp01(central);
  // Bochecha: fade mais gradual (não corta a costeleta em bloco)
  const cheek =
    smoothstep(1.38, 1.72, p.z) * (1 - smoothstep(2.45, 2.9, p.y));
  f *= 1 - clamp01(cheek);
  const forehead =
    smoothstep(1.5, 1.75, p.z) * (1 - smoothstep(2.9, 3.2, p.y));
  f *= 1 - clamp01(forehead);
  const jaw = smoothstep(0.5, 0.85, p.z) * (1 - smoothstep(0.45, 0.7, p.y));
  f *= 1 - clamp01(jaw);
  if (n.y < -0.5 && p.z > 0) f = 0;
  return clamp01(f);
}

function isFace(p: Vector3, n: Vector3): boolean {
  return faceKeep(p, n) < 0.4;
}

/**
 * Entradas (têmporas) — zona receptora, vazia no Calvo.
 * Só têmpora frontal-lateral; não invade coroa/occipital.
 */
export function receptorDensity(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  if (isEar(p)) return 0;
  if (n.y < 0.12) return 0;

  const ax = Math.abs(p.x);
  const yN = (p.y - m.scalpY0) / (m.topY - m.scalpY0 || 1);

  const crown =
    smoothstep(0.72, 0.9, yN) * (1 - smoothstep(0.55, 0.95, p.z));
  if (crown > 0.55) return 0;

  let d = 1;
  d *= band(yN, 0.52, 0.82, 0.14);
  d *= smoothstep(0.55, 0.95, p.z) * (1 - smoothstep(1.35, 1.65, p.z));
  d *= smoothstep(0.7, 1.05, ax) * (1 - smoothstep(1.4, 1.65, ax));
  d *= smoothstep(0.12, 0.35, n.y);
  return clamp01(d);
}

function isNeck(p: Vector3, n: Vector3): boolean {
  if (p.y < -0.2) return true;
  if (p.y < 0.45 && n.y < -0.55) return true;
  return false;
}

/**
 * Nuca arredondada: fade largo, sem "navalha" horizontal.
 */
function napeKeep(p: Vector3): number {
  const back = 1 - smoothstep(-0.55, 0.75, p.z);
  const side = smoothstep(0.85, 1.55, Math.abs(p.x));
  const yCut = mix(0.02, 0.28, back * back) - side * 0.08;
  return smoothstep(yCut - 0.32, yCut + 0.48, p.y);
}

/**
 * Densidade residual — laterais suaves.
 * Costeleta por normais (não caixas band); bridge acima da orelha.
 */
export function residualDensity(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  if (isNeck(p, n)) return 0;

  const keepNape = napeKeep(p);
  if (keepNape <= 0.05) return 0;

  // Sem bloqueio binário isEar na densidade — só earKeep suave
  const kEar = earKeep(p);
  if (kEar <= 0) return 0;

  const keepFace = faceKeep(p, n);

  let d = keepNape * kEar * keepFace;

  // Bridge: preenche o vão logo acima da orelha (falha clássica)
  const aboveEar =
    band(Math.abs(p.x), 1.28, 1.72, 0.22) *
    band(p.y, 1.85, 2.65, 0.28) *
    band(p.z, -0.55, 0.45, 0.28) *
    kEar;
  d = Math.max(d, clamp01(aboveEar) * keepNape);

  // Costeleta orgânica (normais + fades — sem band rígido)
  const isSide = smoothstep(0.4, 0.65, Math.abs(p.x));
  const isSideFrontY = smoothstep(0.55, 0.72, p.y);
  // Frente da orelha até a bochecha (não usa |z| — evita cortar a frente)
  const isSideFrontZ =
    smoothstep(-0.25, 0.2, p.z) * (1 - smoothstep(0.95, 1.35, p.z));

  if (isSide > 0.1 && isSideFrontY > 0.1 && isSideFrontZ > 0.1) {
    // Descida suave pelo lóbulo via normal frontal
    const sDescend = smoothstep(-0.15, 0.18, n.z);
    // Fade lateral para a bochecha (sem bloco reto)
    const sEdgeFade = 1 - smoothstep(1.3, 1.62, Math.abs(p.x));
    // Mais denso em cima, mais ralo perto da mandíbula
    const sDenst = mix(0.4, 0.88, smoothstep(0.55, 1.35, p.y));
    const sideburnFinal = sDenst * sDescend * sEdgeFade * isSideFrontZ * isSide;
    d = Math.max(d, clamp01(sideburnFinal) * keepNape * kEar);
  }

  // Calvície clássica nas têmporas
  const templeGap = receptorDensity(p, n, m);
  d *= 1 - templeGap;

  return clamp01(d);
}

/** Máscara do couro (inclui entradas vazias) para textura PBR. */
export function scalpSurfaceMask(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  void m;
  if (isNeck(p, n)) return 0;
  return clamp01(napeKeep(p) * earKeep(p) * faceKeep(p, n));
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
/** Fios do mesmo folículo — raios curtos para densidade real. */
const CLUMP_RADIUS_RESIDUAL = 0.0035;
const CLUMP_RADIUS_RECEPTOR = 0.005;

export function buildHairSites(
  geometry: BufferGeometry,
  count: number,
  region: ScalpRegion = "receptor",
): HairSite[] {
  const geo = geometry.clone();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const m = computeHeadMetrics(geo);
  const dens = regionDensity(region);
  const isResidual = region === "residual";
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
  const maxTries = count * 120;
  const clumpRadius = isResidual
    ? CLUMP_RADIUS_RESIDUAL
    : CLUMP_RADIUS_RECEPTOR;

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

    if (d < 0.05) continue;
    // Aceitação proporcional à densidade local (ralo orgânico nas bordas)
    if (Math.random() > d) continue;
    if (isEar(p) || isFace(p, nrm) || isNeck(p, nrm)) continue;

    if (!isResidual) {
      pushHair(p, nrm);
      continue;
    }

    let unitSize = 1;
    if (d > 0.6 && Math.random() < d * 0.9) unitSize = 2;
    if (d > 0.82 && Math.random() < d * 0.75) unitSize = 3;

    tangentBasis(nrm, t1, t2);
    for (let h = 0; h < unitSize && sites.length < count; h += 1) {
      const ang = Math.random() * Math.PI * 2;
      const r = h === 0 ? 0 : Math.random() * clumpRadius;
      const hp = p
        .clone()
        .addScaledVector(t1, Math.cos(ang) * r)
        .addScaledVector(t2, Math.sin(ang) * r);
      const hn = nrm
        .clone()
        .addScaledVector(t1, (Math.random() - 0.5) * 0.22)
        .addScaledVector(t2, (Math.random() - 0.5) * 0.22)
        .normalize();
      if (isEar(hp) || isNeck(hp, hn) || isFace(hp, hn)) continue;
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
  void geometry;
  let n = 0;
  for (const s of sites) {
    if (isEar(s.position)) n += 1;
  }
  return n;
}

export function countFaceHairSites(
  sites: HairSite[],
  geometry: BufferGeometry,
): number {
  void geometry;
  let n = 0;
  for (const s of sites) {
    if (isFace(s.position, s.normal)) n += 1;
  }
  return n;
}
