import { SITE, whatsappUrl } from "@/lib/site";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-black text-white"
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-32 md:px-6 md:pb-28">
        <div className="mb-8 h-px w-16 bg-brand-gold" aria-hidden />
        <p className="mb-5 text-[0.7rem] tracking-[0.35em] text-brand-gold uppercase">
          {SITE.tagline}
        </p>
        <h1 className="font-display max-w-3xl text-5xl leading-[0.95] text-white sm:text-6xl md:text-7xl lg:text-8xl">
          Francisco Furtado
        </h1>
        <p className="font-serif-body mt-8 max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
          Transplante capilar seguro, ético e natural — devolver autoestima com
          ciência, arte e cuidado humano em Fortaleza e em todo o Ceará.
        </p>
        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-brand-gold px-8 py-4 text-sm font-semibold tracking-wide text-brand-charcoal transition-colors hover:bg-brand-gold-soft"
          >
            Agende sua avaliação
          </a>
          <a
            href="#sobre"
            className="inline-flex items-center justify-center border border-white/30 px-8 py-4 text-sm tracking-wide text-white transition-colors hover:border-white hover:bg-white hover:text-black"
          >
            Conhecer o Dr. Francisco
          </a>
        </div>
      </div>
    </section>
  );
}
