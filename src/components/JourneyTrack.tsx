"use client";

import { useRef } from "react";
import { CHECKPOINTS } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const STEP_LABELS: Record<(typeof CHECKPOINTS)[number], string> = {
  M0: "Cirurgia",
  M3: "3 meses",
  M6: "6 meses",
  M9: "9 meses",
  M12: "12 meses",
};

/** size-2.5 = 0.625rem → raio 0.3125rem; py-3 = 0.75rem */
const DOT = "0.625rem";
const DOT_R = "0.3125rem";
const ROW_PAD = "0.75rem";

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
      {/* Desktop: faixa h-2.5 = altura do nó → linha no centro */}
      <ol className="relative hidden sm:grid sm:grid-cols-5">
        <div
          className="pointer-events-none absolute top-0 right-[10%] left-[10%] flex items-center"
          style={{ height: DOT }}
          aria-hidden
        >
          <div className="relative h-px w-full bg-brand-gray-light">
            <div
              className="absolute inset-y-0 left-0 origin-left bg-brand-gold motion-reduce:transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        {CHECKPOINTS.map((cp, i) => {
          const on = i <= activeIdx;
          return (
            <li
              key={cp}
              className="relative flex flex-col items-center text-center"
            >
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

      {/* Mobile: nós no topo da linha (após py-3); trilha no centro dos círculos */}
      <ol className="relative sm:hidden">
        <div
          className="pointer-events-none absolute left-0 flex w-2.5 justify-center"
          style={{
            top: `calc(${ROW_PAD} + ${DOT_R})`,
            bottom: `calc(${ROW_PAD} + ${DOT_R})`,
          }}
          aria-hidden
        >
          <div className="relative h-full w-px bg-brand-gray-light">
            <div
              className="absolute inset-x-0 top-0 origin-top bg-brand-gold motion-reduce:transition-none"
              style={{ height: `${progress * 100}%` }}
            />
          </div>
        </div>
        {CHECKPOINTS.map((cp, i) => {
          const on = i <= activeIdx;
          return (
            <li key={cp} className="relative flex items-start gap-4 py-3">
              <span
                className={`relative z-10 block size-2.5 shrink-0 rounded-full transition-colors duration-300 motion-reduce:transition-none ${
                  on ? "bg-brand-gold" : "bg-brand-gray-mid"
                }`}
                aria-hidden
              />
              <div className="-mt-0.5">
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

      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-brand-charcoal/70">
        Em cada marco, o mesmo protocolo de cinco ângulos — frontal, superior,
        coroa e ambos os perfis temporais — para comparar evolução real, não só a
        memória.
      </p>
    </div>
  );
}
