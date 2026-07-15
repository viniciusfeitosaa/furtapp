import Image from "next/image";
import { SITE, whatsappUrl } from "@/lib/site";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-black text-white"
    >
      {/* Camada com blur — forte à esquerda, some à direita */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-[92%] sm:w-[78%] md:w-[62%] lg:w-[55%] xl:w-[50%]"
        aria-hidden
        style={{
          filter: "blur(28px)",
          transform: "scale(1.06)",
          WebkitMaskImage:
            "linear-gradient(to right, #000 0%, #000 35%, transparent 72%)",
          maskImage:
            "linear-gradient(to right, #000 0%, #000 35%, transparent 72%)",
        }}
      >
        <Image
          src="/media/dr-francisco-retrato-hero3.png"
          alt=""
          fill
          priority
          className="object-contain object-right object-bottom md:object-cover md:object-[center_12%]"
          sizes="(max-width: 768px) 92vw, 55vw"
        />
      </div>

      {/* Foto nítida — some suavemente da direita para a esquerda */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-[92%] sm:w-[78%] md:w-[62%] lg:w-[55%] xl:w-[50%]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, transparent 8%, #000 48%, #000 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, transparent 8%, #000 48%, #000 100%)",
        }}
      >
        <Image
          src="/media/dr-francisco-retrato-hero3.png"
          alt="Dr. Francisco Furtado"
          fill
          priority
          className="object-contain object-right object-bottom md:object-cover md:object-[center_12%]"
          sizes="(max-width: 768px) 92vw, 55vw"
        />
      </div>

      {/* Degradê escuro reforçando o blend para o texto */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, #000000 0%, #000000 38%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.1) 75%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.8) 100%)",
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
