import { readFileSync } from "fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Vector3, type BufferGeometry, type Mesh } from "three";
import {
  buildHairSites,
  computeHeadMetrics,
  countEarHairSites,
  residualDensity,
} from "../src/components/follicle/hairSites";

async function main() {
  const buf = readFileSync("./public/models/head.glb");
  const loader = new GLTFLoader();
  const gltf = await new Promise((res, rej) => {
    loader.parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      "",
      res,
      rej,
    );
  });
  let geo: BufferGeometry | null = null;
  (gltf as { scene: { traverse: (fn: (o: Mesh) => void) => void } }).scene.traverse(
    (o) => {
      if (o.isMesh && !geo) geo = o.geometry as BufferGeometry;
    },
  );
  if (!geo) throw new Error("no geometry");
  geo.computeBoundingBox();
  geo.computeVertexNormals();

  const m = computeHeadMetrics(geo);
  const residual = buildHairSites(geo, 20000, "residual");
  const receptor = buildHairSites(geo, 4000, "receptor");
  const er = countEarHairSites(residual, geo);
  const ee = countEarHairSites(receptor, geo);

  const p = new Vector3();
  const probes = [
    ["crown", 0, 3.5, 0, new Vector3(0, 1, 0)],
    ["side-L", 1.4, 2.2, -0.2, new Vector3(0.7, 0.5, 0)],
    ["side-R", -1.4, 2.2, -0.2, new Vector3(-0.7, 0.5, 0)],
    ["occipital", 0, 2.0, -1.8, new Vector3(0, 0.4, -0.8)],
    ["above-ear", 1.45, 2.4, -0.3, new Vector3(0.5, 0.7, -0.1)],
    ["ear-tip", 1.85, 1.5, -0.1, new Vector3(0.95, 0.05, 0.1)],
    ["ear-body", 1.75, 1.4, -0.2, new Vector3(0.9, 0.1, 0)],
    ["forehead", 0, 2.2, 2.2, new Vector3(0, 0.2, 0.9)],
  ] as const;

  const samples = probes.map(([label, x, y, z, n]) => {
    p.set(x, y, z);
    return {
      label,
      d: residualDensity(p, n.clone().normalize(), m),
    };
  });

  // Cobertura: valores médios de density por região via sampling vertices
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  let scalpW = 0;
  let scalpN = 0;
  const tp = new Vector3();
  const tn = new Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    tp.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    tn.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
    if (tp.y < m.scalpY0) continue;
    if (Math.abs(tp.x) > m.earX) continue;
    scalpW += residualDensity(tp, tn, m);
    scalpN += 1;
  }

  console.log(
    JSON.stringify(
      {
        metrics: m,
        residual: residual.length,
        receptor: receptor.length,
        earResidual: er,
        earReceptor: ee,
        scalpAvgDensity: scalpN ? scalpW / scalpN : 0,
        probes: samples,
      },
      null,
      2,
    ),
  );
  if (er > 0 || ee > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
