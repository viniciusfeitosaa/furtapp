import {
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  type BufferGeometry,
} from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import type { DensityThresholds } from "@/components/follicle/follicleConfig";
import {
  type DensityMapData,
  receptorWeightFromDensity,
  residualWeightFromDensity,
  sampleDensity,
  scalpMaskFromDensity,
} from "@/components/follicle/densityMap";
import type { HairSite, ScalpRegion } from "@/components/follicle/hairSites";

const UP_REF = new Vector3(0, 1, 0);
const X_REF = new Vector3(1, 0, 0);
const CLUMP_RADIUS = 0.0035;

function tangentBasis(n: Vector3, t1: Vector3, t2: Vector3) {
  const ref = Math.abs(n.y) < 0.9 ? UP_REF : X_REF;
  t1.crossVectors(n, ref).normalize();
  t2.crossVectors(n, t1).normalize();
}

function weightFn(region: ScalpRegion, t: DensityThresholds) {
  return region === "receptor"
    ? (d: number) => receptorWeightFromDensity(d, t)
    : (d: number) => residualWeightFromDensity(d, t);
}

/**
 * Pinta hairWeight por vértice a partir do density map UV.
 * Requer geometry.attributes.uv.
 */
function paintDensityWeights(
  geometry: BufferGeometry,
  map: DensityMapData,
  region: ScalpRegion,
  thresholds: DensityThresholds,
) {
  const uv = geometry.attributes.uv;
  if (!uv) {
    throw new Error(
      "[hairSitesDensity] geometria sem UVs — exporte o GLB com UV map",
    );
  }
  const count = uv.count;
  const weights = new Float32Array(count);
  const toW = weightFn(region, thresholds);
  for (let i = 0; i < count; i += 1) {
    const d = sampleDensity(map, uv.getX(i), uv.getY(i));
    weights[i] = toW(d);
  }
  geometry.setAttribute("hairWeight", new Float32BufferAttribute(weights, 1));
}

/** Gera sítios de cabelo guiados pelo density map (fotogrametria). */
export function buildHairSitesFromDensity(
  geometry: BufferGeometry,
  count: number,
  region: ScalpRegion,
  map: DensityMapData,
  thresholds: DensityThresholds,
): HairSite[] {
  const geo = geometry.clone();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  paintDensityWeights(geo, map, region, thresholds);

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
  const clump = region === "residual";

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

    // Peso já veio do atributo; aceitação extra para bordas orgânicas
    // (aproximação: se o sampler colocou aqui, o peso local era > 0)
    if (Math.random() < 0.08) continue;

    if (!clump) {
      pushHair(p, nrm, 1);
      continue;
    }

    let unit = 1;
    if (Math.random() < 0.55) unit = 2;
    if (Math.random() < 0.25) unit = 3;

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
      const grow = 0.75 + Math.random() * 0.25;
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

/** Atributos de sombra/máscara a partir do density map (por vértice). */
export function buildScalpShadesFromDensity(
  geometry: BufferGeometry,
  map: DensityMapData,
  thresholds: DensityThresholds,
): { residual: Float32Array; receptor: Float32Array; surface: Float32Array } {
  const uv = geometry.attributes.uv;
  if (!uv) {
    throw new Error("[hairSitesDensity] geometria sem UVs");
  }
  const n = uv.count;
  const residual = new Float32Array(n);
  const receptor = new Float32Array(n);
  const surface = new Float32Array(n);
  const SHADE = 0.45;

  for (let i = 0; i < n; i += 1) {
    const d = sampleDensity(map, uv.getX(i), uv.getY(i));
    const rw = residualWeightFromDensity(d, thresholds);
    const gw = receptorWeightFromDensity(d, thresholds);
    residual[i] = 1 - SHADE * rw;
    receptor[i] = 1 - SHADE * gw;
    surface[i] = scalpMaskFromDensity(d, thresholds);
  }

  return { residual, receptor, surface };
}
