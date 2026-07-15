import { SITE, whatsappUrl } from "@/lib/site";

/**
 * Hero sem next/image — evita travar o preview (optimizer + HMR)
 * e usa alturas em svh (nunca % de pai com height:auto).
 */
export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex h-[100svh] flex-col justify-end overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(165deg, #afafaf 0%, #9a9a9a 18%, #6e6e6e 40%, #2e2e2e 68%, #000000 100%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/dr-francisco-retrato-hero6.jpg"
        alt="Dr. Francisco Furtado"
        width={922}
        height={1152}
        decoding="async"
        fetchPriority="high"
        className="pointer-events-none absolute top-0 right-0 left-0 mx-auto h-[52svh] w-auto max-w-[92%] object-contain object-top md:top-auto md:right-0 md:bottom-0 md:left-auto md:mx-0 md:h-[92svh] md:max-w-[min(48vw,520px)] md:object-bottom"
      />

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
