"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const HairlineCanvas = dynamic(
  () =>
    import("@/components/hairline/HairlineCanvas").then((m) => m.HairlineCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[16/10] w-full items-center justify-center bg-[#060810] text-sm text-white/40 md:aspect-[21/9]">
        Carregando linha anterior…
      </div>
    ),
  },
);

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

function progressHint(t: number): string {
  if (t < 0.08) return "Antes — entradas marcadas, linha recuada";
  if (t < 0.45) return "Planejamento — a linha começa a avançar com critério";
  if (t < 0.8) return "Definição — arco mais natural, têmporas suaves";
  return "Natural — a linha que ninguém lê como transplante";
}

export function HairlineSection() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [progress, setProgress] = useState(0);
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
  const pct = Math.round(progress * 100);

  return (
    <section
      ref={ref}
      id="linha-anterior"
      className="scroll-mt-24 bg-[#060810] px-4 py-20 text-white md:px-6 md:py-28"
      aria-labelledby="linha-anterior-title"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-[0.7rem] tracking-[0.3em] text-brand-gold uppercase">
          Planejamento
        </p>
        <h2
          id="linha-anterior-title"
          className="font-display max-w-3xl text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl"
        >
          A linha anterior que ninguém nota como transplante
        </h2>
        <p className="font-serif-body mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          Do recuo das entradas ao arco natural — uma curva desenhada para o
          formato do rosto, não copiada de um padrão. Arraste o controle e veja
          a linha evoluir.
        </p>

        <div className="mt-8 max-w-xl">
          <div className="mb-3 flex items-end justify-between gap-4">
            <label
              htmlFor="hairline-progress"
              className="text-xs font-semibold tracking-wide text-white/70 uppercase"
            >
              Evolução da linha
            </label>
            <p className="font-display text-2xl text-brand-gold tabular-nums sm:text-3xl">
              {pct}
              <span className="ml-1 text-sm font-normal tracking-normal text-white/45">
                %
              </span>
            </p>
          </div>

          <input
            id="hairline-progress"
            type="range"
            min={0}
            max={100}
            step={1}
            value={pct}
            onChange={(e) => setProgress(Number(e.target.value) / 100)}
            className="h-2 w-full cursor-pointer appearance-none bg-white/15 accent-brand-gold"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-valuetext={progressHint(progress)}
            style={{
              background: `linear-gradient(to right, var(--color-brand-gold, #c4b07a) 0%, var(--color-brand-gold, #c4b07a) ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`,
            }}
          />

          <div className="mt-2 flex justify-between text-[0.65rem] tracking-wide text-white/40 uppercase">
            <span>Antes</span>
            <span>Natural</span>
          </div>
          <p className="mt-3 text-sm text-white/55">{progressHint(progress)}</p>
        </div>

        <div className="mt-8 overflow-hidden border border-white/10">
          {show3d ? (
            <HairlineCanvas progress={progress} />
          ) : (
            <div className="flex aspect-[16/10] w-full items-center justify-center bg-[#060810] px-6 text-center text-sm text-white/45 md:aspect-[21/9]">
              Representação da linha anterior — do recuo ao resultado natural.
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-xs leading-relaxed tracking-wide text-white/45">
          Simulação ilustrativa da linha anterior. O desenho real é definido na
          avaliação presencial, para o seu rosto.
        </p>
      </div>
    </section>
  );
}
