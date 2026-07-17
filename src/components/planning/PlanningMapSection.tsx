"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { ScalpMapSvg } from "@/components/planning/ScalpMapSvg";
import {
  PLAN_MAX_GRAFTS,
  RECEPTOR_ZONES,
  formatGrafts,
  planGrafts,
  planStage,
  zoneFills,
  zoneGrafts,
  type ReceptorZoneId,
} from "@/lib/planningMap";
import { whatsappUrl } from "@/lib/site";

const ZONE_UI: Record<ReceptorZoneId, { label: string }> = {
  templeL: { label: "Entrada esquerda" },
  templeR: { label: "Entrada direita" },
  frontal: { label: "Linha anterior" },
  mid: { label: "Couro médio" },
  crown: { label: "Coroa" },
};

export function PlanningMapSection() {
  const [graftCount, setGraftCount] = useState(0);
  const fill = graftCount / PLAN_MAX_GRAFTS;
  const pct = Math.round(fill * 100);
  const stage = useMemo(() => planStage(graftCount), [graftCount]);
  const fills = useMemo(() => zoneFills(fill), [fill]);
  const graftsByZone = useMemo(() => zoneGrafts(fill), [fill]);

  return (
    <section
      id="foliculo"
      className="scroll-mt-24 px-4 py-20 text-white md:px-6 md:py-28"
      style={{ background: "#0f1115" }}
      aria-labelledby="plan-map-title"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="mb-3 text-[0.7rem] tracking-[0.3em] text-[#5ee7ff] uppercase">
            Planejamento · Scanner axial
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
          <p className="font-serif-body mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Leitura técnica do couro: área doadora, zonas receptoras e densidade
            do plano. Ajuste a escala e veja o escaneamento se formar — da
            entrada vazia à densidade máxima ilustrativa.
          </p>
        </Reveal>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
          <Reveal delayMs={180} variant="scale">
            <div
              className="relative overflow-hidden border border-[#2a3548]"
              style={{ background: "#0f1115" }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00d2ff]/70 to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[#00d2ff]/25 to-transparent"
                aria-hidden
              />
              <ScalpMapSvg
                fill={fill}
                focus={stage.focus}
                className="mx-auto block h-auto w-full max-w-xl"
              />
            </div>
          </Reveal>

          <div className="flex flex-col gap-7 lg:pt-2">
            <Reveal delayMs={220} variant="right">
              <div>
                <p className="text-[0.65rem] tracking-[0.28em] text-[#5ee7ff]/70 uppercase">
                  Etapa do plano
                </p>
                <p className="font-display mt-2 text-3xl text-[#5ee7ff] sm:text-4xl">
                  {stage.title}
                </p>
                <p className="font-serif-body mt-3 text-base leading-relaxed text-white/65">
                  {stage.detail}
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={260} variant="right">
              <div className="border-t border-[#2a3548] pt-6">
                <p className="text-[0.65rem] tracking-[0.28em] text-white/35 uppercase">
                  Unidades foliculares
                </p>
                <p className="font-display mt-1 text-4xl text-white tabular-nums sm:text-5xl">
                  {formatGrafts(planGrafts(fill))}
                  <span className="ml-2 text-base font-normal tracking-normal text-white/30">
                    / {formatGrafts(PLAN_MAX_GRAFTS)}
                  </span>
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={300} variant="right">
              <div>
                <p className="mb-3 text-[0.65rem] tracking-[0.28em] text-white/35 uppercase">
                  Distribuição por zona
                </p>
                <ul className="space-y-2.5">
                  {RECEPTOR_ZONES.map((z) => {
                    const level = fills[z.id];
                    const n = graftsByZone[z.id];
                    const active =
                      stage.focus === z.id ||
                      (stage.focus === "temples" &&
                        (z.id === "templeL" || z.id === "templeR"));
                    return (
                      <li key={z.id}>
                        <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                          <span
                            className={
                              active ? "text-[#5ee7ff]" : "text-white/55"
                            }
                          >
                            {ZONE_UI[z.id].label}
                          </span>
                          <span className="tabular-nums text-white/40">
                            {formatGrafts(n)}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-[#1e2330]">
                          <div
                            className="h-full transition-[width] duration-500 ease-out"
                            style={{
                              width: `${Math.round(level * 100)}%`,
                              background:
                                "linear-gradient(90deg, #00a8c8, #5ee7ff)",
                              opacity: 0.4 + level * 0.6,
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>

            <Reveal delayMs={340} variant="right">
              <ul className="grid gap-2.5 text-sm text-white/45">
                <Legend
                  color="#b6a46e"
                  label="Doadora — overlay âmbar na ferradura"
                />
                <Legend
                  color="transparent"
                  border="#00d2ff"
                  dashed
                  label="Receptora — zona de planejamento"
                />
                <Legend
                  color="#00d2ff"
                  label="Scan HUD — densidade do plano"
                />
              </ul>
            </Reveal>

            <Reveal delayMs={380} variant="right">
              <a
                href={whatsappUrl(
                  "Olá! Vi o mapa de planejamento no site e gostaria de agendar minha avaliação.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center px-7 py-3.5 text-sm font-semibold tracking-wide text-[#0f1115] transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(90deg, #00b4d0, #5ee7ff)",
                }}
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
              className="text-xs font-semibold tracking-wide text-white/65 uppercase"
            >
              Escala do planejamento
            </label>
            <p className="text-[0.65rem] tracking-wide text-white/35 uppercase">
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
            className="h-2 w-full cursor-pointer appearance-none rounded-none"
            aria-valuemin={0}
            aria-valuemax={PLAN_MAX_GRAFTS}
            aria-valuenow={graftCount}
            aria-valuetext={`${formatGrafts(graftCount)} unidades foliculares`}
            style={{
              background: `linear-gradient(to right, #00d2ff 0%, #00d2ff ${pct}%, #1e2330 ${pct}%, #1e2330 100%)`,
              accentColor: "#00d2ff",
            }}
          />

          <div className="mt-2 flex justify-between text-[0.65rem] tracking-wide text-white/35 uppercase">
            <span>Calvo</span>
            <span>1.000</span>
            <span>5.000</span>
            <span>Máximo</span>
          </div>
        </Reveal>

        <p className="mt-8 text-center text-xs leading-relaxed tracking-wide text-white/35">
          Simulação ilustrativa para educação do paciente. O número real de
          enxertos e a distribuição por zona são definidos apenas após avaliação
          presencial, conforme a área doadora disponível.
        </p>
      </div>
    </section>
  );
}

function Legend({
  color,
  label,
  border,
  dashed,
}: {
  color: string;
  label: string;
  border?: string;
  dashed?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="inline-block h-2.5 w-2.5 shrink-0"
        style={{
          background: color,
          border: border
            ? `${dashed ? "1px dashed" : "1px solid"} ${border}`
            : undefined,
        }}
        aria-hidden
      />
      <span>{label}</span>
    </li>
  );
}
