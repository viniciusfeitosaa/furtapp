import type { Metadata } from "next";
import { LiveTryOn } from "@/components/tryon/LiveTryOn";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Experimente ao vivo | Segmentação de cabelo",
  description:
    "Ative a câmera: a IA segmenta seu cabelo e aplica reforço de tom/densidade no aparelho — experiência educativa do Dr. Francisco Furtado.",
};

export default function ExperimentePage() {
  return (
    <div className="bg-[#060810] pt-28 pb-20 text-white">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-brand-gold uppercase">
          Experimente
        </p>
        <h1 className="font-display mt-3 max-w-3xl text-4xl leading-[1.05] sm:text-5xl">
          Veja a densidade se formar — ao vivo
        </h1>
        <p className="font-serif-body mt-5 max-w-2xl text-lg text-white/75">
          Segmentação de cabelo no aparelho (Fase 1). Com token Banuba, o site
          sobe para estilos/cor comerciais (Fase 2). Privado no seu aparelho —{" "}
          {SITE.name} não recebe a imagem.
        </p>

        <div className="mt-10">
          <LiveTryOn />
        </div>
      </div>
    </div>
  );
}
