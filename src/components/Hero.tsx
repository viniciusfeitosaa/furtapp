import { SITE, whatsappUrl } from "@/lib/site";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-black text-white"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 40%, #323232 0%, transparent 55%), linear-gradient(160deg, #000 0%, #1a1a1a 45%, #463a18 140%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-30"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 60% 50%, rgba(182,164,110,0.35), transparent 55%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-32 md:px-6 md:pb-28">
        <p className="mb-4 text-[0.7rem] tracking-[0.35em] text-brand-gold uppercase">
          {SITE.tagline}
        </p>
        <h1 className="font-display max-w-3xl text-5xl leading-none text-white sm:text-6xl md:text-7xl">
          Francisco Furtado
        </h1>
        <p className="font-serif-body mt-6 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
          Transplante capilar seguro, ético e natural — devolver autoestima com
          ciência, arte e cuidado humano em Fortaleza e em todo o Ceará.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-brand-gold px-8 py-4 text-sm font-semibold tracking-wide text-black transition-opacity hover:opacity-90"
          >
            Agende sua avaliação
          </a>
          <a
            href="#sobre"
            className="inline-flex items-center justify-center border border-white/35 px-8 py-4 text-sm tracking-wide text-white transition-colors hover:border-brand-gold hover:text-brand-gold"
          >
            Conhecer o Dr. Francisco
          </a>
        </div>
      </div>
    </section>
  );
}
