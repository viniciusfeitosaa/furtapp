import { CHECKPOINTS } from "@/lib/site";

const MONTH_OFFSETS: Record<string, number> = {
  M0: 0,
  M3: 3,
  M6: 6,
  M9: 9,
  M12: 12,
};

/** Janela: −7 dias antes do alvo até +14 dias depois */
const WINDOW_BEFORE_DAYS = 7;
const WINDOW_AFTER_DAYS = 14;

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function checkpointWindow(surgeryDate: Date, code: string) {
  const months = MONTH_OFFSETS[code] ?? 0;
  const target = addMonths(surgeryDate, months);
  const windowStart = new Date(target);
  windowStart.setDate(windowStart.getDate() - WINDOW_BEFORE_DAYS);
  const windowEnd = new Date(target);
  windowEnd.setDate(windowEnd.getDate() + WINDOW_AFTER_DAYS);
  return { target, windowStart, windowEnd };
}

export function checkpointStatusForDate(
  surgeryDate: Date,
  code: string,
  now = new Date(),
): "PENDING" | "OPEN" | "LATE" {
  const { windowStart, windowEnd } = checkpointWindow(surgeryDate, code);
  if (now < windowStart) return "PENDING";
  if (now > windowEnd) return "LATE";
  return "OPEN";
}

export function formatCheckpointLabel(code: string): string {
  const idx = CHECKPOINTS.indexOf(code as (typeof CHECKPOINTS)[number]);
  if (idx <= 0) return "Baseline";
  return `+${idx * 3} meses`;
}

export function daysUntil(date: Date, now = new Date()): number {
  const ms = date.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
