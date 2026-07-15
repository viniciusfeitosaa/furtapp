import { SITE, whatsappUrl } from "@/lib/site";

/** Degradês com muitos stops — preto → cinza sem degraus */
const BG_MOBILE =
  "linear-gradient(180deg, #afafaf 0%, #a6a6a6 8%, #9a9a9a 16%, #8a8a8a 24%, #767676 34%, #5e5e5e 44%, #484848 54%, #333333 64%, #222222 74%, #141414 84%, #080808 92%, #000000 100%)";

const BG_DESKTOP =
  "linear-gradient(105deg, #000000 0%, #050505 10%, #0c0c0c 18%, #151515 26%, #1f1f1f 34%, #2b2b2b 42%, #3a3a3a 50%, #4c4c4c 58%, #606060 66%, #767676 74%, #8c8c8c 82%, #9e9e9e 90%, #afafaf 100%)";

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
  WebkitMaskImage:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 5%, #000 14%, #000 55%, rgba(0,0,0,0.55) 72%, transparent 92%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.4) 8%, #000 18%, #000 82%, rgba(0,0,0,0.4) 92%, transparent 100%)",
  maskImage:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 5%, #000 14%, #000 55%, rgba(0,0,0,0.55) 72%, transparent 92%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.4) 8%, #000 18%, #000 82%, rgba(0,0,0,0.4) 92%, transparent 100%)",
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

      {/* Mobile: retrato em cima, inteiro, fundido no degradê */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex h-[58svh] items-start justify-center md:hidden"
        style={MASK_MOBILE}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/dr-francisco-retrato-hero6.jpg"
          alt="Dr. Francisco Furtado"
          width={922}
          height={1152}
          decoding="async"
          fetchPriority="high"
          className="h-full w-auto max-w-[92%] object-contain object-top"
        />
      </div>

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

      {/* Overlay desktop — texto à esquerda */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
        style={{
          background:
            "linear-gradient(105deg, #000000 0%, rgba(0,0,0,0.95) 12%, rgba(0,0,0,0.82) 24%, rgba(0,0,0,0.58) 38%, rgba(30,30,30,0.32) 52%, rgba(80,80,80,0.14) 68%, rgba(175,175,175,0.05) 82%, transparent 100%)",
        }}
      />

      {/* Overlay mobile — transição foto → texto */}
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.04) 22%, rgba(0,0,0,0.35) 48%, rgba(0,0,0,0.72) 64%, rgba(0,0,0,0.92) 80%, #000000 100%)",
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
