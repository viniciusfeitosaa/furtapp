/** Dados ilustrativos do mapa de planejamento clínico (não é cálculo médico). */

export type PlanZoneId =
  | "donor"
  | "templeL"
  | "templeR"
  | "frontal"
  | "mid"
  | "crown";

export type PlanZone = {
  id: PlanZoneId;
  label: string;
  /** Fração do plano ilustrativo (soma das receptoras ≈ 1). */
  weight: number;
  /** Ordem de preenchimento (menor = primeiro). */
  order: number;
  kind: "donor" | "receptor";
};

export const PLAN_ZONES: PlanZone[] = [
  {
    id: "donor",
    label: "Área doadora",
    weight: 0,
    order: -1,
    kind: "donor",
  },
  {
    id: "templeL",
    label: "Entrada esquerda",
    weight: 0.12,
    order: 0,
    kind: "receptor",
  },
  {
    id: "templeR",
    label: "Entrada direita",
    weight: 0.12,
    order: 0,
    kind: "receptor",
  },
  {
    id: "frontal",
    label: "Linha anterior",
    weight: 0.28,
    order: 1,
    kind: "receptor",
  },
  {
    id: "mid",
    label: "Couro médio",
    weight: 0.28,
    order: 2,
    kind: "receptor",
  },
  {
    id: "crown",
    label: "Coroa",
    weight: 0.2,
    order: 3,
    kind: "receptor",
  },
];

/** Marcos da cascata: cortes no fill global (0..1). */
const CASCADE: { id: Exclude<PlanZoneId, "donor">; start: number; end: number }[] =
  [
    { id: "templeL", start: 0.0, end: 0.22 },
    { id: "templeR", start: 0.0, end: 0.22 },
    { id: "frontal", start: 0.18, end: 0.52 },
    { id: "mid", start: 0.45, end: 0.78 },
    { id: "crown", start: 0.72, end: 1.0 },
  ];

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}

/**
 * Preenchimento 0..1 de cada zona receptora dado fill global 0..1.
 * Cascata: entradas (em paralelo) → frontal → médio → coroa.
 */
export function zoneFills(fill: number): Record<PlanZoneId, number> {
  const f = clamp01(fill);
  const out: Record<PlanZoneId, number> = {
    donor: 1,
    templeL: 0,
    templeR: 0,
    frontal: 0,
    mid: 0,
    crown: 0,
  };
  for (const z of CASCADE) {
    out[z.id] = smoothstep(z.start, z.end, f);
  }
  return out;
}

/** Escala ilustrativa do slider (0–100). Não representa UF reais. */
export const PLAN_SCALE_MAX = 100;

export function planFillFromScale(scale: number): number {
  return clamp01(scale / PLAN_SCALE_MAX);
}

export function planStage(fill: number): {
  title: string;
  detail: string;
  focus: PlanZoneId | "idle";
} {
  const f = clamp01(fill);
  if (f <= 0) {
    return {
      title: "Ponto de partida",
      detail: "Ferradura residual no lugar — entradas e coroa ainda vazias",
      focus: "idle",
    };
  }
  if (f < 0.22) {
    return {
      title: "Entradas",
      detail: "Primeiro preenchimento das têmporas — redesenho da moldura facial",
      focus: "templeL",
    };
  }
  if (f < 0.52) {
    return {
      title: "Linha anterior",
      detail: "Definição da linha frontal com densidade natural na transição",
      focus: "frontal",
    };
  }
  if (f < 0.78) {
    return {
      title: "Couro médio",
      detail: "Ampliação da densidade atrás da linha — continuidade do plano",
      focus: "mid",
    };
  }
  return {
    title: "Plano ilustrativo completo",
    detail:
      "Coroa incluída na simulação — o volume real depende da área doadora de cada paciente",
    focus: "crown",
  };
}
