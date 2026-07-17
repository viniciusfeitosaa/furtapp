/** Máscara procedural 2.5D (placeholder até foto + density map reais). */

export type PhotoHairSite = {
  x: number; // 0..1
  y: number;
  angle: number;
  len: number;
  kind: "residual" | "graft";
};

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function hash(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Densidade 0..1: preto=0, cinza residual, branco=enxerto. */
export function samplePhotoDensity(x: number, y: number): number {
  // Fora do couro
  const cx = 0.5;
  const cy = 0.42;
  const dx = (x - cx) / 0.38;
  const dy = (y - cy) / 0.48;
  if (dx * dx + dy * dy > 1) return 0;

  // Rosto / testa baixa (frente inferior do oval) — preto
  if (y > 0.62 && Math.abs(x - 0.5) < 0.28) return 0.02;

  // Entradas (têmporas) — branco = zona de enxerto
  const templeL =
    Math.exp(-((x - 0.28) ** 2) / 0.012) *
    Math.exp(-((y - 0.36) ** 2) / 0.02);
  const templeR =
    Math.exp(-((x - 0.72) ** 2) / 0.012) *
    Math.exp(-((y - 0.36) ** 2) / 0.02);
  const graft = clamp01(Math.max(templeL, templeR) * 1.35);
  if (graft > 0.35) return clamp01(0.55 + graft * 0.45);

  // Ferradura residual — cinza
  const ring = Math.abs(Math.sqrt(dx * dx + dy * dy) - 0.72);
  const horseshoe = clamp01(1 - ring * 4.5) * (y < 0.7 ? 1 : 0.2);
  const top = clamp01(1 - ((y - 0.22) ** 2) / 0.04) * 0.5;
  return clamp01(0.15 + horseshoe * 0.35 + top * 0.15);
}

export function buildPhotoHairSites(countResidual: number, countGraft: number) {
  const residual: PhotoHairSite[] = [];
  const graft: PhotoHairSite[] = [];
  let i = 0;
  const maxTries = (countResidual + countGraft) * 40;

  for (let tries = 0; residual.length < countResidual && tries < maxTries; tries += 1) {
    i += 1;
    const x = hash(i);
    const y = hash(i + 17);
    const d = samplePhotoDensity(x, y);
    if (d < 0.12 || d >= 0.55) continue;
    if (hash(i + 3) > (d - 0.12) / 0.43) continue;
    residual.push({
      x,
      y,
      angle: -0.4 + hash(i + 5) * 0.8,
      len: 0.012 + hash(i + 9) * 0.01,
      kind: "residual",
    });
  }

  // Graft: amostrar só zona branca, ordenar da frente (linha) para trás
  const pool: PhotoHairSite[] = [];
  for (let tries = 0; pool.length < countGraft * 2 && tries < maxTries; tries += 1) {
    i += 1;
    const x = hash(i + 1000);
    const y = hash(i + 2000);
    const d = samplePhotoDensity(x, y);
    if (d < 0.55) continue;
    pool.push({
      x,
      y,
      angle: -0.35 + hash(i + 8) * 0.7,
      len: 0.011 + hash(i + 11) * 0.012,
      kind: "graft",
    });
  }
  pool.sort((a, b) => a.y - b.y || Math.abs(a.x - 0.5) - Math.abs(b.x - 0.5));
  for (let k = 0; k < countGraft && k < pool.length; k += 1) {
    graft.push(pool[k]!);
  }

  return { residual, graft };
}
