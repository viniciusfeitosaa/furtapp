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

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}

/** Couro oval (mesmo que o canvas desenha). */
export function inScalp(x: number, y: number): boolean {
  const dx = (x - 0.5) / 0.38;
  const dy = (y - 0.42) / 0.48;
  return dx * dx + dy * dy <= 1;
}

/**
 * Peso da zona calva / enxerto (0..1).
 * Norwood frontal + entradas + coroa — bem legível no protótipo.
 */
export function graftMask(x: number, y: number): number {
  if (!inScalp(x, y)) return 0;

  const ax = Math.abs(x - 0.5);

  // Rosto / testa baixa — fora
  if (y > 0.58) return 0;

  // Entradas (têmporas) — lobos largos
  const templeL =
    Math.exp(-((x - 0.26) ** 2) / 0.018) *
    Math.exp(-((y - 0.34) ** 2) / 0.028);
  const templeR =
    Math.exp(-((x - 0.74) ** 2) / 0.018) *
    Math.exp(-((y - 0.34) ** 2) / 0.028);

  // Faixa frontal (linha anterior / M) — une as entradas
  const frontalBand =
    smoothstep(0.18, 0.28, y) *
    (1 - smoothstep(0.42, 0.5, y)) *
    smoothstep(0.08, 0.22, ax) *
    (1 - smoothstep(0.34, 0.42, ax));

  // Miolo frontal calvo (entre as entradas)
  const midFront =
    Math.exp(-((x - 0.5) ** 2) / 0.045) *
    Math.exp(-((y - 0.32) ** 2) / 0.022) *
    0.95;

  // Coroa / cume — mancha larga e evidente no topo-centro
  const crown =
    Math.exp(-((x - 0.5) ** 2) / 0.04) *
    Math.exp(-((y - 0.19) ** 2) / 0.026) *
    1.35;

  // Ponte entradas → coroa (para o slider “subir” a calvície)
  const bridge =
    Math.exp(-((x - 0.5) ** 2) / 0.06) *
    smoothstep(0.14, 0.22, y) *
    (1 - smoothstep(0.4, 0.5, y)) *
    0.95;

  return clamp01(
    Math.max(templeL, templeR) * 1.4 +
      frontalBand * 1.1 +
      midFront +
      crown +
      bridge,
  );
}

/**
 * Residual (ferradura): laterais + nuca — denso e visível.
 * Zero na zona de enxerto.
 */
export function residualMask(x: number, y: number): number {
  if (!inScalp(x, y)) return 0;
  const g = graftMask(x, y);
  if (g > 0.45) return 0;

  const dx = (x - 0.5) / 0.38;
  const dy = (y - 0.42) / 0.48;
  const r = Math.sqrt(dx * dx + dy * dy);

  // Anel externo (ferradura)
  const ring = clamp01(1 - Math.abs(r - 0.78) * 5.2);
  // Laterais densas
  const side =
    smoothstep(0.18, 0.32, Math.abs(x - 0.5)) *
    (1 - smoothstep(0.42, 0.5, Math.abs(x - 0.5))) *
    smoothstep(0.22, 0.35, y) *
    (1 - smoothstep(0.62, 0.72, y));
  // Nuca / atrás (parte inferior do oval)
  const nape =
    smoothstep(0.55, 0.68, y) *
    (1 - smoothstep(0.82, 0.92, y)) *
    (1 - smoothstep(0.28, 0.4, Math.abs(x - 0.5)));
  // Topo residual só nas bordas (não invade coroa)
  const topRim =
    smoothstep(0.08, 0.16, y) *
    (1 - smoothstep(0.22, 0.3, y)) *
    smoothstep(0.2, 0.32, Math.abs(x - 0.5));

  const raw = clamp01(ring * 0.85 + side * 0.9 + nape * 0.95 + topRim * 0.7);
  // Recua residual onde o enxerto começa
  return clamp01(raw * (1 - g * 1.2));
}

/** Densidade 0..1: preto=0, cinza residual, branco=enxerto. */
export function samplePhotoDensity(x: number, y: number): number {
  if (!inScalp(x, y)) return 0;
  // Rosto
  if (y > 0.62 && Math.abs(x - 0.5) < 0.28) return 0.02;

  const g = graftMask(x, y);
  if (g > 0.35) return clamp01(0.55 + g * 0.45);

  const r = residualMask(x, y);
  if (r > 0.08) return clamp01(0.16 + r * 0.32);

  return 0.04;
}

export function buildPhotoHairSites(countResidual: number, countGraft: number) {
  const residual: PhotoHairSite[] = [];
  const graft: PhotoHairSite[] = [];
  let i = 0;
  const maxTries = (countResidual + countGraft) * 60;

  for (
    let tries = 0;
    residual.length < countResidual && tries < maxTries;
    tries += 1
  ) {
    i += 1;
    const x = hash(i);
    const y = hash(i + 17);
    const r = residualMask(x, y);
    if (r < 0.12) continue;
    if (hash(i + 3) > r) continue;
    // Ângulo: fios “caem” para fora nas laterais
    const outward = x < 0.5 ? -0.55 : 0.55;
    residual.push({
      x,
      y,
      angle: outward + (hash(i + 5) - 0.5) * 0.5,
      len: 0.016 + hash(i + 9) * 0.014,
      kind: "residual",
    });
  }

  // Graft: amostrar a zona calva inteira (entradas + frontal + coroa),
  // depois ordenar para o slider preencher da frente → coroa.
  for (
    let tries = 0;
    graft.length < countGraft && tries < maxTries;
    tries += 1
  ) {
    i += 1;
    const x = hash(i + 1000);
    const y = hash(i + 2000);
    const g = graftMask(x, y);
    if (g < 0.35) continue;
    if (hash(i + 7) > g) continue;
    graft.push({
      x,
      y,
      angle: -0.25 + hash(i + 8) * 0.5,
      len: 0.014 + hash(i + 11) * 0.016,
      kind: "graft",
    });
  }

  // Índice 0 = linha anterior / entradas; últimos = coroa (y menor)
  graft.sort((a, b) => {
    const scoreA = a.y * 2.4 + Math.abs(a.x - 0.5) * 0.4;
    const scoreB = b.y * 2.4 + Math.abs(b.x - 0.5) * 0.4;
    return scoreB - scoreA;
  });

  return { residual, graft };
}
