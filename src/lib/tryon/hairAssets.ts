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
   * Calibração visual (frações da face / radianos locais no modelo).
   * - scale: tamanho relativo à face
   * - anchorUp: deslocamento da fronte ao longo do eixo “topo” (negativo = mais baixo)
   * - rot*: orientação fixa do asset (oco para o couro, não para a câmera)
   */
  fit: {
    scale: 1.15,
    anchorUp: -0.08,
    offsetX: 0,
    /** Empurra o pivot um pouco “para trás” no eixo da tela (Z ortográfico). */
    offsetZ: -0.15,
    /** Inclinação local do GLB (radianos). */
    rotX: -0.35,
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
