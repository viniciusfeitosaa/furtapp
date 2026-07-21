/** Índices MediaPipe Face Mesh usados para estimar linha anterior / têmporas. */
export const HAIRLINE_INDICES = [
  54, 21, 162, 127, 34, 139, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389,
  356, 454, 323, 361,
] as const;

/** Ponto do queixo — vetor oposto aponta para o topo da cabeça. */
export const CHIN_INDEX = 152;
export const FOREHEAD_TOP_INDEX = 10;

export type Landmark = { x: number; y: number; z?: number };

export function pointOnVideo(
  lm: Landmark,
  width: number,
  height: number,
  mirrored: boolean,
): { x: number; y: number } {
  const x = mirrored ? (1 - lm.x) * width : lm.x * width;
  return { x, y: lm.y * height };
}
