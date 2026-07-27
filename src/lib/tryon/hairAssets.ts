/** Catálogo do modelo 3D de cabelo em uso no try-on. */

export const HAIR_GLB_URL = "/models/beautiful_hair_4.glb";

export const HAIR_GLB_ASSET = {
  id: "beautiful-hair-4",
  label: "Beautiful Hair 4",
  blurb: "Modelo 3D de cabelo",
  glbUrl: HAIR_GLB_URL,
  /**
   * Calibração no espaço métrico do MediaPipe (centímetros):
   * câmera virtual FOV 63°, origem na óptica, olhando -Z.
   * Ajuste fino pelos sliders do /experimente.
   */
  fit: {
    // Ponto de partida — recalibrar com os sliders no novo mesh.
    matrixScale: 24,
    localX: 0,
    localY: 6.5,
    localZ: -2,
    scalpFrac: 0.55,
    rotX: 0,
    // 0 = frente do penteado para a câmera
    rotY: 0,
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
