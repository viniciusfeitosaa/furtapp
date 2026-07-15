import { SITE, whatsappUrl } from "@/lib/site";

/** Azul mais escuro à esquerda → cinza à direita */
const BG_MOBILE =
  "linear-gradient(180deg, #afafaf 0%, #9a9a9a 12%, #6a6f7a 28%, #3a4152 48%, #1a2030 68%, #0c1018 84%, #060810 100%)";

const BG_DESKTOP =
  "linear-gradient(90deg, #060810 0%, #0a0e16 12%, #0f1420 24%, #141a28 36%, #1a2232 48%, #2a3344 60%, #4a5260 72%, #7a7a7a 86%, #afafaf 100%)";

const MASK_DESKTOP = {
  WebkitMaskImage:
    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.45) 24%, rgba(0,0,0,0.8) 38%, #000 52%, #000 90%, rgba(0,0,0,0.5) 96%, transparent 100%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 6%, rgba(0,0,0,0.75) 14%, #000 24%, #000 88%, rgba(0,0,0,0.45) 95%, transparent 100%)",
  maskImage:
    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.45) 24%, rgba(0,0,0,0.8) 38%, #000 52%, #000 90%, rgba(0,0,0,0.5) 96%, transparent 100%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 6%, rgba(0,0,0,0.75) 14%, #000 24%, #000 88%, rgba(0,0,0,0.45) 95%, transparent 100%)",
  WebkitMaskComposite: "source-in" as const,
  maskComposite: "intersect" as const,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
};

const MASK_MOBILE = {
  /* Máscara na caixa real da foto — fade longo embaixo e nas laterais */
  WebkitMaskImage:
    "linear-gradient(180deg, #000 0%, #000 42%, rgba(0,0,0,0.85) 58%, rgba(0,0,0,0.45) 72%, rgba(0,0,0,0.12) 86%, transparent 100%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 10%, #000 22%, #000 78%, rgba(0,0,0,0.35) 90%, transparent 100%)",
  maskImage:
    "linear-gradient(180deg, #000 0%, #000 42%, rgba(0,0,0,0.85) 58%, rgba(0,0,0,0.45) 72%, rgba(0,0,0,0.12) 86%, transparent 100%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 10%, #000 22%, #000 78%, rgba(0,0,0,0.35) 90%, transparent 100%)",
  WebkitMaskComposite: "source-in" as const,
  maskComposite: "intersect" as const,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
};

/**
 * Visual restaurado (foto + degradês + bordas suaves).
 * Mantém img JPEG leve (sem next/image / blur GPU) para o preview continuar estável.
 */
export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex h-[100svh] flex-col justify-end overflow-hidden text-white"
      style={{ background: BG_MOBILE }}
    >
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
        style={{ background: BG_DESKTOP }}
      />

      {/* Mobile: caixa na proporção da foto + máscara nas bordas reais */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[60svh] max-w-[94vw] -translate-x-1/2 md:hidden"
        style={{ aspectRatio: "922 / 1152", ...MASK_MOBILE }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/dr-francisco-retrato-hero6.jpg"
          alt="Dr. Francisco Furtado"
          width={922}
          height={1152}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-top"
        />
      </div>

      {/* Véu extra só no mobile — dissolve a base da foto no degradê */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[28svh] h-[40svh] md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(110,110,110,0.12) 20%, rgba(20,26,40,0.5) 50%, rgba(10,14,22,0.82) 75%, #060810 100%)",
        }}
      />

      {/* Desktop: retrato à direita na proporção, bordas suaves */}
      <div
        className="pointer-events-none absolute right-0 bottom-0 hidden h-[100svh] max-w-full md:block"
        style={{ aspectRatio: "922 / 1152", ...MASK_DESKTOP }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/dr-francisco-retrato-hero6.jpg"
          alt=""
          width={922}
          height={1152}
          decoding="async"
          fetchPriority="high"
          aria-hidden
          className="h-full w-full object-contain object-right object-bottom"
        />
      </div>

      {/* Overlay desktop — texto à esquerda (navy em vez de preto) */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, #060810 0%, rgba(6,8,16,0.96) 14%, rgba(10,14,22,0.88) 28%, rgba(15,20,32,0.62) 44%, rgba(26,34,50,0.32) 60%, rgba(80,90,110,0.12) 78%, transparent 100%)",
        }}
      />

      {/* Overlay mobile — transição foto → texto (navy) */}
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(175,175,175,0.12) 0%, rgba(10,14,22,0.04) 18%, rgba(10,14,22,0.28) 40%, rgba(8,12,20,0.62) 56%, rgba(6,8,16,0.9) 72%, #060810 88%, #060810 100%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-28 pb-8 sm:px-5 md:px-6 md:pb-28">
        <div className="mb-5 h-px w-12 bg-brand-gold md:mb-8 md:w-16" aria-hidden />
        <p className="mb-3 text-[0.65rem] tracking-[0.28em] text-brand-gold uppercase sm:mb-5 sm:text-[0.7rem] sm:tracking-[0.35em]">
          {SITE.tagline}
        </p>
        <h1 className="font-display max-w-[14ch] text-[2.75rem] leading-[0.95] text-white sm:max-w-xl sm:text-6xl md:max-w-2xl md:text-7xl lg:text-8xl">
          Francisco Furtado
        </h1>
        <p className="font-serif-body mt-5 max-w-md text-base leading-relaxed text-white/80 sm:mt-8 sm:text-lg md:max-w-lg md:text-xl">
          Transplante capilar seguro, ético e natural — devolver autoestima com
          ciência, arte e cuidado humano em Fortaleza e em todo o Ceará.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:items-center">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center bg-brand-gold px-8 py-3.5 text-sm font-semibold tracking-wide text-brand-charcoal transition-colors hover:bg-brand-gold-soft"
          >
            Agende sua avaliação
          </a>
          <a
            href="#sobre"
            className="inline-flex min-h-12 items-center justify-center border border-white/30 px-8 py-3.5 text-sm tracking-wide text-white transition-colors hover:border-white hover:bg-white hover:text-black"
          >
            Conhecer o Dr. Francisco
          </a>
        </div>
      </div>
    </section>
  );
}
