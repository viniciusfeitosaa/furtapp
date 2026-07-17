"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { FollicleFallback } from "@/components/follicle/FollicleFallback";
import { FollicleErrorBoundary } from "@/components/follicle/FollicleErrorBoundary";
import { MAX_GRAFTS } from "@/components/follicle/FollicleModel";
import { PhotoPlannerCanvas } from "@/components/planner/PhotoPlannerCanvas";
import {
  loadPatientManifest,
  type PatientManifest,
} from "@/components/follicle/follicleConfig";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const FollicleCanvas = dynamic(
  () =>
    import("@/components/follicle/FollicleCanvas").then((m) => m.FollicleCanvas),
  {
    ssr: false,
    loading: () => <FollicleFallback />,
  },
);

type Tab = "photo" | "photo3d";

function densityHint(count: number): string {
  if (count <= 0) {
    return "Calvo: ponto de partida — residual no lugar; entradas vazias";
  }
  if (count < 1000) {
    return "1.000: primeiro preenchimento das entradas";
  }
  if (count < 5000) {
    return "5.000: densidade intermediária — linha anterior mais definida";
  }
  if (count < MAX_GRAFTS) {
    return "Ampliação da densidade até o máximo tecnicamente indicado";
  }
  return "Máximo: densidade máxima tecnicamente indicada para este planejamento";
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

export function PlanningSection() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [tab, setTab] = useState<Tab>("photo");
  const [graftCount, setGraftCount] = useState(0);
  const [manifest, setManifest] = useState<PatientManifest | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    loadPatientManifest().then((m) => {
      if (!cancelled) setManifest(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pct = Math.round((graftCount / MAX_GRAFTS) * 100);
  const fill = graftCount / MAX_GRAFTS;
  const photo3dReady = Boolean(manifest?.enabled);
  const show3d = inView && webgl && !reduced;

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
          className="font-display max-w-3xl text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl"
        >
          Da área calva à densidade — veja o planejamento antes de decidir
        </h2>
        <p className="font-serif-body mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          Dois caminhos para a mesma decisão: simulação em foto (rápida) e
          modelo 3D por fotogrametria (quando o asset do paciente estiver
          pronto). Ajuste a densidade e veja as entradas serem preenchidas.
        </p>

        {/* Abas A / B */}
        <div
          className="mt-8 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Modo de simulação"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "photo"}
            onClick={() => setTab("photo")}
            className={`px-4 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors ${
              tab === "photo"
                ? "bg-brand-gold text-brand-charcoal"
                : "border border-white/20 text-white/70 hover:border-white/40 hover:text-white"
            }`}
          >
            Foto 2.5D
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "photo3d"}
            onClick={() => setTab("photo3d")}
            className={`px-4 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors ${
              tab === "photo3d"
                ? "bg-brand-gold text-brand-charcoal"
                : "border border-white/20 text-white/70 hover:border-white/40 hover:text-white"
            }`}
          >
            3D fotogrametria
          </button>
        </div>

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
            <span>1.000</span>
            <span>5.000</span>
            <span>Máximo</span>
          </div>
          <p className="mt-3 text-sm text-white/55">{densityHint(graftCount)}</p>
        </div>

        <div className="mt-8 overflow-hidden border border-white/10">
          {tab === "photo" ? (
            <PhotoPlannerCanvas fill={fill} />
          ) : show3d ? (
            <FollicleErrorBoundary>
              <FollicleCanvas autoRotate graftCount={graftCount} />
            </FollicleErrorBoundary>
          ) : (
            <FollicleFallback />
          )}
        </div>

        {tab === "photo3d" ? (
          <p className="mt-3 text-center text-[0.65rem] tracking-wide text-white/35">
            {photo3dReady
              ? "Modo fotogrametria ativo (assets em public/models/patient/)."
              : "3D genérico por enquanto. Para o paciente real: GLB + density map em public/models/patient/ e manifest enabled."}
          </p>
        ) : (
          <p className="mt-3 text-center text-[0.65rem] tracking-wide text-white/35">
            Protótipo 2.5D com máscara ilustrada — troque por foto + density map
            reais sem mudar o gesto do slider.
          </p>
        )}

        <p className="mt-4 text-center text-xs leading-relaxed tracking-wide text-white/45">
          Simulação ilustrativa. O número real de enxertos é definido apenas após
          avaliação presencial, de acordo com a área doadora disponível.
        </p>
      </div>
    </section>
  );
}
