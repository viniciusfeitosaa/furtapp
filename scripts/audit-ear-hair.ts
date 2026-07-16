import { readFileSync } from "fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { BufferGeometry, Mesh } from "three";
import {
  buildHairSites,
  countEarHairSites,
} from "../src/components/follicle/hairSites.ts";

async function main() {
  const buf = readFileSync("./public/models/head.glb");
  const loader = new GLTFLoader();
  const gltf = await new Promise<Awaited<ReturnType<typeof loader.parse>>>((res, rej) => {
    loader.parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      "",
      res,
      rej,
    );
  });
  let geo: BufferGeometry | null = null;
  gltf.scene.traverse((o) => {
    const m = o as Mesh;
    if (m.isMesh && !geo) geo = m.geometry as BufferGeometry;
  });
  if (!geo) throw new Error("no geometry");
  geo.computeBoundingBox();
  geo.computeVertexNormals();

  const residual = buildHairSites(geo, 12000, "residual");
  const receptor = buildHairSites(geo, 3000, "receptor");
  const er = countEarHairSites(residual, geo);
  const ee = countEarHairSites(receptor, geo);
  console.log(
    JSON.stringify(
      {
        residual: residual.length,
        receptor: receptor.length,
        earResidual: er,
        earReceptor: ee,
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
