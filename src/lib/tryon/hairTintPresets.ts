/** Presets de tom/reforço para Fase 1 (segmentação) — não são cortes 3D. */

export type HairTintId =
  | "natural"
  | "castanho"
  | "escuro"
  | "volume"
  | "quente";

export type HairTintPreset = {
  id: HairTintId;
  label: string;
  blurb: string;
  /** Cor RGB do tint. */
  rgb: [number, number, number];
  /** Multiplicador extra de opacidade (1 = padrão). */
  boost: number;
};

export const HAIR_TINT_PRESETS: HairTintPreset[] = [
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
    id: "volume",
    label: "Densidade",
    blurb: "Reforço visual de preenchimento",
    rgb: [28, 20, 14],
    boost: 1.35,
  },
  {
    id: "quente",
    label: "Quente",
    blurb: "Castanho com reflexo quente",
    rgb: [92, 58, 32],
    boost: 1.05,
  },
];

export function getHairTint(id: string): HairTintPreset {
  return HAIR_TINT_PRESETS.find((p) => p.id === id) ?? HAIR_TINT_PRESETS[0]!;
}
