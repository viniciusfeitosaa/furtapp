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
 * - residual: cabelo remanescente (cabeça inteira, exceto entradas)
 * - receptor: zona a preencher com enxertos (entradas / têmporas)
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

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}

/** Banda suave: ~1 dentro de [lo, hi], com transição de largura `e`. */
function band(v: number, lo: number, hi: number, e: number) {
  return smoothstep(lo - e, lo, v) * (1 - smoothstep(hi, hi + e, v));
}

/**
 * Densidade da zona receptora (entradas / têmporas), 0..1 com bordas suaves.
 * É o que os enxertos preenchem — e o que fica vazio no Calvo.
 */
export function receptorDensity(p: Vector3, n: Vector3, b: Bounds): number {
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  if (n.y < 0.05) return 0;
  if (isEarRegion(x, y, z, n)) return 0;

  let m = 1;
  m *= band(y, 0.7, 0.9, 0.05); // altura das entradas
  m *= band(z, 0.5, 0.7, 0.06); // frontal / têmporas
  m *= band(x, 0.16, 0.5, 0.06); // laterais frontais (M), fora do centro
  return clamp01(m);
}

/** Região da orelha (pinna) — bloqueio preciso, sem matar o parietal. */
function isEarRegion(
  x: number,
  y: number,
  z: number,
  n: Vector3,
): boolean {
  // Ponta da orelha (máxima saliência lateral)
  if (x > 0.68) return true;
  // Corpo da pinna: lateral + altura da orelha + profundidade média + normal lateral
  if (
    x > 0.56 &&
    y > 0.54 &&
    y < 0.74 &&
    z > 0.34 &&
    z < 0.58 &&
    Math.abs(n.x) > 0.42
  ) {
    return true;
  }
  // Lobulo / raiz da orelha (um pouco mais baixo)
  if (x > 0.58 && y > 0.5 && y < 0.58 && z > 0.36 && z < 0.56) {
    return true;
  }
  return false;
}

/**
 * Máscara do couro cabeludo (inclui entradas vazias): 1 = couro, 0 = rosto.
 * Usada para aplicar textura PBR só no couro, sem “falhas” faciais.
 */
export function scalpSurfaceMask(p: Vector3, n: Vector3, b: Bounds): number {
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  if (isEarRegion(x, y, z, n)) return 0;
  if (y < 0.5) return 0;

  let m = 1;
  m *= smoothstep(0.52, 0.62, y);
  // Corta rosto/testa baixa; mantém linha frontal alta (entradas = couro limpo)
  m *= 1 - smoothstep(0.7, 0.84, z) * (1 - smoothstep(0.72, 0.86, y));
  m *= 1 - smoothstep(0.6, 0.72, x);
  if (n.y < -0.15) m *= 0;
  return clamp01(m);
}

/**
 * Densidade do cabelo remanescente (Calvo): cabeça inteira em gradiente,
 * exceto as entradas (têmporas). Sem orelha, nuca baixa, rosto.
 */
export function residualDensity(p: Vector3, n: Vector3, b: Bounds): number {
  const y = normY(p.y, b);
  const z = normZ(p.z, b);
  const x = Math.abs(normX(p.x, b) - 0.5) * 2;

  // Bloqueios anatômicos
  if (y < 0.48) return 0; // nuca / pescoço — nunca preenche
  if (z > 0.7 && y < 0.86) return 0; // rosto / testa baixa
  if (isEarRegion(x, y, z, n)) return 0;
  if (n.y < -0.2) return 0;

  // Na parte de trás, desce até a borda da nuca (sem preenchê-la)
  const back = 1 - smoothstep(0.38, 0.52, z);
  const yLo = 0.58 - 0.08 * back; // ~0.50 atrás, ~0.58 nas laterais
  const yHi = 0.66 - 0.06 * back;

  // Cobertura base com bordas suaves
  let d = 1;
  d *= smoothstep(yLo, yHi, y);
  d *= 1 - smoothstep(0.62, 0.72, z); // afina em direção ao rosto

  // Laterais: preenche bem o parietal ACIMA e ATRÁS da orelha.
  // Só atenua na aproximação da pinna (não cria buraco na lateral).
  const aboveEar = smoothstep(0.72, 0.8, y);
  const behindEar = 1 - smoothstep(0.3, 0.4, z);
  const sideSafe = Math.max(aboveEar, behindEar);
  // Em zona segura (acima/atrás), permite x até ~0.64; na altura da orelha, corta antes
  const xCutLo = 0.54 + 0.1 * sideSafe;
  const xCutHi = 0.62 + 0.08 * sideSafe;
  d *= 1 - smoothstep(xCutLo, xCutHi, x);

  // Reforço da lateral parietal (a região que costumava “faltar”)
  const parietalBoost =
    band(x, 0.22, 0.58, 0.08) *
    band(y, 0.7, 0.92, 0.05) *
    (1 - smoothstep(0.5, 0.6, z));
  d = clamp01(d + 0.35 * parietalBoost * (1 - d));

  // Leve rarefação no alto-frontal (AGA), sem esvaziar
  d *= 1 - 0.25 * smoothstep(0.55, 0.72, z) * smoothstep(0.72, 0.9, y);

  // Retira as entradas
  d *= 1 - receptorDensity(p, n, b);
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

/** Base tangente ortonormal à normal (para deslocar a unidade folicular). */
function tangentBasis(n: Vector3, t1: Vector3, t2: Vector3) {
  const ref = Math.abs(n.y) < 0.9 ? UP_REF : X_REF;
  t1.crossVectors(n, ref).normalize();
  t2.crossVectors(n, t1).normalize();
}
const UP_REF = new Vector3(0, 1, 0);
const X_REF = new Vector3(1, 0, 0);

/** Raio do agrupamento (unidade folicular) em unidades locais da malha. */
const CLUMP_RADIUS = 0.006;

/**
 * Gera os folículos. Para `residual`, agrupa em unidades foliculares
 * (clumping de 1–3 fios) conforme a densidade local, evitando o aspecto
 * de fios isolados igualmente espaçados.
 */
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
    // Barreira dura: nunca instancia fio na orelha / faixa auricular
    {
      const bx = Math.abs(normX(p.x, b) - 0.5) * 2;
      const by = normY(p.y, b);
      const bz = normZ(p.z, b);
      if (isEarRegion(bx, by, bz, nrm)) continue;
    }

    if (!clump) {
      pushHair(p, nrm);
      continue;
    }

    // Unidade folicular: 1–3 fios conforme densidade
    let unit = 1;
    if (d > 0.5 && Math.random() < d) unit = 2;
    if (d > 0.78 && Math.random() < d - 0.35) unit = 3;

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
        .addScaledVector(t1, (Math.random() - 0.5) * 0.28)
        .addScaledVector(t2, (Math.random() - 0.5) * 0.28)
        .normalize();
      const hx = Math.abs(normX(hp.x, b) - 0.5) * 2;
      const hy = normY(hp.y, b);
      const hz = normZ(hp.z, b);
      if (isEarRegion(hx, hy, hz, hn)) continue;
      pushHair(hp, hn);
    }
  }

  if (region === "receptor") {
    // Preenche entradas de fora para dentro (têmpora → centro)
    sites.sort((a, c) => {
      const pa = a.position.z * 0.7 + a.position.y * 0.3;
      const pb = c.position.z * 0.7 + c.position.y * 0.3;
      return pb - pa;
    });
  }

  geo.dispose();
  return sites.slice(0, count);
}

/**
 * Sombra de suporte do couro cabeludo: por vértice, um multiplicador de cor
 * (1 = pele limpa, <1 = sombra de cabelo denso). Preenche os vãos entre as
 * instâncias 3D, eliminando o efeito de “grama falhada”.
 * - residual: estático (cabelo do Calvo)
 * - receptor: alvo quando os enxertos estão cheios (dinâmico via uniform)
 */
export function buildScalpShades(geometry: BufferGeometry): {
  residual: Float32Array;
  receptor: Float32Array;
  surface: Float32Array;
} {
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const b = getBounds(geometry);
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const n = pos.count;
  const residual = new Float32Array(n);
  const receptor = new Float32Array(n);
  const surface = new Float32Array(n);
  const p = new Vector3();
  const nv = new Vector3();
  const SHADE = 0.55; // escurecimento máximo sob cabelo denso

  for (let i = 0; i < n; i += 1) {
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    nv.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
    residual[i] = 1 - SHADE * residualDensity(p, nv, b);
    receptor[i] = 1 - SHADE * receptorDensity(p, nv, b);
    surface[i] = scalpSurfaceMask(p, nv, b);
  }

  return { residual, receptor, surface };
}

/**
 * Conta quantos sites caem na região da orelha (auditoria).
 * Deve retornar 0 após o filtro duro.
 */
export function countEarHairSites(
  sites: HairSite[],
  geometry: BufferGeometry,
): number {
  const b = getBounds(geometry);
  let n = 0;
  for (const s of sites) {
    const x = Math.abs(normX(s.position.x, b) - 0.5) * 2;
    const y = normY(s.position.y, b);
    const z = normZ(s.position.z, b);
    if (isEarRegion(x, y, z, s.normal)) n += 1;
  }
  return n;
}
