/** src/lib/motion.ts */
export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Progresso 0–1 enquanto `rect` atravessa o viewport.
 * 0 = topo do elemento na base da tela; 1 = topo acima da tela pela altura do elemento.
 */
export function scrollProgressThrough(
  rectTop: number,
  rectHeight: number,
  viewHeight: number,
) {
  const total = viewHeight + rectHeight;
  if (total <= 0) return 0;
  return clamp((viewHeight - rectTop) / total, 0, 1);
}

export function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

/** Snapshot client-side para useSyncExternalStore. */
export function getReducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const reducedMotionSubscribe = subscribeReducedMotion;
export const reducedMotionServerSnapshot = () => false;
