import type { HairTryOnEngine } from "@/lib/tryon/HairTryOnEngine";
import { createMediaPipeHairSegmentEngine } from "@/lib/tryon/engines/mediapipeHairSegment";

/** Único provider: MediaPipe (grátis / open source). */
export function createHairTryOnEngine(): HairTryOnEngine {
  return createMediaPipeHairSegmentEngine();
}
