import Image from "next/image";
import { SITE, whatsappUrl } from "@/lib/site";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(165deg, #afafaf 0%, #9a9a9a 18%, #6e6e6e 40%, #2e2e2e 68%, #000000 100%)",
      }}
    >
      {/* Foto leve (JPEG ~63KB) — sem blur/máscaras pesadas */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55%] md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[min(52%,520px)] lg:w-[min(48%,560px)]">
        <Image
          src="/media/dr-francisco-retrato-hero6.jpg"
          alt="Dr. Francisco Furtado"
          fill
          priority
          className="object-contain object-top md:object-bottom md:object-right"
          sizes="(max-width: 768px) 90vw, 520px"
        />
      </div>

      {/* Transição suave foto → fundo / texto (só CSS, leve) */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
        style={{
          background:
            "linear-gradient(105deg, #000000 0%, rgba(0,0,0,0.92) 28%, rgba(0,0,0,0.45) 52%, rgba(0,0,0,0.12) 72%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.05) 32%, rgba(0,0,0,0.55) 58%, rgba(0,0,0,0.92) 78%, #000 100%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-28 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-5 md:px-6 md:pb-28 md:pt-32">
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
