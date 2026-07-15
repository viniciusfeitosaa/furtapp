import { HeroCopy } from "@/components/HeroCopy";
import { HeroParallaxImage } from "@/components/HeroParallaxImage";

/** Azul mais escuro à esquerda → cinza à direita */
const BG_MOBILE =
  "linear-gradient(180deg, #afafaf 0%, #9a9a9a 12%, #6a6f7a 28%, #3a4152 48%, #1a2030 68%, #0c1018 84%, #060810 100%)";

const BG_DESKTOP =
  "linear-gradient(90deg, #060810 0%, #0a0e16 12%, #0f1420 24%, #141a28 36%, #1a2232 48%, #2a3344 60%, #4a5260 72%, #7a7a7a 86%, #afafaf 100%)";

const MASK_DESKTOP = {
  WebkitMaskImage:
    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.45) 24%, rgba(0,0,0,0.8) 38%, #000 52%, #000 90%, rgba(0,0,0,0.5) 96%, transparent 100%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 6%, rgba(0,0,0,0.75) 14%, #000 24%, #000 88%, rgba(0,0,0,0.45) 95%, transparent 100%)",
  maskImage:
    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.45) 24%, rgba(0,0,0,0.8) 38%, #000 52%, #000 90%, rgba(0,0,0,0.5) 96%, transparent 100%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 6%, rgba(0,0,0,0.75) 14%, #000 24%, #000 88%, rgba(0,0,0,0.45) 95%, transparent 100%)",
  WebkitMaskComposite: "source-in" as const,
  maskComposite: "intersect" as const,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
};

const MASK_MOBILE = {
  /* Máscara na caixa real da foto — fade longo embaixo e nas laterais */
  WebkitMaskImage:
    "linear-gradient(180deg, #000 0%, #000 42%, rgba(0,0,0,0.85) 58%, rgba(0,0,0,0.45) 72%, rgba(0,0,0,0.12) 86%, transparent 100%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 10%, #000 22%, #000 78%, rgba(0,0,0,0.35) 90%, transparent 100%)",
  maskImage:
    "linear-gradient(180deg, #000 0%, #000 42%, rgba(0,0,0,0.85) 58%, rgba(0,0,0,0.45) 72%, rgba(0,0,0,0.12) 86%, transparent 100%), linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 10%, #000 22%, #000 78%, rgba(0,0,0,0.35) 90%, transparent 100%)",
  WebkitMaskComposite: "source-in" as const,
  maskComposite: "intersect" as const,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
};

/**
 * Visual restaurado (foto + degradês + bordas suaves).
 * Mantém img JPEG leve (sem next/image / blur GPU) para o preview continuar estável.
 */
export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex h-[100svh] flex-col justify-end overflow-hidden text-white"
      style={{ background: BG_MOBILE }}
    >
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
        style={{ background: BG_DESKTOP }}
      />

      {/* Mobile: caixa na proporção da foto + máscara nas bordas reais */}
      <HeroParallaxImage
        className="pointer-events-none absolute top-0 left-1/2 h-[60svh] max-w-[94vw] -translate-x-1/2 md:hidden"
        style={{ aspectRatio: "922 / 1152", ...MASK_MOBILE }}
        imgClassName="h-full w-full object-cover object-top"
        alt="Dr. Francisco Furtado"
        maxShift={22}
      />

      {/* Véu extra só no mobile — dissolve a base da foto no degradê */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[28svh] h-[40svh] md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(110,110,110,0.12) 20%, rgba(20,26,40,0.5) 50%, rgba(10,14,22,0.82) 75%, #060810 100%)",
        }}
      />

      {/* Desktop: retrato à direita na proporção, bordas suaves */}
      <HeroParallaxImage
        className="pointer-events-none absolute right-0 bottom-0 hidden h-[100svh] max-w-full md:block"
        style={{ aspectRatio: "922 / 1152", ...MASK_DESKTOP }}
        imgClassName="h-full w-full object-contain object-right object-bottom"
        alt=""
        ariaHidden
        maxShift={36}
      />

      {/* Overlay desktop — texto à esquerda (navy em vez de preto) */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, #060810 0%, rgba(6,8,16,0.96) 14%, rgba(10,14,22,0.88) 28%, rgba(15,20,32,0.62) 44%, rgba(26,34,50,0.32) 60%, rgba(80,90,110,0.12) 78%, transparent 100%)",
        }}
      />

      {/* Overlay mobile — transição foto → texto (navy) */}
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(175,175,175,0.12) 0%, rgba(10,14,22,0.04) 18%, rgba(10,14,22,0.28) 40%, rgba(8,12,20,0.62) 56%, rgba(6,8,16,0.9) 72%, #060810 88%, #060810 100%)",
        }}
      />

      <HeroCopy />
    </section>
  );
}
