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
  /** Escala de comprimento do fio (costeleta/bordas mais curtas). */
  grow: number;
};

export type ScalpRegion = "receptor" | "residual";

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

const EAR = { cx: 1.74, cy: 1.32, cz: -0.06, rx: 0.3, ry: 0.86, rz: 0.62 };

function earDist2(p: Vector3): number {
  const dx = (Math.abs(p.x) - EAR.cx) / EAR.rx;
  const dy = (p.y - EAR.cy) / EAR.ry;
  const dz = (p.z - EAR.cz) / EAR.rz;
  return dx * dx + dy * dy + dz * dz;
}

/** Densidade até a raiz da orelha — fade só dentro da pinna. */
function earKeep(p: Vector3): number {
  return smoothstep(0.85, 1.15, earDist2(p));
}

/**
 * Interior profundo da pinna (cartilagem).
 * Apertado de propósito: a orelha E da malha é maior que a D;
 * um limiar alto apagava a costeleta esquerda.
 */
function isEar(p: Vector3): boolean {
  return earDist2(p) < 0.5;
}

/** Faixa da costeleta (ambos os lados via |x|). */
function inSideburnCorridor(p: Vector3): boolean {
  const ax = Math.abs(p.x);
  return (
    ax > 1.15 &&
    ax < 1.88 &&
    p.y > 0.45 &&
    p.y < 2.3 &&
    p.z > -0.3 &&
    p.z < 1.15
  );
}

/**
 * Rosto: bloqueia miolo + bochecha para o cabelo do crânio.
 * A costeleta reentra depois via Math.max(sideburnMask) com fade longo —
 * é isso que evita o "bloco" cortado reto.
 */
function faceKeep(p: Vector3, n: Vector3): number {
  let f = 1;
  const ax = Math.abs(p.x);
  const central =
    (1 - smoothstep(0.85, 1.15, ax)) *
    smoothstep(0.85, 1.15, p.z) *
    (1 - smoothstep(2.45, 2.85, p.y));
  f *= 1 - clamp01(central);
  // Bochecha: tira o cabelo de crânio; costeleta volta com taper
  const cheek =
    smoothstep(0.95, 1.35, p.z) *
    (1 - smoothstep(2.35, 2.9, p.y)) *
    smoothstep(0.95, 1.3, ax);
  f *= 1 - clamp01(cheek);
  const forehead =
    smoothstep(1.45, 1.75, p.z) * (1 - smoothstep(2.95, 3.25, p.y));
  f *= 1 - clamp01(forehead);
  const jaw = smoothstep(0.55, 0.95, p.z) * (1 - smoothstep(0.35, 0.65, p.y));
  f *= 1 - clamp01(jaw);
  if (n.y < -0.55 && p.z > 0.2) f = 0;
  return clamp01(f);
}

function isDeepFace(p: Vector3, n: Vector3): boolean {
  // Só rejeita o miolo facial — nunca a faixa da costeleta
  return faceKeep(p, n) < 0.2 && Math.abs(p.x) < 1.15;
}

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

function napeKeep(p: Vector3): number {
  const back = 1 - smoothstep(-0.55, 0.75, p.z);
  const side = smoothstep(0.85, 1.55, Math.abs(p.x));
  const yCut = mix(0.02, 0.28, back * back) - side * 0.08;
  return smoothstep(yCut - 0.32, yCut + 0.48, p.y);
}

/**
 * Costeleta em cunha / lágrima (formato real), NÃO faixa reta:
 *
 *   temple (y alto)  → larga, avança na bochecha
 *   meio             → borda frontal diagonal (recua com y)
 *   lóbulo (y baixo) → ponta fina colada na orelha
 *
 * zMax(y) define a diagonal clássica da frente.
 */
function sideburnMask(
  p: Vector3,
  n: Vector3,
): { density: number; grow: number } {
  const ax = Math.abs(p.x);

  const lateral = smoothstep(1.2, 1.4, ax) * (1 - smoothstep(1.7, 1.9, ax));
  if (lateral <= 0.02) return { density: 0, grow: 1 };

  // 0 no lóbulo → 1 no temple
  const y01 = clamp01((p.y - 0.48) / (2.1 - 0.48));
  if (y01 <= 0) return { density: 0, grow: 1 };
  const topCap = 1 - smoothstep(2.0, 2.4, p.y);
  // Ponta inferior arredondada (some antes do pescoço)
  const tip = smoothstep(0.48, 0.85, p.y);

  // Diagonal frontal: larga em cima, fina embaixo
  // y≈0.55 → zMax≈0.22 | y≈1.2 → zMax≈0.55 | y≈2.0 → zMax≈0.95
  const zMax = mix(0.2, 0.98, Math.pow(y01, 0.85));
  const zMin = mix(0.05, -0.2, y01);

  const span = Math.max(zMax - zMin, 1e-3);
  const zT = (p.z - zMin) / span;
  if (zT < -0.2 || zT > 1.2) return { density: 0, grow: 1 };

  const inBack = smoothstep(-0.15, 0.12, zT);
  // Borda frontal macia (a diagonal “de verdade”)
  const inFront = 1 - smoothstep(0.55, 1.02, zT);
  const inWedge = inBack * inFront;

  const facing = smoothstep(-0.6, 0.2, n.z);
  const core = lateral * topCap * tip * inWedge * Math.max(facing, 0.45);
  if (core <= 0.03) return { density: 0, grow: 1 };

  // Cheia junto à orelha; rareia na diagonal
  const densCore = mix(0.55, 1, 1 - clamp01(zT * 1.1));
  const densY = mix(0.55, 1, y01);
  const density = clamp01(core * densCore * densY);

  const grow = mix(
    0.12,
    1,
    clamp01(densY * densCore * smoothstep(0.55, 1, tip)),
  );

  return { density, grow };
}

/** Bridge denso logo acima da orelha. */
function aboveEarMask(p: Vector3): number {
  return (
    band(Math.abs(p.x), 1.25, 1.75, 0.28) *
    band(p.y, 1.75, 2.75, 0.35) *
    band(p.z, -0.65, 0.55, 0.35)
  );
}

export function residualDensity(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  if (isNeck(p, n)) return 0;
  // Pinna profunda: sem fio (mas a costeleta ao redor continua)
  if (isEar(p) && !inSideburnCorridor(p)) return 0;

  const keepNape = napeKeep(p);
  if (keepNape <= 0.05) return 0;

  const kEar = earKeep(p);
  const keepFace = faceKeep(p, n);
  // Base do crânio — pode ser 0 perto da orelha (earKeep); costeleta entra depois
  let d = kEar > 0 ? keepNape * kEar * keepFace : 0;

  // Apaga o retângulo de cabelo de crânio na faixa da costeleta
  // (senão a cunha some por baixo da faixa reta).
  const ax = Math.abs(p.x);
  const sideRect =
    smoothstep(1.15, 1.38, ax) *
    (1 - smoothstep(1.7, 1.92, ax)) *
    smoothstep(0.3, 0.55, p.y) *
    (1 - smoothstep(2.05, 2.45, p.y)) *
    smoothstep(-0.35, 0.0, p.z);
  d *= 1 - clamp01(sideRect) * 0.97;
  // Abaixo da ponta da costeleta: zero residual lateral (sem “barra” no maxilar)
  const belowTip =
    smoothstep(1.15, 1.38, ax) *
    (1 - smoothstep(0.55, 0.75, p.y)) *
    smoothstep(-0.2, 0.15, p.z);
  d *= 1 - clamp01(belowTip);

  // Vão acima da orelha (ambos os lados; não depende de earKeep=0)
  d = Math.max(
    d,
    clamp01(aboveEarMask(p)) * keepNape * Math.max(kEar, 0.65),
  );

  // Costeleta em cunha — ESPELHADA (|x|). Ignora earKeep e o elipsoide
  // largo da orelha E, que apagava o lado esquerdo.
  const sb = sideburnMask(p, n);
  if (sb.density > 0.02 && !isEar(p)) {
    d = Math.max(d, sb.density * keepNape);
  }

  d *= 1 - receptorDensity(p, n, m);
  return clamp01(d);
}

/** Grow local para residual (encurta bordas da costeleta). */
function residualGrow(p: Vector3, n: Vector3, density: number): number {
  const sb = sideburnMask(p, n);
  if (sb.density > 0.05) {
    // Na costeleta: usa o taper; mistura com densidade
    return mix(sb.grow * 0.85, sb.grow, density);
  }
  // Nuca: um pouco mais curto na borda inferior
  const napeEdge = smoothstep(0.05, 0.45, napeKeep(p));
  return mix(0.65, 1, napeEdge);
}

export function scalpSurfaceMask(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  void m;
  if (isNeck(p, n)) return 0;
  const sb = sideburnMask(p, n);
  const base = napeKeep(p) * earKeep(p) * faceKeep(p, n);
  return clamp01(Math.max(base, sb.density * napeKeep(p) * earKeep(p)));
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
  const maxTries = count * 140;
  const clumpRadius = isResidual
    ? CLUMP_RADIUS_RESIDUAL
    : CLUMP_RADIUS_RECEPTOR;

  const pushHair = (pos: Vector3, normal: Vector3, grow: number) => {
    sites.push({
      position: pos.clone(),
      normal: normal.clone(),
      jitter: Math.random(),
      grow,
    });
  };

  for (let tries = 0; sites.length < count && tries < maxTries; tries += 1) {
    sampler.sample(p, nrm);
    nrm.normalize();
    const d = dens(p, nrm, m);

    if (d < 0.04) continue;
    if (Math.random() > Math.min(1, d + 0.08)) continue;

    // Hard rejects: pinna profunda e pescoço.
    // Costeleta (corredor lateral) não é rejeitada por isEar — a orelha E
    // da malha é maior e engolia o lado esquerdo.
    if (isNeck(p, nrm)) continue;
    if (isEar(p) && !inSideburnCorridor(p)) continue;
    if (isDeepFace(p, nrm)) continue;

    if (!isResidual) {
      pushHair(p, nrm, 1);
      continue;
    }

    const grow = residualGrow(p, nrm, d);

    let unitSize = 1;
    if (d > 0.55 && Math.random() < d * 0.9) unitSize = 2;
    if (d > 0.8 && Math.random() < d * 0.7) unitSize = 3;

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
        .addScaledVector(t1, (Math.random() - 0.5) * 0.18)
        .addScaledVector(t2, (Math.random() - 0.5) * 0.18)
        .normalize();
      if (isNeck(hp, hn) || isDeepFace(hp, hn)) continue;
      if (isEar(hp) && !inSideburnCorridor(hp)) continue;
      pushHair(hp, hn, grow);
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
    if (isDeepFace(s.position, s.normal)) n += 1;
  }
  return n;
}
