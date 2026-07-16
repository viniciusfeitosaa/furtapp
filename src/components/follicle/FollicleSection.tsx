"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { FollicleFallback } from "@/components/follicle/FollicleFallback";
import { FollicleErrorBoundary } from "@/components/follicle/FollicleErrorBoundary";
import type { GraftCount } from "@/components/follicle/FollicleModel";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const FollicleCanvas = dynamic(
  () =>
    import("@/components/follicle/FollicleCanvas").then((m) => m.FollicleCanvas),
  {
    ssr: false,
    loading: () => <FollicleFallback />,
  },
);

const DENSITY_OPTIONS: { label: string; value: GraftCount; hint: string }[] = [
  {
    label: "Calvo",
    value: 0,
    hint: "Calvo — laterais e nuca preenchidas; zona do transplante vazia",
  },
  { label: "1.000", value: 1000, hint: "Preenche a linha frontal (1.000 unidades)" },
  { label: "5.000", value: 5000, hint: "Amplia cobertura do topo e frontal" },
  { label: "Máximo", value: 8000, hint: "Cobertura plena (~8.000 unidades)" },
];

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export function FollicleSection() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [graftCount, setGraftCount] = useState<GraftCount>(0);
  const [webgl] = useState(() =>
    typeof window === "undefined" ? true : canUseWebGL(),
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const show3d = inView && webgl && !reduced;
  const active = DENSITY_OPTIONS.find((o) => o.value === graftCount);

  return (
    <section
      ref={ref}
      id="foliculo"
      className="scroll-mt-24 bg-[#060810] px-4 py-20 text-white md:px-6 md:py-28"
      aria-labelledby="foliculo-title"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-[0.7rem] tracking-[0.3em] text-brand-gold uppercase">
          Planejamento
        </p>
        <h2
          id="foliculo-title"
          className="font-display max-w-2xl text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl"
        >
          Da área calva à densidade
        </h2>
        <p className="font-serif-body mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          Simulação do planejamento: no Calvo a cabeça já tem cabelo, mas a zona
          do transplante fica vazia. Ao escolher 1.000, 5.000 ou Máximo, essa área
          vai sendo preenchida progressivamente.
        </p>

        <div
          className="mt-8 flex flex-wrap gap-2"
          role="group"
          aria-label="Densidade de enxertos"
        >
          {DENSITY_OPTIONS.map((opt) => {
            const on = opt.value === graftCount;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGraftCount(opt.value)}
                className={`min-h-11 px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
                  on
                    ? "bg-brand-gold text-brand-charcoal"
                    : "border border-white/25 text-white/85 hover:border-white hover:bg-white/5"
                }`}
                aria-pressed={on}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-white/55">{active?.hint}</p>

        <div className="mt-8 overflow-hidden border border-white/10">
          {show3d ? (
            <FollicleErrorBoundary>
              <FollicleCanvas autoRotate graftCount={graftCount} />
            </FollicleErrorBoundary>
          ) : (
            <FollicleFallback />
          )}
        </div>
        <p className="mt-4 text-center text-xs tracking-wide text-white/45">
          {show3d
            ? "Arraste para girar · use os botões para simular a densidade"
            : "Representação estilizada do planejamento capilar"}
        </p>
      </div>
    </section>
  );
}
