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
   * fit.scale multiplica a altura do cabelo relativa à face.
   * offsetY em frações da faceLen (para cima da fronte).
   * offsetZ em frações da largura (profundidade ortográfica).
   */
  fit: {
    scale: 1.35,
    offsetY: 0.12,
    offsetZ: 0,
  },
} as const;

/** Verifica se o GLB está em /public (GET — HEAD falha em alguns hosts). */
export async function hairGlbExists(): Promise<boolean> {
  try {
    const res = await fetch(HAIR_GLB_URL, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      cache: "force-cache",
    });
    return res.ok || res.status === 206;
  } catch {
    return false;
  }
}
