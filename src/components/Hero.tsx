import Image from "next/image";
import { SITE, whatsappUrl } from "@/lib/site";

const PHOTO_MASK_DESKTOP = {
  WebkitMaskImage:
    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.25) 8%, #000 22%, #000 92%, rgba(0,0,0,0.4) 97%, transparent 100%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 5%, #000 14%, #000 90%, rgba(0,0,0,0.45) 96%, transparent 100%)",
  maskImage:
    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.25) 8%, #000 22%, #000 92%, rgba(0,0,0,0.4) 97%, transparent 100%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 5%, #000 14%, #000 90%, rgba(0,0,0,0.45) 96%, transparent 100%)",
  WebkitMaskComposite: "source-in" as const,
  maskComposite: "intersect" as const,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
};

const PHOTO_MASK_MOBILE = {
  WebkitMaskImage:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 4%, #000 12%, #000 62%, rgba(0,0,0,0.4) 78%, transparent 92%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.5) 6%, #000 16%, #000 84%, rgba(0,0,0,0.5) 94%, transparent 100%)",
  maskImage:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 4%, #000 12%, #000 62%, rgba(0,0,0,0.4) 78%, transparent 92%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.5) 6%, #000 16%, #000 84%, rgba(0,0,0,0.5) 94%, transparent 100%)",
  WebkitMaskComposite: "source-in" as const,
  maskComposite: "intersect" as const,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
};

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden text-white md:block"
      style={{
        background:
          "linear-gradient(180deg, #afafaf 0%, #8a8a8a 22%, #4a4a4a 48%, #1a1a1a 72%, #000000 100%)",
      }}
    >
      {/* Fundo desktop: preto → cinza horizontal */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
        style={{
          background:
            "linear-gradient(105deg, #000000 0%, #000000 30%, #1f1f1f 45%, #4a4a4a 62%, #7a7a7a 78%, #afafaf 100%)",
        }}
      />

      {/* Mobile: retrato na metade superior, inteiro, fundido no degradê vertical */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[62%] md:hidden"
        style={PHOTO_MASK_MOBILE}
      >
        <Image
          src="/media/dr-francisco-retrato-hero6.png"
          alt="Dr. Francisco Furtado"
          fill
          priority
          className="object-contain object-[center_8%]"
          sizes="100vw"
        />
      </div>

      {/* Desktop: retrato à direita na proporção real */}
      <div
        className="pointer-events-none absolute right-0 bottom-0 hidden h-full max-w-full md:block"
        style={{
          aspectRatio: "922 / 1152",
          ...PHOTO_MASK_DESKTOP,
        }}
      >
        <Image
          src="/media/dr-francisco-retrato-hero6.png"
          alt=""
          fill
          priority
          className="object-contain object-right object-bottom"
          sizes="55vw"
          aria-hidden
        />
      </div>

      {/* Overlay desktop — legibilidade à esquerda */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
        style={{
          background:
            "linear-gradient(105deg, #000000 0%, rgba(0,0,0,0.88) 26%, rgba(40,40,40,0.45) 48%, rgba(175,175,175,0.12) 72%, transparent 100%)",
        }}
      />

      {/* Overlay mobile — texto na base, foto acima */}
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 28%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.92) 78%, #000000 100%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-28 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-5 md:absolute md:inset-x-0 md:bottom-0 md:px-6 md:pt-32 md:pb-28">
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
