/** Catálogo do modelo 3D gratuito (Sketchfab CC BY). */

export const HAIR_GLB_URL =
  "/models/short_hair_cut_in_layers_with_bones.glb";

export const HAIR_GLB_ASSET = {
  id: "short-layered",
  label: "Curto em camadas",
  blurb: "Modelo 3D CC BY — Sketchfab",
  sketchfabUrl: "https://skfb.ly/pK7T6",
  sketchfabUid: "60f13e9fa15941409654483c51add79e",
  author: "zHairezt",
  originalCredit: "ZEPETO",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  glbUrl: HAIR_GLB_URL,
  /**
   * Ajuste fino após carregar o GLB real (escala/offset no espaço da face canônica).
   * Valores iniciais — calibrar olhando a câmera.
   */
  fit: {
    scale: 1.05,
    offsetY: 0.02,
    offsetZ: -0.02,
  },
} as const;

/** Verifica se o GLB está em /public (runtime no browser). */
export async function hairGlbExists(): Promise<boolean> {
  try {
    const res = await fetch(HAIR_GLB_URL, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
