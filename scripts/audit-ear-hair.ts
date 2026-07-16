import { readFileSync } from "fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Vector3, type BufferGeometry, type Mesh } from "three";
import {
  buildHairSites,
  countEarHairSites,
  residualDensity,
} from "../src/components/follicle/hairSites.ts";

type Bounds = {
  minY: number;
  spanY: number;
  minX: number;
  spanX: number;
  minZ: number;
  spanZ: number;
};

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
  const bb = geo.boundingBox!;
  const b: Bounds = {
    minY: bb.min.y,
    spanY: bb.max.y - bb.min.y || 1,
    minX: bb.min.x,
    spanX: bb.max.x - bb.min.x || 1,
    minZ: bb.min.z,
    spanZ: bb.max.z - bb.min.z || 1,
  };

  const residual = buildHairSites(geo, 16000, "residual");
  const receptor = buildHairSites(geo, 4000, "receptor");
  const er = countEarHairSites(residual, geo);
  const ee = countEarHairSites(receptor, geo);

  const p = new Vector3();
  const setNorm = (xnAbs: number, yn: number, zn: number) => {
    const nx = 0.5 + xnAbs * 0.5;
    p.set(b.minX + nx * b.spanX, b.minY + yn * b.spanY, b.minZ + zn * b.spanZ);
  };

  const probes = [
    ["above-ear parietal", 0.48, 0.82, 0.4, new Vector3(0.35, 0.85, -0.15)],
    ["above-ear high", 0.5, 0.86, 0.38, new Vector3(0.4, 0.85, -0.1)],
    ["behind-ear", 0.5, 0.72, 0.28, new Vector3(0.45, 0.6, -0.5)],
    ["ear-pinna", 0.65, 0.64, 0.45, new Vector3(0.9, 0.2, 0.1)],
    ["ear-mid", 0.58, 0.64, 0.48, new Vector3(0.85, 0.25, 0.1)],
    ["side-crown", 0.4, 0.8, 0.35, new Vector3(0.3, 0.85, -0.2)],
  ] as const;

  const samples = probes.map(([label, xn, yn, zn, nn]) => {
    setNorm(xn, yn, zn);
    return { label, d: residualDensity(p, nn.clone().normalize(), b) };
  });

  // Quantos fios residuais caem na faixa "suspeita" perto da orelha
  let nearEarBand = 0;
  for (const s of residual) {
    const x = Math.abs((s.position.x - b.minX) / b.spanX - 0.5) * 2;
    const y = (s.position.y - b.minY) / b.spanY;
    const z = (s.position.z - b.minZ) / b.spanZ;
    if (x > 0.52 && y > 0.54 && y < 0.74 && z > 0.34 && z < 0.58) nearEarBand += 1;
  }

  console.log(
    JSON.stringify(
      {
        residual: residual.length,
        receptor: receptor.length,
        earResidual: er,
        earReceptor: ee,
        nearEarBandSites: nearEarBand,
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
