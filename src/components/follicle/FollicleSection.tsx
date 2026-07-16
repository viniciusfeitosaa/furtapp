"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { FollicleFallback } from "@/components/follicle/FollicleFallback";
import { FollicleErrorBoundary } from "@/components/follicle/FollicleErrorBoundary";
import { MAX_GRAFTS } from "@/components/follicle/FollicleModel";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const FollicleCanvas = dynamic(
  () =>
    import("@/components/follicle/FollicleCanvas").then((m) => m.FollicleCanvas),
  {
    ssr: false,
    loading: () => <FollicleFallback />,
  },
);

function densityHint(count: number): string {
  if (count <= 0) {
    return "Calvo — cabeça preenchida; só as entradas (têmporas) vazias";
  }
  if (count < 1000) {
    return "Preenchimento inicial das entradas";
  }
  if (count < 5000) {
    return "Cobertura intermediária das têmporas";
  }
  if (count < MAX_GRAFTS) {
    return "Ampliação da densidade nas entradas";
  }
  return "Entradas totalmente preenchidas";
}

function formatGrafts(count: number): string {
  return count.toLocaleString("pt-BR");
}

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
  const [graftCount, setGraftCount] = useState(0);
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
  const pct = Math.round((graftCount / MAX_GRAFTS) * 100);

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
          Simulação do planejamento: no Calvo a cabeça já está preenchida — só as
          entradas (têmporas) ficam vazias. Arraste o controle para preencher
          progressivamente até cerca de {formatGrafts(MAX_GRAFTS)} unidades.
        </p>

        <div className="mt-8 max-w-xl">
          <div className="mb-3 flex items-end justify-between gap-4">
            <label
              htmlFor="graft-density"
              className="text-xs font-semibold tracking-wide text-white/70 uppercase"
            >
              Densidade de enxertos
            </label>
            <p className="font-display text-2xl text-brand-gold tabular-nums sm:text-3xl">
              {formatGrafts(graftCount)}
              <span className="ml-2 text-sm font-normal tracking-normal text-white/45">
                / {formatGrafts(MAX_GRAFTS)}
              </span>
            </p>
          </div>

          <input
            id="graft-density"
            type="range"
            min={0}
            max={MAX_GRAFTS}
            step={50}
            value={graftCount}
            onChange={(e) => setGraftCount(Number(e.target.value))}
            className="graft-slider h-2 w-full cursor-pointer appearance-none rounded-none bg-white/15 accent-brand-gold"
            aria-valuemin={0}
            aria-valuemax={MAX_GRAFTS}
            aria-valuenow={graftCount}
            aria-valuetext={`${formatGrafts(graftCount)} unidades foliculares`}
            style={{
              background: `linear-gradient(to right, var(--color-brand-gold, #c4b07a) 0%, var(--color-brand-gold, #c4b07a) ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`,
            }}
          />

          <div className="mt-2 flex justify-between text-[0.65rem] tracking-wide text-white/40 uppercase">
            <span>Calvo</span>
            <span>Máximo</span>
          </div>
          <p className="mt-3 text-sm text-white/55">{densityHint(graftCount)}</p>
        </div>

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
            ? "Arraste para girar · use o controle para simular a densidade"
            : "Representação estilizada do planejamento capilar"}
        </p>
      </div>
    </section>
  );
}
