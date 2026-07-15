import Image from "next/image";
import { SITE, whatsappUrl } from "@/lib/site";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] items-end overflow-hidden text-white"
      style={{
        /* Cinza final ≈ fundo do estúdio (#afafaf) para suavizar a borda direita */
        background:
          "linear-gradient(105deg, #000000 0%, #000000 30%, #1f1f1f 45%, #4a4a4a 62%, #7a7a7a 78%, #afafaf 100%)",
      }}
    >
      {/* Caixa da foto (proporção real) + máscara nas bordas para fundir no degradê */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-full max-w-full"
        style={{
          aspectRatio: "922 / 1152",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.25) 8%, #000 22%, #000 92%, rgba(0,0,0,0.4) 97%, transparent 100%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 5%, #000 14%, #000 90%, rgba(0,0,0,0.45) 96%, transparent 100%)",
          maskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.25) 8%, #000 22%, #000 92%, rgba(0,0,0,0.4) 97%, transparent 100%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 5%, #000 14%, #000 90%, rgba(0,0,0,0.45) 96%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
        }}
      >
        <Image
          src="/media/dr-francisco-retrato-hero6.png"
          alt="Dr. Francisco Furtado"
          fill
          priority
          className="object-contain object-bottom object-right"
          sizes="(max-width: 768px) 100vw, 55vw"
        />
      </div>

      {/* Degradê preto → cinza + legibilidade do texto à esquerda */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(105deg, #000000 0%, rgba(0,0,0,0.88) 26%, rgba(40,40,40,0.45) 48%, rgba(175,175,175,0.12) 72%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.8) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36"
        aria-hidden
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-32 md:px-6 md:pb-28">
        <div className="mb-8 h-px w-16 bg-brand-gold" aria-hidden />
        <p className="mb-5 text-[0.7rem] tracking-[0.35em] text-brand-gold uppercase">
          {SITE.tagline}
        </p>
        <h1 className="font-display max-w-xl text-5xl leading-[0.95] text-white sm:text-6xl md:max-w-2xl md:text-7xl lg:text-8xl">
          Francisco Furtado
        </h1>
        <p className="font-serif-body mt-8 max-w-md text-lg leading-relaxed text-white/80 md:max-w-lg md:text-xl">
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
