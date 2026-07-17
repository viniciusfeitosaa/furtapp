import { readFileSync } from "fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Vector3, type BufferGeometry, type Mesh } from "three";
import {
  computeHeadMetrics,
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
  const p = new Vector3();
  const probes = [
    ["sideburn", 1.55, 1.0, 0.6, new Vector3(0.9, 0, 0.3)],
    ["above-ear", 1.5, 2.3, -0.1, new Vector3(0.8, 0.5, 0)],
    ["behind-ear", 1.5, 1.2, -0.7, new Vector3(0.8, 0, -0.4)],
    ["nape-mid", 0, -0.4, -1.9, new Vector3(0, -0.2, -0.95)],
    ["nape-low", 0, -0.8, -1.7, new Vector3(0, -0.3, -0.9)],
    ["temple-hairline", 1.1, 2.6, 1.3, new Vector3(0.4, 0.3, 0.8)],
    ["cheek", 1.2, 1.2, 1.6, new Vector3(0.6, 0, 0.75)],
  ] as const;
  for (const [label, x, y, z, n] of probes) {
    p.set(x, y, z);
    console.log(label, residualDensity(p, n.clone().normalize(), m).toFixed(2));
  }
}
main();
