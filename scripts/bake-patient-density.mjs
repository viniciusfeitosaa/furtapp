/**
 * Gera demo assets do modo A a partir da cabeça Lee Perry-Smith já no repo.
 * Rasteriza residual/receptor (mesmas heurísticas do legado) no atlas UV.
 *
 * Uso: node scripts/bake-patient-density.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MODELS = path.join(ROOT, "public/models");
const OUT = path.join(MODELS, "patient");
const SIZE = 1024;

const BLACK_MAX = 0.12;
const GRAY_PEAK = 0.38;
const WHITE_MIN = 0.55;

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function mix(a, b, t) {
  return a + (b - a) * clamp01(t);
}
function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}
function band(v, lo, hi, e) {
  return smoothstep(lo - e, lo, v) * (1 - smoothstep(hi, hi + e, v));
}

const EAR = { cx: 1.74, cy: 1.32, cz: -0.06, rx: 0.3, ry: 0.86, rz: 0.62 };

function earDist2(p) {
  const dx = (Math.abs(p.x) - EAR.cx) / EAR.rx;
  const dy = (p.y - EAR.cy) / EAR.ry;
  const dz = (p.z - EAR.cz) / EAR.rz;
  return dx * dx + dy * dy + dz * dz;
}
function earKeep(p) {
  return smoothstep(0.85, 1.15, earDist2(p));
}
function isEar(p) {
  return earDist2(p) < 0.72;
}
function isEye(p) {
  return Math.abs(p.x) < 0.95 && p.y > 1.5 && p.y < 2.4 && p.z > 1.05;
}
function isCheek(p) {
  const ax = Math.abs(p.x);
  return ax > 0.5 && ax < 1.6 && p.y > 0.65 && p.y < 2.25 && p.z > 1.05;
}
function isBelowEar(p) {
  const ax = Math.abs(p.x);
  return ax > 1.15 && ax < 1.98 && p.y < 0.65 && p.z > -0.65 && p.z < 0.65;
}
function faceKeep(p, n) {
  if (isEye(p) || isCheek(p) || isBelowEar(p)) return 0;
  let f = 1;
  const ax = Math.abs(p.x);
  const central =
    (1 - smoothstep(0.75, 1.1, ax)) *
    smoothstep(0.75, 1.05, p.z) *
    (1 - smoothstep(2.4, 2.85, p.y));
  f *= 1 - clamp01(central);
  const cheek =
    smoothstep(0.85, 1.15, p.z) *
    (1 - smoothstep(2.3, 2.85, p.y)) *
    smoothstep(0.7, 1.2, ax);
  f *= 1 - clamp01(cheek);
  const forehead =
    smoothstep(1.35, 1.7, p.z) * (1 - smoothstep(2.9, 3.25, p.y));
  f *= 1 - clamp01(forehead);
  const jaw = smoothstep(0.45, 0.9, p.z) * (1 - smoothstep(0.4, 0.7, p.y));
  f *= 1 - clamp01(jaw);
  if (n.y < -0.5 && p.z > 0.15) f = 0;
  return clamp01(f);
}
function isNeck(p, n) {
  if (p.y < -0.2) return true;
  if (p.y < 0.45 && n.y < -0.55) return true;
  return false;
}
function napeKeep(p) {
  const back = 1 - smoothstep(-0.55, 0.75, p.z);
  const side = smoothstep(0.85, 1.55, Math.abs(p.x));
  const yCut = mix(0.02, 0.28, back * back) - side * 0.08;
  return smoothstep(yCut - 0.32, yCut + 0.48, p.y);
}
function sideburnMask(p, n) {
  const ax = Math.abs(p.x);
  const lateral = smoothstep(1.2, 1.4, ax) * (1 - smoothstep(1.7, 1.9, ax));
  if (lateral <= 0.02) return 0;
  if (isEye(p) || isCheek(p) || isBelowEar(p)) return 0;
  const y01 = clamp01((p.y - 0.68) / (2.1 - 0.68));
  if (y01 <= 0) return 0;
  const topCap = 1 - smoothstep(2.0, 2.4, p.y);
  const tip = smoothstep(0.68, 0.98, p.y);
  const zMax = mix(0.2, 0.88, Math.pow(y01, 0.85));
  const zMin = mix(0.02, -0.18, y01);
  const span = Math.max(zMax - zMin, 1e-3);
  const zT = (p.z - zMin) / span;
  if (zT < -0.2 || zT > 1.2) return 0;
  const inWedge =
    smoothstep(-0.15, 0.12, zT) * (1 - smoothstep(0.55, 1.02, zT));
  const facing = smoothstep(-0.6, 0.2, n.z);
  const core = lateral * topCap * tip * inWedge * Math.max(facing, 0.45);
  if (core <= 0.03) return 0;
  const densCore = mix(0.55, 1, 1 - clamp01(zT * 1.1));
  const densY = mix(0.55, 1, y01);
  return clamp01(core * densCore * densY);
}
function aboveEarMask(p) {
  return (
    band(Math.abs(p.x), 1.25, 1.75, 0.28) *
    band(p.y, 1.75, 2.75, 0.35) *
    band(p.z, -0.65, 0.55, 0.35)
  );
}
function computeHeadMetrics(geometry) {
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const pos = geometry.attributes.position;
  const topY = bb.max.y;
  const midLo = bb.min.y + (bb.max.y - bb.min.y) * 0.48;
  const midHi = bb.min.y + (bb.max.y - bb.min.y) * 0.78;
  const vaultXs = [];
  const midXs = [];
  for (let i = 0; i < pos.count; i += 1) {
    const x = Math.abs(pos.getX(i));
    const y = pos.getY(i);
    if (y > midHi) vaultXs.push(x);
    if (y >= midLo && y <= midHi) midXs.push(x);
  }
  vaultXs.sort((a, b) => a - b);
  midXs.sort((a, b) => a - b);
  const pct = (arr, p) =>
    arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] ?? 1.5;
  const vaultW = pct(vaultXs, 0.97);
  const midW = pct(midXs, 0.995);
  return {
    earX: vaultW + (midW - vaultW) * 0.35,
    scalpY0: bb.min.y + (bb.max.y - bb.min.y) * 0.52,
    topY,
  };
}
function receptorDensity(p, n, m) {
  if (isEar(p) || isEye(p) || isCheek(p) || isBelowEar(p)) return 0;
  if (n.y < 0.12) return 0;
  const ax = Math.abs(p.x);
  const yN = (p.y - m.scalpY0) / (m.topY - m.scalpY0 || 1);
  const crown = smoothstep(0.72, 0.9, yN) * (1 - smoothstep(0.55, 0.95, p.z));
  if (crown > 0.55) return 0;
  let d = 1;
  d *= band(yN, 0.52, 0.82, 0.14);
  d *= smoothstep(0.55, 0.95, p.z) * (1 - smoothstep(1.35, 1.65, p.z));
  d *= smoothstep(0.7, 1.05, ax) * (1 - smoothstep(1.4, 1.65, ax));
  d *= smoothstep(0.12, 0.35, n.y);
  return clamp01(d);
}
function residualDensity(p, n, m) {
  if (isNeck(p, n)) return 0;
  if (isEye(p) || isCheek(p) || isBelowEar(p)) return 0;
  const keepNape = napeKeep(p);
  if (keepNape <= 0.05) return 0;
  const kEar = earKeep(p);
  if (kEar <= 0) return 0;
  const keepFace = faceKeep(p, n);
  let d = keepNape * kEar * keepFace;
  const ax = Math.abs(p.x);
  const sideRect =
    smoothstep(1.15, 1.38, ax) *
    (1 - smoothstep(1.7, 1.92, ax)) *
    smoothstep(0.3, 0.55, p.y) *
    (1 - smoothstep(2.05, 2.45, p.y)) *
    smoothstep(-0.35, 0.0, p.z);
  d *= 1 - clamp01(sideRect) * 0.97;
  const belowTip =
    smoothstep(1.15, 1.4, ax) *
    (1 - smoothstep(0.65, 0.85, p.y)) *
    smoothstep(-0.35, 0.2, p.z);
  d *= 1 - clamp01(belowTip);
  d = Math.max(d, clamp01(aboveEarMask(p)) * keepNape * kEar);
  const sb = sideburnMask(p, n);
  if (sb > 0.02 && earDist2(p) >= 0.72) d = Math.max(d, sb * keepNape);
  d *= 1 - receptorDensity(p, n, m);
  return clamp01(d);
}

function encodeDensity(residual, receptor) {
  if (receptor > 0.02) return mix(WHITE_MIN, 1, receptor);
  if (residual > 0.02) return mix(BLACK_MAX + 0.04, GRAY_PEAK + 0.08, residual);
  return 0;
}

function loadGlb(filePath) {
  return new Promise((resolve, reject) => {
    const buf = fs.readFileSync(filePath);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const loader = new GLTFLoader();
    loader.parse(ab, "", resolve, reject);
  });
}

function firstGeometry(scene) {
  let geo = null;
  scene.traverse((o) => {
    if (!geo && o.isMesh) geo = o.geometry;
  });
  if (!geo) throw new Error("Nenhuma malha no GLB");
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) throw new Error("GLB sem UVs");
  return g;
}

function orient2d(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function bake(geometry) {
  const m = computeHeadMetrics(geometry);
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  const dens = new Float32Array(SIZE * SIZE);
  const cover = new Uint8Array(SIZE * SIZE);
  const p = new Vector3();
  const n = new Vector3();
  const triCount = pos.count / 3;

  for (let t = 0; t < triCount; t += 1) {
    const i0 = t * 3;
    const i1 = i0 + 1;
    const i2 = i0 + 2;

    const u0 = uv.getX(i0);
    const v0 = 1 - uv.getY(i0);
    const u1 = uv.getX(i1);
    const v1 = 1 - uv.getY(i1);
    const u2 = uv.getX(i2);
    const v2 = 1 - uv.getY(i2);

    if (
      Math.max(Math.abs(u0 - u1), Math.abs(u1 - u2), Math.abs(u2 - u0)) > 0.5 ||
      Math.max(Math.abs(v0 - v1), Math.abs(v1 - v2), Math.abs(v2 - v0)) > 0.5
    ) {
      continue;
    }

    const x0 = u0 * (SIZE - 1);
    const y0 = v0 * (SIZE - 1);
    const x1 = u1 * (SIZE - 1);
    const y1 = v1 * (SIZE - 1);
    const x2 = u2 * (SIZE - 1);
    const y2 = v2 * (SIZE - 1);

    const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)) - 1);
    const maxX = Math.min(SIZE - 1, Math.ceil(Math.max(x0, x1, x2)) + 1);
    const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)) - 1);
    const maxY = Math.min(SIZE - 1, Math.ceil(Math.max(y0, y1, y2)) + 1);

    const area = orient2d(x0, y0, x1, y1, x2, y2);
    if (Math.abs(area) < 1e-6) continue;
    const inv = 1 / area;

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const w0 = orient2d(x1, y1, x2, y2, x, y) * inv;
        const w1 = orient2d(x2, y2, x0, y0, x, y) * inv;
        const w2 = orient2d(x0, y0, x1, y1, x, y) * inv;
        if (w0 < -0.01 || w1 < -0.01 || w2 < -0.01) continue;

        p.set(
          pos.getX(i0) * w0 + pos.getX(i1) * w1 + pos.getX(i2) * w2,
          pos.getY(i0) * w0 + pos.getY(i1) * w1 + pos.getY(i2) * w2,
          pos.getZ(i0) * w0 + pos.getZ(i1) * w1 + pos.getZ(i2) * w2,
        );
        n
          .set(
            nor.getX(i0) * w0 + nor.getX(i1) * w1 + nor.getX(i2) * w2,
            nor.getY(i0) * w0 + nor.getY(i1) * w1 + nor.getY(i2) * w2,
            nor.getZ(i0) * w0 + nor.getZ(i1) * w1 + nor.getZ(i2) * w2,
          )
          .normalize();

        const rec = receptorDensity(p, n, m);
        const res = residualDensity(p, n, m);
        const d = encodeDensity(res, rec);
        const idx = y * SIZE + x;
        if (d >= dens[idx]) {
          dens[idx] = d;
          cover[idx] = 1;
        }
      }
    }
  }

  const dilated = dens.slice();
  for (let y = 1; y < SIZE - 1; y += 1) {
    for (let x = 1; x < SIZE - 1; x += 1) {
      const idx = y * SIZE + x;
      if (cover[idx]) continue;
      let best = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const nidx = (y + oy) * SIZE + (x + ox);
          if (cover[nidx]) best = Math.max(best, dens[nidx]);
        }
      }
      if (best > 0) dilated[idx] = best;
    }
  }
  return dilated;
}

function saveJpeg(dens, jpgPath) {
  const gray = Buffer.alloc(SIZE * SIZE);
  for (let i = 0; i < dens.length; i += 1) {
    gray[i] = Math.round(clamp01(dens[i]) * 255);
  }
  const rawPath = path.join(OUT, ".density.raw");
  fs.writeFileSync(rawPath, gray);
  const py = [
    "from PIL import Image",
    `img = Image.frombytes('L', (${SIZE}, ${SIZE}), open(${JSON.stringify(rawPath)}, 'rb').read())`,
    `img.convert('RGB').save(${JSON.stringify(jpgPath)}, quality=92, optimize=True)`,
  ].join("; ");
  const r = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  fs.unlinkSync(rawPath);
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "falha ao salvar JPEG");
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const srcGlb = path.join(MODELS, "head.glb");
  const srcColor = path.join(MODELS, "head-albedo.jpg");
  const srcNormal = path.join(MODELS, "head-normal.jpg");

  fs.copyFileSync(srcGlb, path.join(OUT, "head.glb"));
  fs.copyFileSync(srcColor, path.join(OUT, "head_color.jpg"));
  fs.copyFileSync(srcNormal, path.join(OUT, "head_normal.jpg"));

  console.log("Carregando GLB…");
  const gltf = await loadGlb(srcGlb);
  const geometry = firstGeometry(gltf.scene);
  console.log("Rasterizando density map UV…");
  const dens = bake(geometry);
  const jpgPath = path.join(OUT, "head_density.jpg");
  saveJpeg(dens, jpgPath);

  const manifest = {
    enabled: true,
    glb: "head.glb",
    color: "head_color.jpg",
    density: "head_density.jpg",
    normal: "head_normal.jpg",
    thresholds: {
      blackMax: BLACK_MAX,
      grayPeak: GRAY_PEAK,
      whiteMin: WHITE_MIN,
    },
    notes:
      "DEMO: assets gerados a partir da cabeça Lee Perry-Smith + density bake UV (não é fotogrametria de paciente real). Troque pelos arquivos reais quando tiver.",
  };
  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  let black = 0;
  let gray = 0;
  let white = 0;
  for (let i = 0; i < dens.length; i += 1) {
    const d = dens[i];
    if (d <= BLACK_MAX) black += 1;
    else if (d < WHITE_MIN) gray += 1;
    else white += 1;
  }
  const n = dens.length;
  console.log(
    `OK → ${OUT}\n` +
      `  preto ${((100 * black) / n).toFixed(1)}% | cinza ${((100 * gray) / n).toFixed(1)}% | branco ${((100 * white) / n).toFixed(1)}%`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
