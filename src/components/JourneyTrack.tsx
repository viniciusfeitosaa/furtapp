"use client";

import { useRef } from "react";
import { CHECKPOINTS, PHOTO_REGIONS } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const STEP_LABELS: Record<(typeof CHECKPOINTS)[number], string> = {
  M0: "Cirurgia",
  M3: "3 meses",
  M6: "6 meses",
  M9: "9 meses",
  M12: "12 meses",
};

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
      {/* Desktop: linha horizontal com nós */}
      <ol className="relative hidden sm:grid sm:grid-cols-5">
        <div
          className="pointer-events-none absolute top-[0.7rem] right-[10%] left-[10%] h-px bg-brand-gray-light"
          aria-hidden
        >
          <div
            className="absolute inset-y-0 left-0 origin-left bg-brand-gold motion-reduce:transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {CHECKPOINTS.map((cp, i) => {
          const on = i <= activeIdx;
          return (
            <li key={cp} className="relative flex flex-col items-center text-center">
              <span
                className={`relative z-10 block size-2.5 rounded-full transition-colors duration-300 motion-reduce:transition-none ${
                  on ? "bg-brand-gold" : "bg-brand-gray-mid"
                }`}
                aria-hidden
              />
              <span
                className={`mt-4 font-display text-2xl tracking-wide transition-colors duration-300 motion-reduce:transition-none ${
                  on ? "text-black" : "text-brand-gray"
                }`}
              >
                {cp}
              </span>
              <span
                className={`mt-1 text-xs tracking-[0.14em] uppercase transition-colors duration-300 motion-reduce:transition-none ${
                  on ? "text-brand-gold-dark" : "text-brand-gray"
                }`}
              >
                {STEP_LABELS[cp]}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile: trilha vertical */}
      <ol className="relative space-y-0 sm:hidden">
        <div
          className="pointer-events-none absolute top-2 bottom-2 left-[0.3rem] w-px bg-brand-gray-light"
          aria-hidden
        >
          <div
            className="absolute inset-x-0 top-0 origin-top bg-brand-gold motion-reduce:transition-none"
            style={{ height: `${progress * 100}%` }}
          />
        </div>
        {CHECKPOINTS.map((cp, i) => {
          const on = i <= activeIdx;
          return (
            <li key={cp} className="relative flex items-start gap-4 py-3 pl-1">
              <span
                className={`relative z-10 mt-1.5 block size-2.5 shrink-0 rounded-full transition-colors duration-300 motion-reduce:transition-none ${
                  on ? "bg-brand-gold" : "bg-brand-gray-mid"
                }`}
                aria-hidden
              />
              <div>
                <span
                  className={`font-display text-xl tracking-wide transition-colors duration-300 motion-reduce:transition-none ${
                    on ? "text-black" : "text-brand-gray"
                  }`}
                >
                  {cp}
                </span>
                <span
                  className={`ml-2 text-xs tracking-[0.14em] uppercase transition-colors duration-300 motion-reduce:transition-none ${
                    on ? "text-brand-gold-dark" : "text-brand-gray"
                  }`}
                >
                  {STEP_LABELS[cp]}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-brand-gray">
        Em cada marco, o mesmo protocolo de cinco ângulos —{" "}
        {PHOTO_REGIONS.map((r) => r.label.split(" / ")[0].toLowerCase()).join(
          ", ",
        )}
        — para comparar evolução real, não só a memória.
      </p>
    </div>
  );
}
