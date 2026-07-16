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

export type ScalpRegion = "receptor" | "donor";

/**
 * Peso por vértice conforme a região:
 * - receptor: topo + linha anterior (onde entram os enxertos)
 * - donor: laterais + nuca (cabelo raspado permanente)
 */
function paintWeight(geometry: BufferGeometry, region: ScalpRegion) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const count = pos.count;
  const weights = new Float32Array(count);

  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const minY = bb.min.y;
  const spanY = bb.max.y - bb.min.y || 1;

  const n = new Vector3();
  for (let i = 0; i < count; i += 1) {
    n.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
    const y01 = (pos.getY(i) - minY) / spanY;
    let w = 0;

    if (region === "receptor") {
      if (n.y > 0.15) w = (n.y - 0.15) / 0.85; // topo
      if (n.z < -0.1 && y01 > 0.6) w = Math.max(w, 0.55); // coroa/atrás alto
      w *= Math.min(1, Math.max(0, (y01 - 0.5) / 0.25 + 0.3));
      if (n.z > 0.4 && y01 < 0.74) w = 0; // remove face
      if (y01 < 0.55) w = 0;
    } else {
      // Donor: laterais e nuca, faixa média (abaixo do topo)
      const lateral = Math.abs(n.x); // normais laterais
      const back = n.z < -0.05 ? 1 : 0;
      if (y01 > 0.32 && y01 < 0.66 && n.y < 0.35) {
        w = Math.max(lateral, back * 0.9);
      }
      if (n.z > 0.35 && y01 < 0.7) w = 0; // remove face
    }

    weights[i] = Math.max(0, Math.min(1, w));
  }

  geometry.setAttribute("hairWeight", new Float32BufferAttribute(weights, 1));
}

/**
 * Semeia `count` folículos sobre a superfície real do crânio.
 * Receptor é ordenado da linha anterior para trás (preenchimento natural).
 */
export function buildHairSites(
  geometry: BufferGeometry,
  count: number,
  region: ScalpRegion = "receptor",
): HairSite[] {
  const geo = geometry.clone();
  paintWeight(geo, region);

  const mesh = new Mesh(geo, new MeshBasicMaterial());
  const sampler = new MeshSurfaceSampler(mesh)
    .setWeightAttribute("hairWeight")
    .build();

  const sites: HairSite[] = [];
  const p = new Vector3();
  const nrm = new Vector3();
  for (let i = 0; i < count; i += 1) {
    sampler.sample(p, nrm);
    sites.push({
      position: p.clone(),
      normal: nrm.clone().normalize(),
      jitter: Math.random(),
    });
  }

  if (region === "receptor") {
    sites.sort((a, b) => {
      const pa = a.position.z * 0.65 + a.position.y * 0.35;
      const pb = b.position.z * 0.65 + b.position.y * 0.35;
      return pb - pa;
    });
  }

  geo.dispose();
  return sites;
}
