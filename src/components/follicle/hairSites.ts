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

/**
 * Pinna medida na malha real: |x| 1.62–1.90, y 0.68–2.0, z −0.50–0.33.
 * Elipsoide com margem — nada de fio dentro.
 */
const EAR = { cx: 1.74, cy: 1.32, cz: -0.06, rx: 0.3, ry: 0.86, rz: 0.62 };

function earDist2(p: Vector3): number {
  const dx = (Math.abs(p.x) - EAR.cx) / EAR.rx;
  const dy = (p.y - EAR.cy) / EAR.ry;
  const dz = (p.z - EAR.cz) / EAR.rz;
  return dx * dx + dy * dy + dz * dz;
}

/** 0 dentro da orelha, 1 fora (fade curto na borda). */
function earKeep(p: Vector3): number {
  return smoothstep(1.0, 1.45, earDist2(p));
}

function isEar(p: Vector3): boolean {
  return earDist2(p) < 1.1;
}

/**
 * Rosto (testa/olhos/nariz/boca/queixo/mandíbula) como fatores contínuos.
 * 1 = pode ter cabelo, 0 = rosto.
 */
function faceKeep(p: Vector3, n: Vector3): number {
  let f = 1;
  // Bloco central do rosto (olhos/nariz/boca) — frente, centro, abaixo da linha capilar
  const central =
    (1 - smoothstep(1.05, 1.35, Math.abs(p.x))) *
    smoothstep(0.7, 1.0, p.z) *
    (1 - smoothstep(2.5, 2.85, p.y));
  f *= 1 - clamp01(central);
  // Bochecha / lateral do rosto (à frente da costeleta)
  const cheek =
    smoothstep(1.3, 1.55, p.z) * (1 - smoothstep(2.55, 2.85, p.y));
  f *= 1 - clamp01(cheek);
  // Testa alta até a linha capilar
  const forehead =
    smoothstep(1.5, 1.75, p.z) * (1 - smoothstep(2.9, 3.2, p.y));
  f *= 1 - clamp01(forehead);
  // Mandíbula/queixo (baixo e para frente) — deixa a costeleta viva
  const jaw = smoothstep(0.45, 0.75, p.z) * (1 - smoothstep(0.5, 0.72, p.y));
  f *= 1 - clamp01(jaw);
  // Superfícies viradas para baixo na frente (embaixo do queixo)
  if (n.y < -0.5 && p.z > 0) f = 0;
  return clamp01(f);
}

function isFace(p: Vector3, n: Vector3): boolean {
  return faceKeep(p, n) < 0.4;
}

/**
 * Entradas (têmporas) — zona receptora, vazia no Calvo.
 */
export function receptorDensity(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  if (isEar(p)) return 0;
  if (n.y < 0.1) return 0;

  const ax = Math.abs(p.x);
  const yN = (p.y - m.scalpY0) / (m.topY - m.scalpY0 || 1);

  let d = 1;
  d *= band(yN, 0.48, 0.88, 0.08);
  d *= band(p.z, 0.4, 1.3, 0.2); // só têmporas frontais
  d *= band(ax, 0.55, 1.35, 0.15);
  d *= smoothstep(0.1, 0.32, n.y);
  return clamp01(d);
}

/**
 * Pescoço / base da nuca — sem fios.
 * Na malha Lee Perry-Smith, y < ~0.25 no occipital já é pele do pescoço.
 */
function isNeck(p: Vector3, n: Vector3): boolean {
  // Superfície virada para baixo (embaixo da mandíbula / cilindro do pescoço)
  if (p.y < 0.7 && n.y < -0.2) return true;
  // Faixa baixa atrás e nas laterais (abaixo da linha da nuca)
  if (p.y < 0.2 && p.z < 0.55) return true;
  if (p.y < 0.05) return true;
  return false;
}

/** 0 no pescoço, 1 na nuca/crânio — corte limpo na linha da nuca. */
function napeKeep(p: Vector3): number {
  // Atrás: sobe o corte (sem cabelo no pescoço)
  const back = 1 - smoothstep(-0.2, 0.55, p.z); // 1 = mais atrás
  const yCut = mix(0.12, 0.38, back); // nuca mais alta que as laterais
  return smoothstep(yCut - 0.12, yCut + 0.18, p.y);
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * clamp01(t);
}

/**
 * Couro cabeludo completo (corte máquina): cobertura SÓLIDA em
 * topo, laterais, occipital, costeletas — sem falhas.
 * Exclui orelha, rosto, pescoço e as entradas.
 */
export function residualDensity(
  p: Vector3,
  n: Vector3,
  m: HeadMetrics,
): number {
  if (isNeck(p, n)) return 0;

  const keepNape = napeKeep(p);
  if (keepNape <= 0) return 0;

  const keepEar = earKeep(p);
  if (keepEar <= 0) return 0;

  const keepFace = faceKeep(p, n);

  // Cobertura base sólida sobre todo o crânio
  let d = keepNape * keepEar * keepFace;

  // Costeleta: faixa na frente da orelha, desce até o lóbulo (nunca no pescoço)
  const sideburn =
    band(Math.abs(p.x), 1.3, 1.78, 0.14) *
    band(p.y, 0.62, 1.6, 0.16) *
    band(p.z, 0.3, 0.95, 0.16) *
    keepEar;
  d = Math.max(d, clamp01(sideburn) * keepNape);

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
    if (isEar(p) || isFace(p, nrm) || isNeck(p, nrm)) continue;

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
      if (isEar(hp) || isFace(hp, hn) || isNeck(hp, hn)) continue;
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
