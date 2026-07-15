import Image from "next/image";
import { SITE, whatsappUrl } from "@/lib/site";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] items-end overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(105deg, #000000 0%, #000000 32%, #1a1a1a 48%, #323232 68%, #5c5c5c 88%, #7b7b7b 100%)",
      }}
    >
      {/* Retrato com fundo removido — ancorado à direita sobre o degradê */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-[70%] md:w-[58%] lg:w-[52%]">
        <Image
          src="/media/dr-francisco-retrato-hero4-removebg-preview.png"
          alt="Dr. Francisco Furtado"
          fill
          priority
          className="object-contain object-bottom object-right opacity-95"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 52vw"
        />
      </div>

      {/* Refino de legibilidade do texto à esquerda / mobile */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 42%, transparent 68%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 35%, rgba(0,0,0,0.72) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36"
        aria-hidden
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)",
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
