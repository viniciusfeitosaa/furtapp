"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { ScalpMapSvg } from "@/components/planning/ScalpMapSvg";
import {
  PLAN_SCALE_MAX,
  planFillFromScale,
  planStage,
} from "@/lib/planningMap";
import { whatsappUrl } from "@/lib/site";

export function PlanningMapSection() {
  const [scale, setScale] = useState(0);
  const fill = planFillFromScale(scale);
  const pct = Math.round(fill * 100);
  const stage = useMemo(() => planStage(fill), [fill]);

  return (
    <section
      id="foliculo"
      className="scroll-mt-24 overflow-x-hidden bg-[#060810] px-4 py-14 text-white sm:py-20 md:px-6 md:py-28"
      aria-labelledby="plan-map-title"
    >
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <Reveal>
          <p className="mb-3 text-[0.65rem] tracking-[0.22em] text-brand-gold uppercase sm:text-[0.7rem] sm:tracking-[0.3em]">
            Planejamento
          </p>
        </Reveal>
        <Reveal delayMs={80}>
          <h2
            id="plan-map-title"
            className="font-display max-w-3xl text-[1.85rem] leading-[1.08] sm:text-[2.15rem] sm:text-4xl md:text-5xl"
          >
            O mapa antes da decisão
          </h2>
        </Reveal>
        <Reveal delayMs={140}>
          <p className="font-serif-body mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-white/75 sm:mt-5 sm:text-base sm:text-lg">
            Todo transplante começa pelo desenho do plano: de onde saem os
            enxertos, para onde vão, e com que densidade. Ajuste a escala e veja
            o mapa clínico se formar — da entrada vazia à cobertura ilustrativa.
            O volume real é individual.
          </p>
        </Reveal>

        {/* Mobile: mapa → slider → leitura. Desktop: mapa | painel, slider abaixo. */}
        <div className="mt-8 grid min-w-0 items-start gap-8 sm:mt-10 lg:mt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          <div className="min-w-0 space-y-6 sm:space-y-8">
            <Reveal delayMs={180} variant="scale">
              <div className="relative overflow-hidden border border-white/10 bg-[#080a12]">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent"
                  aria-hidden
                />
                <ScalpMapSvg
                  fill={fill}
                  focus={stage.focus}
                  className="mx-auto block h-auto w-full max-w-none sm:max-w-lg"
                />
              </div>
            </Reveal>

            {/* Slider colado ao mapa no mobile */}
            <Reveal delayMs={200} className="lg:hidden">
              <PlanSlider scale={scale} pct={pct} onChange={setScale} />
            </Reveal>
          </div>

          <div className="flex min-w-0 flex-col gap-6 sm:gap-8 lg:pt-2">
            <Reveal delayMs={220} variant="up">
              <div>
                <p className="text-[0.65rem] tracking-[0.22em] text-white/40 uppercase sm:tracking-[0.28em]">
                  Etapa do plano
                </p>
                <p className="font-display mt-2 text-2xl text-brand-gold sm:text-3xl md:text-4xl">
                  {stage.title}
                </p>
                <p className="font-serif-body mt-2 text-sm leading-relaxed text-white/70 sm:mt-3 sm:text-base">
                  {stage.detail}
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={260} variant="up">
              <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-5 sm:gap-4 sm:pt-6">
                <div className="min-w-0">
                  <p className="text-[0.65rem] tracking-[0.22em] text-white/40 uppercase sm:tracking-[0.28em]">
                    Densidade ilustrativa
                  </p>
                  <p className="font-display mt-1 text-3xl text-white tabular-nums sm:text-4xl md:text-5xl">
                    {pct}
                    <span className="ml-1.5 text-sm font-normal tracking-normal text-white/35 sm:ml-2 sm:text-base">
                      % do plano simulado
                    </span>
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/45 sm:text-sm">
                    Não é quantidade de enxertos — cada paciente tem um limite
                    próprio, definido na avaliação.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delayMs={300} variant="up">
              <ul className="grid gap-2.5 text-sm text-white/55 sm:gap-3">
                <Legend
                  swatch="donor"
                  label="Doadora — ferradura residual"
                />
                <Legend
                  swatch="empty"
                  label="Receptora — vazia no ponto de partida"
                />
                <Legend
                  swatch="graft"
                  label="Enxerto — densidade ilustrativa"
                />
              </ul>
            </Reveal>

            <Reveal delayMs={340} variant="up">
              <a
                href={whatsappUrl(
                  "Olá! Vi o mapa de planejamento no site e gostaria de agendar minha avaliação.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center bg-brand-gold px-6 py-3.5 text-center text-sm font-semibold tracking-wide text-brand-charcoal transition-colors hover:bg-brand-gold-soft sm:w-auto sm:px-7"
              >
                Agendar avaliação para o plano real
              </a>
            </Reveal>
          </div>
        </div>

        {/* Slider desktop — abaixo do grid */}
        <Reveal
          delayMs={200}
          className="mx-auto mt-10 hidden max-w-xl lg:mt-12 lg:block"
        >
          <PlanSlider scale={scale} pct={pct} onChange={setScale} />
        </Reveal>

        <p className="mt-8 px-1 text-center text-[0.7rem] leading-relaxed tracking-wide text-white/40 sm:mt-8 sm:text-xs">
          Simulação educativa — não indica quantos enxertos você precisa ou
          pode receber. O plano real só é definido após avaliação presencial,
          conforme a área doadora e o desenho do seu caso.
        </p>
      </div>
    </section>
  );
}

function PlanSlider({
  scale,
  pct,
  onChange,
}: {
  scale: number;
  pct: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-end justify-between gap-3">
        <label
          htmlFor="plan-density"
          className="text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase sm:text-xs"
        >
          Escala do planejamento
        </label>
        <p className="shrink-0 text-[0.65rem] tracking-wide text-white/40 uppercase">
          {pct}%
        </p>
      </div>

      <input
        id="plan-density"
        type="range"
        min={0}
        max={PLAN_SCALE_MAX}
        step={1}
        value={scale}
        onChange={(e) => onChange(Number(e.target.value))}
        className="plan-range h-2 w-full cursor-pointer appearance-none rounded-none bg-white/15"
        aria-valuemin={0}
        aria-valuemax={PLAN_SCALE_MAX}
        aria-valuenow={scale}
        aria-valuetext={`${pct} por cento do plano ilustrativo`}
        style={{
          background: `linear-gradient(to right, var(--color-brand-gold, #b6a46e) 0%, var(--color-brand-gold, #b6a46e) ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`,
        }}
      />

      <div className="mt-2 flex justify-between text-[0.6rem] tracking-wide text-white/40 uppercase sm:text-[0.65rem]">
        <span>Calvo</span>
        <span>Entradas</span>
        <span>Linha</span>
        <span>Completo</span>
      </div>
    </div>
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
    <li className="flex items-start gap-3">
      <span
        className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 ${tone}`}
        aria-hidden
      />
      <span className="min-w-0 leading-snug">{label}</span>
    </li>
  );
}
