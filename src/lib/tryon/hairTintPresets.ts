/**
 * Presets de tom/densidade — MediaPipe Hair Segmenter (Apache 2.0, grátis).
 * Não são cortes 3D; reforçam o cabelo detectado na máscara.
 */

export type HairLookId =
  | "natural"
  | "castanho"
  | "escuro"
  | "densidade"
  | "quente";

export type HairLook = {
  id: HairLookId;
  label: string;
  blurb: string;
  rgb: [number, number, number];
  /** Multiplicador de opacidade (1 = padrão). */
  boost: number;
};

export const HAIR_LOOKS: HairLook[] = [
  {
    id: "natural",
    label: "Natural",
    blurb: "Reforço suave no tom atual",
    rgb: [42, 32, 24],
    boost: 0.85,
  },
  {
    id: "castanho",
    label: "Castanho",
    blurb: "Tom médio aquecido",
    rgb: [74, 48, 28],
    boost: 1,
  },
  {
    id: "escuro",
    label: "Escuro",
    blurb: "Mais profundidade e contraste",
    rgb: [18, 12, 8],
    boost: 1.15,
  },
  {
    id: "densidade",
    label: "Densidade",
    blurb: "Reforço visual de preenchimento",
    rgb: [28, 20, 14],
    boost: 1.4,
  },
  {
    id: "quente",
    label: "Quente",
    blurb: "Castanho com reflexo quente",
    rgb: [92, 58, 32],
    boost: 1.05,
  },
];

export function getHairLook(id: string): HairLook {
  return HAIR_LOOKS.find((p) => p.id === id) ?? HAIR_LOOKS[0]!;
}

/** @deprecated use HAIR_LOOKS */
export const HAIR_TINT_PRESETS = HAIR_LOOKS;
/** @deprecated use getHairLook */
export const getHairTint = getHairLook;
export type HairTintId = HairLookId;
export type HairTintPreset = HairLook;
