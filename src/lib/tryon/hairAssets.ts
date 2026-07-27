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
   * Calibração no espaço métrico do MediaPipe (centímetros):
   * câmera virtual FOV 63°, origem na óptica, olhando -Z.
   * Ajuste fino para franja acima das sobrancelhas (foto ideal):
   *   matrixScale ↑ cobre mais o crânio | localY ↑ sobe a franja
   *   localZ ↓ (mais negativo) empurra o volume para trás
   */
  fit: {
    // Restaurado: posição da 2ª foto (quase ideal, levemente acima)
    matrixScale: 20,
    localX: 0,
    localY: 8,
    localZ: -2,
    scalpFrac: 0.16,
    rotX: 0,
    rotY: Math.PI,
    rotZ: 0,
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
