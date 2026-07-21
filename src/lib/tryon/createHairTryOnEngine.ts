import type { HairTryOnEngine } from "@/lib/tryon/HairTryOnEngine";
import {
  resolveHairTryOnProvider,
  type HairTryOnProvider,
} from "@/lib/tryon/config";
import { createBanubaHairEngine } from "@/lib/tryon/engines/banubaHair";
import { createMediaPipeHairSegmentEngine } from "@/lib/tryon/engines/mediapipeHairSegment";

export function createHairTryOnEngine(
  provider: HairTryOnProvider = resolveHairTryOnProvider(),
): HairTryOnEngine {
  if (provider === "banuba") {
    return createBanubaHairEngine();
  }
  return createMediaPipeHairSegmentEngine();
}
