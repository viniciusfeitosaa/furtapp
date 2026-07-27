/** Catálogo dos modelos 3D de cabelo do try-on. */

export type HairGlbFit = {
  matrixScale: number;
  localX: number;
  localY: number;
  localZ: number;
  scalpFrac: number;
  rotX: number;
  rotY: number;
  rotZ: number;
};

export type HairGlbAsset = {
  id: string;
  label: string;
  blurb: string;
  glbUrl: string;
  fit: HairGlbFit;
};

/**
 * Calibração no espaço métrico do MediaPipe (centímetros):
 * câmera virtual FOV 63°, origem na óptica, olhando -Z.
 */
export const HAIR_GLB_STYLES = [
  {
    id: "short-layered",
    label: "Curto em camadas",
    blurb: "Corte curto volumoso",
    glbUrl: "/models/short_hair_cut_in_layers_with_bones.glb",
    fit: {
      matrixScale: 24,
      localX: 0,
      localY: 6.5,
      localZ: -2,
      scalpFrac: 0.55,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
    },
  },
  {
    id: "beautiful-hair-4",
    label: "Beautiful Hair 4",
    blurb: "Corte longo / volumoso",
    glbUrl: "/models/beautiful_hair_4.glb",
    fit: {
      matrixScale: 24,
      localX: 0,
      localY: 6.5,
      localZ: -2,
      scalpFrac: 0.55,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
    },
  },
] as const satisfies readonly HairGlbAsset[];

export type HairGlbStyleId = (typeof HAIR_GLB_STYLES)[number]["id"];

export const DEFAULT_HAIR_GLB_STYLE_ID: HairGlbStyleId = "short-layered";

export function getHairGlbStyle(id: HairGlbStyleId): HairGlbAsset {
  return (
    HAIR_GLB_STYLES.find((s) => s.id === id) ?? HAIR_GLB_STYLES[0]!
  );
}

/** @deprecated Use getHairGlbStyle / HAIR_GLB_STYLES */
export const HAIR_GLB_ASSET = getHairGlbStyle(DEFAULT_HAIR_GLB_STYLE_ID);

export const HAIR_GLB_URL = HAIR_GLB_ASSET.glbUrl;

/** Verifica se ao menos um GLB do catálogo está em /public. */
export async function hairGlbExists(): Promise<boolean> {
  for (const style of HAIR_GLB_STYLES) {
    try {
      const res = await fetch(style.glbUrl, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        cache: "force-cache",
      });
      if (res.ok || res.status === 206) return true;
    } catch {
      /* tenta o próximo */
    }
  }
  return false;
}
