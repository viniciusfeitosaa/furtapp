export type DensityThresholds = {
  /** Abaixo disso = preto = sem fio */
  blackMax: number;
  /** Pico da faixa cinza (cabelo residual no Calvo) */
  grayPeak: number;
  /** Acima disso = branco = zona de enxerto (slider) */
  whiteMin: number;
};

export type PatientManifest = {
  enabled: boolean;
  glb: string;
  color: string;
  density: string;
  normal: string | null;
  thresholds: DensityThresholds;
};

export const PATIENT_BASE = "/models/patient";

export const DEFAULT_THRESHOLDS: DensityThresholds = {
  blackMax: 0.12,
  grayPeak: 0.38,
  whiteMin: 0.55,
};

export const LEGACY_ASSETS = {
  glb: "/models/head.glb",
  color: "/models/head-albedo.jpg",
  normal: "/models/head-normal.jpg",
} as const;

export async function loadPatientManifest(): Promise<PatientManifest | null> {
  try {
    const res = await fetch(`${PATIENT_BASE}/manifest.json`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<PatientManifest>;
    return {
      enabled: Boolean(data.enabled),
      glb: data.glb ?? "head.glb",
      color: data.color ?? "head_color.jpg",
      density: data.density ?? "head_density.jpg",
      normal: data.normal ?? null,
      thresholds: {
        ...DEFAULT_THRESHOLDS,
        ...data.thresholds,
      },
    };
  } catch {
    return null;
  }
}

export function patientUrl(file: string) {
  return `${PATIENT_BASE}/${file}`;
}
