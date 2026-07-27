#!/usr/bin/env node
/**
 * Baixa o GLB do Sketchfab (requer token de API).
 *
 * 1. Crie um token em https://sketchfab.com/settings/password
 * 2. SKETCHFAB_API_TOKEN=xxx node scripts/fetch-sketchfab-hair.mjs
 *
 * Modelo: Short Hair Cut In Layers (With Bones) — CC BY 4.0
 * https://skfb.ly/pK7T6
 */
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";

const UID = "60f13e9fa15941409654483c51add79e";
const OUT = path.resolve(
  "public/models/short_hair_cut_in_layers_with_bones.glb",
);

const token = process.env.SKETCHFAB_API_TOKEN?.trim();
if (!token) {
  console.error(
    "Defina SKETCHFAB_API_TOKEN (https://sketchfab.com/settings/password).",
  );
  console.error(
    "Ou baixe manualmente o GLB e salve em public/models/short_hair_cut_in_layers_with_bones.glb",
  );
  process.exit(1);
}

const metaRes = await fetch(
  `https://api.sketchfab.com/v3/models/${UID}/download`,
  { headers: { Authorization: `Token ${token}` } },
);
if (!metaRes.ok) {
  console.error("Download API falhou:", metaRes.status, await metaRes.text());
  process.exit(1);
}
const meta = await metaRes.json();
const glbUrl =
  meta?.glb?.url ||
  meta?.gltf?.url ||
  meta?.source?.url;

if (!glbUrl) {
  console.error("Resposta sem URL de arquivo:", JSON.stringify(meta, null, 2));
  process.exit(1);
}

console.log("Baixando…", glbUrl.split("?")[0]);
const fileRes = await fetch(glbUrl);
if (!fileRes.ok || !fileRes.body) {
  console.error("Falha no arquivo:", fileRes.status);
  process.exit(1);
}

await mkdir(path.dirname(OUT), { recursive: true });

// Se for zip glTF, avisa; preferimos glb
const ctype = fileRes.headers.get("content-type") || "";
if (ctype.includes("zip") || glbUrl.includes(".zip")) {
  const zipOut = OUT.replace(/\.glb$/, ".zip");
  await pipeline(Readable.fromWeb(fileRes.body), createWriteStream(zipOut));
  console.log(
    "Baixado como ZIP:",
    zipOut,
    "— extraia o .glb e salve como short_hair_cut_in_layers_with_bones.glb",
  );
  process.exit(0);
}

await pipeline(Readable.fromWeb(fileRes.body), createWriteStream(OUT));
console.log("OK →", OUT);
