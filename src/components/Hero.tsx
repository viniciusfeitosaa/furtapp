import { SITE, whatsappUrl } from "@/lib/site";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-brand-navy text-white"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 75% 30%, #96a4c9 0%, transparent 52%), linear-gradient(155deg, #000000 0%, #39426b 42%, #323232 100%)",
          opacity: 0.95,
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-35"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 60% 45%, rgba(150,164,201,0.4), transparent 55%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        aria-hidden
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-32 md:px-6 md:pb-28">
        <p className="mb-4 text-[0.7rem] tracking-[0.35em] text-brand-gold-soft uppercase">
          {SITE.tagline}
        </p>
        <h1 className="font-display max-w-3xl text-5xl leading-none text-white sm:text-6xl md:text-7xl">
          Francisco Furtado
        </h1>
        <p className="font-serif-body mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">
          Transplante capilar seguro, ético e natural — devolver autoestima com
          ciência, arte e cuidado humano em Fortaleza e em todo o Ceará.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-brand-gold px-8 py-4 text-sm font-semibold tracking-wide text-brand-charcoal transition-opacity hover:opacity-90"
          >
            Agende sua avaliação
          </a>
          <a
            href="#sobre"
            className="inline-flex items-center justify-center border border-brand-blue-gray/70 px-8 py-4 text-sm tracking-wide text-white transition-colors hover:border-brand-gold hover:text-brand-gold"
          >
            Conhecer o Dr. Francisco
          </a>
        </div>
      </div>
    </section>
  );
}
