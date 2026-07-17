/** Dados ilustrativos do mapa de planejamento clínico (não é cálculo médico). */

export const PLAN_MAX_GRAFTS = 8000;

export type PlanZoneId =
  | "donor"
  | "templeL"
  | "templeR"
  | "frontal"
  | "mid"
  | "crown";

export type ReceptorZoneId = Exclude<PlanZoneId, "donor">;

export type PlanZone = {
  id: PlanZoneId;
  label: string;
  /** Fração do plano ilustrativo nas receptoras (soma ≈ 1). */
  weight: number;
  kind: "donor" | "receptor";
};

export const PLAN_ZONES: PlanZone[] = [
  { id: "donor", label: "Área doadora", weight: 0, kind: "donor" },
  { id: "templeL", label: "Entrada E", weight: 0.12, kind: "receptor" },
  { id: "templeR", label: "Entrada D", weight: 0.12, kind: "receptor" },
  { id: "frontal", label: "Linha anterior", weight: 0.28, kind: "receptor" },
  { id: "mid", label: "Couro médio", weight: 0.28, kind: "receptor" },
  { id: "crown", label: "Coroa", weight: 0.2, kind: "receptor" },
];

export const RECEPTOR_ZONES = PLAN_ZONES.filter(
  (z): z is PlanZone & { id: ReceptorZoneId; kind: "receptor" } =>
    z.kind === "receptor",
);

/** Marcos da cascata: cortes no fill global (0..1). */
const CASCADE: { id: ReceptorZoneId; start: number; end: number }[] = [
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

/** UFs ilustrativas alocadas por zona (proporcional ao fill × peso). */
export function zoneGrafts(fill: number): Record<ReceptorZoneId, number> {
  const fills = zoneFills(fill);
  const raw: Record<ReceptorZoneId, number> = {
    templeL: 0,
    templeR: 0,
    frontal: 0,
    mid: 0,
    crown: 0,
  };
  let sum = 0;
  for (const z of RECEPTOR_ZONES) {
    const n = fills[z.id] * z.weight * PLAN_MAX_GRAFTS;
    raw[z.id] = n;
    sum += n;
  }
  // Normaliza para bater com o total arredondado do slider
  const target = planGrafts(fill);
  if (sum <= 0 || target <= 0) {
    return { templeL: 0, templeR: 0, frontal: 0, mid: 0, crown: 0 };
  }
  const scale = target / sum;
  const out = { ...raw };
  let acc = 0;
  const ids = RECEPTOR_ZONES.map((z) => z.id);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i]!;
    if (i === ids.length - 1) {
      out[id] = Math.max(0, target - acc);
    } else {
      const n = Math.round(raw[id] * scale);
      out[id] = n;
      acc += n;
    }
  }
  return out;
}

export function planGrafts(fill: number): number {
  return Math.round(clamp01(fill) * PLAN_MAX_GRAFTS);
}

export function planStage(grafts: number): {
  title: string;
  detail: string;
  focus: PlanZoneId | "temples" | "idle";
} {
  if (grafts <= 0) {
    return {
      title: "Ponto de partida",
      detail: "Ferradura residual no lugar — entradas e coroa ainda vazias",
      focus: "idle",
    };
  }
  if (grafts < 1000) {
    return {
      title: "Entradas",
      detail: "Primeiro preenchimento das têmporas — redesenho da moldura facial",
      focus: "temples",
    };
  }
  if (grafts < 3500) {
    return {
      title: "Linha anterior",
      detail: "Definição da linha frontal com densidade natural na transição",
      focus: "frontal",
    };
  }
  if (grafts < 6000) {
    return {
      title: "Couro médio",
      detail: "Ampliação da densidade atrás da linha — continuidade do plano",
      focus: "mid",
    };
  }
  return {
    title: "Densidade máxima",
    detail:
      "Coroa incluída no teto ilustrativo — o limite real depende da área doadora",
    focus: "crown",
  };
}

export function formatGrafts(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function isZoneFocused(
  zone: PlanZoneId,
  focus: PlanZoneId | "temples" | "idle",
): boolean {
  if (focus === "idle") return false;
  if (focus === "temples") return zone === "templeL" || zone === "templeR";
  return zone === focus;
}
