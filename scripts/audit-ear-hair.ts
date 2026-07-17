import { readFileSync } from "fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Vector3, type BufferGeometry, type Mesh } from "three";
import {
  buildHairSites,
  computeHeadMetrics,
  countEarHairSites,
  countFaceHairSites,
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

  const p = new Vector3();
  const probes = [
    ["crown", 0, 3.5, 0, new Vector3(0, 1, 0)],
    ["side", 1.4, 2.2, -0.2, new Vector3(0.7, 0.5, 0)],
    ["occipital", 0, 2.0, -1.8, new Vector3(0, 0.4, -0.8)],
    ["ear", 1.8, 1.5, -0.1, new Vector3(0.95, 0.05, 0.1)],
    ["nose", 0, 1.1, 2.55, new Vector3(0, -0.1, 0.98)],
    ["eye", 0.45, 2.15, 2.15, new Vector3(0, -0.05, 0.98)],
    ["mouth", 0, 0.5, 2.1, new Vector3(0, 0, 0.95)],
    ["forehead-low", 0, 2.0, 2.2, new Vector3(0, 0.15, 0.9)],
  ] as const;

  const samples = probes.map(([label, x, y, z, n]) => {
    p.set(x, y, z);
    return { label, d: residualDensity(p, n.clone().normalize(), m) };
  });

  console.log(
    JSON.stringify(
      {
        earResidual: countEarHairSites(residual, geo),
        earReceptor: countEarHairSites(receptor, geo),
        faceResidual: countFaceHairSites(residual, geo),
        faceReceptor: countFaceHairSites(receptor, geo),
        residual: residual.length,
        probes: samples,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
