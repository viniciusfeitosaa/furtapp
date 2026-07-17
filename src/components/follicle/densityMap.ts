import type { DensityThresholds } from "@/components/follicle/follicleConfig";

export type DensityMapData = {
  width: number;
  height: number;
  /** Luminância 0..1 por pixel (row-major) */
  data: Float32Array;
};

/** Carrega imagem e extrai luminância (média RGB) em 0..1. */
export async function loadDensityMap(url: string): Promise<DensityMapData> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`[densityMap] falha ao carregar ${url}: ${res.status}`);
  }
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const width = bitmap.width;
  const height = bitmap.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("[densityMap] canvas 2d indisponível");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const data = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 1, p += 4) {
    data[i] = (rgba[p]! + rgba[p + 1]! + rgba[p + 2]!) / (3 * 255);
  }
  return { width, height, data };
}

/** Amostra bilinear da density no UV (u,v em 0..1; v no espaço Three/GL, origem baixo-esquerda). */
export function sampleDensity(
  map: DensityMapData,
  u: number,
  v: number,
): number {
  // wrap
  const uu = u - Math.floor(u);
  // ImageData tem origem no topo → inverter V
  const vv = 1 - (v - Math.floor(v));

  const x = uu * (map.width - 1);
  const y = vv * (map.height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, map.width - 1);
  const y1 = Math.min(y0 + 1, map.height - 1);
  const fx = x - x0;
  const fy = y - y0;

  const i00 = y0 * map.width + x0;
  const i10 = y0 * map.width + x1;
  const i01 = y1 * map.width + x0;
  const i11 = y1 * map.width + x1;

  const a = map.data[i00]! * (1 - fx) + map.data[i10]! * fx;
  const b = map.data[i01]! * (1 - fx) + map.data[i11]! * fx;
  return a * (1 - fy) + b * fy;
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}

/** Peso residual (cinza): cabelo que já existe no Calvo. */
export function residualWeightFromDensity(
  d: number,
  t: DensityThresholds,
): number {
  if (d <= t.blackMax) return 0;
  if (d >= t.whiteMin) return 0;
  const up = smoothstep(t.blackMax, t.grayPeak, d);
  const down = 1 - smoothstep(t.grayPeak, t.whiteMin, d);
  return clamp01(up * down);
}

/** Peso receptor (branco): zona que o slider preenche. */
export function receptorWeightFromDensity(
  d: number,
  t: DensityThresholds,
): number {
  return smoothstep(t.whiteMin - 0.08, t.whiteMin + 0.12, d);
}

/** Máscara de couro para shading (tudo que não é preto). */
export function scalpMaskFromDensity(
  d: number,
  t: DensityThresholds,
): number {
  return smoothstep(t.blackMax, t.blackMax + 0.1, d);
}
