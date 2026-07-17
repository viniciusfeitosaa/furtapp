"use client";

import { useSyncExternalStore } from "react";
import {
  getReducedMotionSnapshot,
  reducedMotionServerSnapshot,
  reducedMotionSubscribe,
} from "@/lib/motion";

/** Preferência de reduced-motion reativa (sem setState em useEffect). */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    reducedMotionSubscribe,
    getReducedMotionSnapshot,
    reducedMotionServerSnapshot,
  );
}
