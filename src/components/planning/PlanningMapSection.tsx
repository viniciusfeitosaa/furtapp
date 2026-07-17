"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { ScalpMapSvg } from "@/components/planning/ScalpMapSvg";
import {
  PLAN_MAX_GRAFTS,
  formatGrafts,
  planGrafts,
  planStage,
} from "@/lib/planningMap";
import { whatsappUrl } from "@/lib/site";

export function PlanningMapSection() {
  const [graftCount, setGraftCount] = useState(0);
  const fill = graftCount / PLAN_MAX_GRAFTS;
  const pct = Math.round(fill * 100);
  const stage = useMemo(() => planStage(graftCount), [graftCount]);

  return (
    <section
      id="foliculo"
      className="scroll-mt-24 bg-[#060810] px-4 py-20 text-white md:px-6 md:py-28"
      aria-labelledby="plan-map-title"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="mb-3 text-[0.7rem] tracking-[0.3em] text-brand-gold uppercase">
            Planejamento
          </p>
        </Reveal>
        <Reveal delayMs={80}>
          <h2
            id="plan-map-title"
            className="font-display max-w-3xl text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl"
          >
            O mapa antes da decisão
          </h2>
        </Reveal>
        <Reveal delayMs={140}>
          <p className="font-serif-body mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            Todo transplante começa pelo desenho do plano: de onde saem os
            enxertos, para onde vão, e com que densidade. Ajuste a escala e veja
            o mapa clínico se formar — da entrada vazia à densidade máxima
            ilustrativa.
          </p>
        </Reveal>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
          <Reveal delayMs={180} variant="scale">
            <div className="relative overflow-hidden border border-white/10 bg-[#080a12]">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent"
                aria-hidden
              />
              <ScalpMapSvg
                fill={fill}
                focus={stage.focus}
                className="mx-auto block h-auto w-full max-w-lg"
              />
            </div>
          </Reveal>

          <div className="flex flex-col gap-8 lg:pt-4">
            <Reveal delayMs={220} variant="right">
              <div>
                <p className="text-[0.65rem] tracking-[0.28em] text-white/40 uppercase">
                  Etapa do plano
                </p>
                <p className="font-display mt-2 text-3xl text-brand-gold sm:text-4xl">
                  {stage.title}
                </p>
                <p className="font-serif-body mt-3 text-base leading-relaxed text-white/70">
                  {stage.detail}
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={280} variant="right">
              <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-6">
                <div>
                  <p className="text-[0.65rem] tracking-[0.28em] text-white/40 uppercase">
                    Unidades foliculares
                  </p>
                  <p className="font-display mt-1 text-4xl text-white tabular-nums sm:text-5xl">
                    {formatGrafts(planGrafts(fill))}
                    <span className="ml-2 text-base font-normal tracking-normal text-white/35">
                      / {formatGrafts(PLAN_MAX_GRAFTS)}
                    </span>
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delayMs={320} variant="right">
              <ul className="grid gap-3 text-sm text-white/55">
                <Legend swatch="donor" label="Área doadora — ferradura residual" />
                <Legend
                  swatch="empty"
                  label="Área receptora — vazia no ponto de partida"
                />
                <Legend
                  swatch="graft"
                  label="Plano de enxerto — densidade ilustrativa"
                />
              </ul>
            </Reveal>

            <Reveal delayMs={360} variant="right">
              <a
                href={whatsappUrl(
                  "Olá! Vi o mapa de planejamento no site e gostaria de agendar minha avaliação.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center bg-brand-gold px-7 py-3.5 text-sm font-semibold tracking-wide text-brand-charcoal transition-colors hover:bg-brand-gold-soft"
              >
                Agendar avaliação para o plano real
              </a>
            </Reveal>
          </div>
        </div>

        <Reveal delayMs={200} className="mx-auto mt-12 max-w-xl">
          <div className="mb-3 flex items-end justify-between gap-4">
            <label
              htmlFor="plan-density"
              className="text-xs font-semibold tracking-wide text-white/70 uppercase"
            >
              Escala do planejamento
            </label>
            <p className="text-[0.65rem] tracking-wide text-white/40 uppercase">
              {pct}% do teto ilustrativo
            </p>
          </div>

          <input
            id="plan-density"
            type="range"
            min={0}
            max={PLAN_MAX_GRAFTS}
            step={50}
            value={graftCount}
            onChange={(e) => setGraftCount(Number(e.target.value))}
            className="graft-slider h-2 w-full cursor-pointer appearance-none rounded-none bg-white/15 accent-brand-gold"
            aria-valuemin={0}
            aria-valuemax={PLAN_MAX_GRAFTS}
            aria-valuenow={graftCount}
            aria-valuetext={`${formatGrafts(graftCount)} unidades foliculares`}
            style={{
              background: `linear-gradient(to right, var(--color-brand-gold, #b6a46e) 0%, var(--color-brand-gold, #b6a46e) ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`,
            }}
          />

          <div className="mt-2 flex justify-between text-[0.65rem] tracking-wide text-white/40 uppercase">
            <span>Calvo</span>
            <span>1.000</span>
            <span>5.000</span>
            <span>Máximo</span>
          </div>
        </Reveal>

        <p className="mt-8 text-center text-xs leading-relaxed tracking-wide text-white/40">
          Simulação ilustrativa para educação do paciente. O número real de
          enxertos e a distribuição por zona são definidos apenas após avaliação
          presencial, conforme a área doadora disponível.
        </p>
      </div>
    </section>
  );
}

function Legend({
  swatch,
  label,
}: {
  swatch: "donor" | "empty" | "graft";
  label: string;
}) {
  const tone =
    swatch === "donor"
      ? "bg-[#6a5a32]"
      : swatch === "graft"
        ? "bg-brand-gold"
        : "border border-white/25 bg-transparent";
  return (
    <li className="flex items-center gap-3">
      <span className={`inline-block h-2.5 w-2.5 shrink-0 ${tone}`} aria-hidden />
      <span>{label}</span>
    </li>
  );
}
