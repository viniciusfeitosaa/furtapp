import Image from "next/image";
import { SITE, whatsappUrl } from "@/lib/site";

/** Degradês com muitos stops intermediários — evita “degraus” de cor */
const BG_MOBILE =
  "linear-gradient(180deg, #afafaf 0%, #a6a6a6 8%, #9a9a9a 16%, #8a8a8a 24%, #767676 34%, #5e5e5e 44%, #484848 54%, #333333 64%, #222222 74%, #141414 84%, #080808 92%, #000000 100%)";

const BG_DESKTOP =
  "linear-gradient(105deg, #000000 0%, #050505 10%, #0c0c0c 18%, #151515 26%, #1f1f1f 34%, #2b2b2b 42%, #3a3a3a 50%, #4c4c4c 58%, #606060 66%, #767676 74%, #8c8c8c 82%, #9e9e9e 90%, #afafaf 100%)";

const PHOTO_MASK_DESKTOP = {
  WebkitMaskImage:
    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.12) 10%, rgba(0,0,0,0.4) 24%, rgba(0,0,0,0.75) 38%, #000 52%, #000 88%, rgba(0,0,0,0.55) 95%, transparent 100%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 6%, rgba(0,0,0,0.7) 16%, #000 26%, #000 86%, rgba(0,0,0,0.5) 94%, transparent 100%)",
  maskImage:
    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.12) 10%, rgba(0,0,0,0.4) 24%, rgba(0,0,0,0.75) 38%, #000 52%, #000 88%, rgba(0,0,0,0.55) 95%, transparent 100%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 6%, rgba(0,0,0,0.7) 16%, #000 26%, #000 86%, rgba(0,0,0,0.5) 94%, transparent 100%)",
  WebkitMaskComposite: "source-in" as const,
  maskComposite: "intersect" as const,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
};

const PHOTO_MASK_MOBILE = {
  WebkitMaskImage:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 5%, rgba(0,0,0,0.75) 12%, #000 22%, #000 52%, rgba(0,0,0,0.65) 68%, rgba(0,0,0,0.25) 82%, transparent 96%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 8%, #000 20%, #000 80%, rgba(0,0,0,0.35) 92%, transparent 100%)",
  maskImage:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 5%, rgba(0,0,0,0.75) 12%, #000 22%, #000 52%, rgba(0,0,0,0.65) 68%, rgba(0,0,0,0.25) 82%, transparent 96%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 8%, #000 20%, #000 80%, rgba(0,0,0,0.35) 92%, transparent 100%)",
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
      style={{ background: BG_MOBILE }}
    >
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
        style={{ background: BG_DESKTOP }}
      />

      {/* Mobile: camada blur + foto nítida */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[62%] md:hidden">
        <div className="absolute inset-0 scale-110 opacity-50 blur-2xl" aria-hidden>
          <Image
            src="/media/dr-francisco-retrato-hero6.png"
            alt=""
            fill
            priority
            className="object-contain object-[center_8%]"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0" style={PHOTO_MASK_MOBILE}>
          <Image
            src="/media/dr-francisco-retrato-hero6.png"
            alt="Dr. Francisco Furtado"
            fill
            priority
            className="object-contain object-[center_8%]"
            sizes="100vw"
          />
        </div>
      </div>

      {/* Desktop: blur suave atrás + máscara longa nas bordas */}
      <div
        className="pointer-events-none absolute right-0 bottom-0 hidden h-full max-w-full md:block"
        style={{ aspectRatio: "922 / 1152" }}
      >
        <div
          className="absolute inset-0 scale-105 opacity-45 blur-3xl"
          aria-hidden
        >
          <Image
            src="/media/dr-francisco-retrato-hero6.png"
            alt=""
            fill
            priority
            className="object-contain object-right object-bottom"
            sizes="55vw"
          />
        </div>
        <div className="absolute inset-0" style={PHOTO_MASK_DESKTOP}>
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
      </div>

      {/* Overlay desktop — fades longos (sem bandas) */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
        style={{
          background:
            "linear-gradient(105deg, #000000 0%, rgba(0,0,0,0.95) 12%, rgba(0,0,0,0.82) 24%, rgba(0,0,0,0.58) 38%, rgba(30,30,30,0.32) 52%, rgba(80,80,80,0.14) 68%, rgba(175,175,175,0.05) 82%, transparent 100%)",
        }}
      />

      {/* Overlay mobile — transição longa foto → texto */}
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 18%, rgba(0,0,0,0.18) 36%, rgba(0,0,0,0.42) 50%, rgba(0,0,0,0.68) 62%, rgba(0,0,0,0.86) 74%, rgba(0,0,0,0.96) 86%, #000000 100%)",
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
