/** Catálogo clínico de estilos (Fase 2) — sem franja. */

export type ClinicalStyleId =
  | "curto"
  | "classico"
  | "volumoso"
  | "lateral"
  | "ondulado";

export type ClinicalStyle = {
  id: ClinicalStyleId;
  label: string;
  blurb: string;
  /** Cor RGBA 0–1 para Banuba Hair.color (modo color). */
  banubaRgba: string;
  /** Thumb estático opcional (path público). */
  thumb?: string;
};

export const CLINICAL_STYLES: ClinicalStyle[] = [
  {
    id: "curto",
    label: "Curto",
    blurb: "Corte baixo, próximo ao couro",
    banubaRgba: "0.08 0.06 0.04 0.85",
  },
  {
    id: "classico",
    label: "Clássico",
    blurb: "Volume natural na linha",
    banubaRgba: "0.16 0.11 0.07 0.82",
  },
  {
    id: "volumoso",
    label: "Volumoso",
    blurb: "Mais densidade no topo",
    banubaRgba: "0.05 0.04 0.03 0.92",
  },
  {
    id: "lateral",
    label: "Risca lateral",
    blurb: "Volume penteado para o lado",
    banubaRgba: "0.12 0.08 0.05 0.84",
  },
  {
    id: "ondulado",
    label: "Ondulado",
    blurb: "Textura com movimento",
    banubaRgba: "0.18 0.12 0.07 0.8",
  },
];

export function getClinicalStyle(id: string): ClinicalStyle {
  return CLINICAL_STYLES.find((s) => s.id === id) ?? CLINICAL_STYLES[1]!;
}
