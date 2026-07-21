export type WigStyleId =
  | "curto"
  | "classico"
  | "volumoso"
  | "lateral"
  | "ondulado";

export type WigStyle = {
  id: WigStyleId;
  label: string;
  blurb: string;
  /** Altura do topo acima da fronte (× faceLen). */
  crown: number;
  /** Queda nas laterais (× faceLen). */
  sideDrop: number;
  /** Quanto a linha desce sobre a testa (0–1 da faceLen). */
  bangs: number;
  /** Deslocamento da risca (-1 esq … 1 dir). */
  part: number;
  /** Largura extra nas têmporas. */
  flare: number;
  /** Ondulação dos fios (0–1). */
  wave: number;
  /** Cor base do cabelo. */
  color: { base: string; mid: string; hi: string };
};

export const WIG_STYLES: WigStyle[] = [
  {
    id: "curto",
    label: "Curto",
    blurb: "Corte baixo, próximo ao couro",
    crown: 0.32,
    sideDrop: 0.18,
    bangs: 0.02,
    part: 0,
    flare: 0.08,
    wave: 0.15,
    color: { base: "#1a1410", mid: "#2c241c", hi: "#4a3c2e" },
  },
  {
    id: "classico",
    label: "Clássico",
    blurb: "Volume natural na linha",
    crown: 0.48,
    sideDrop: 0.34,
    bangs: 0.06,
    part: 0.12,
    flare: 0.14,
    wave: 0.25,
    color: { base: "#18120e", mid: "#3a2e22", hi: "#6b5640" },
  },
  {
    id: "volumoso",
    label: "Volumoso",
    blurb: "Mais densidade no topo",
    crown: 0.62,
    sideDrop: 0.4,
    bangs: 0.08,
    part: 0,
    flare: 0.22,
    wave: 0.35,
    color: { base: "#120e0a", mid: "#2a2218", hi: "#5c4a36" },
  },
  {
    id: "lateral",
    label: "Risca lateral",
    blurb: "Volume penteado para o lado",
    crown: 0.52,
    sideDrop: 0.38,
    bangs: 0.1,
    part: 0.55,
    flare: 0.18,
    wave: 0.28,
    color: { base: "#14100c", mid: "#2e261c", hi: "#624e3a" },
  },
  {
    id: "ondulado",
    label: "Ondulado",
    blurb: "Textura com movimento",
    crown: 0.56,
    sideDrop: 0.48,
    bangs: 0.12,
    part: 0.2,
    flare: 0.24,
    wave: 0.75,
    color: { base: "#100c08", mid: "#2a2018", hi: "#6e5842" },
  },
];

export function getWigStyle(id: WigStyleId): WigStyle {
  return WIG_STYLES.find((s) => s.id === id) ?? WIG_STYLES[1]!;
}
