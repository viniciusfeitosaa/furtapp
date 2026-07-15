"use client";

import { useRef } from "react";
import { CHECKPOINTS } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useScrollProgress } from "@/hooks/useScrollProgress";

export function JourneyTrack() {
  const ref = useRef<HTMLDivElement>(null);
  const raw = useScrollProgress(ref);
  const reduced = usePrefersReducedMotion();
  const progress = reduced ? 1 : raw;
  const activeIdx = Math.min(
    CHECKPOINTS.length - 1,
    Math.floor(progress * CHECKPOINTS.length),
  );

  return (
    <div ref={ref} className="mt-10">
      <div
        className="relative mb-8 h-px w-full bg-brand-gray-light"
        aria-hidden
      >
        <div
          className="absolute inset-y-0 left-0 origin-left bg-brand-gold motion-reduce:transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <ol className="grid gap-4 sm:grid-cols-5">
        {CHECKPOINTS.map((cp, i) => {
          const on = i <= activeIdx;
          return (
            <li
              key={cp}
              className={`border px-3 py-4 text-center transition-colors duration-300 motion-reduce:transition-none ${
                on
                  ? "border-brand-gold text-black"
                  : "border-brand-gray-light text-brand-charcoal"
              }`}
            >
              <span
                className={`block text-xs tracking-[0.2em] uppercase ${
                  on ? "text-brand-gold" : "text-brand-gray"
                }`}
              >
                Checkpoint
              </span>
              <span className="mt-2 block text-xl font-semibold">{cp}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
