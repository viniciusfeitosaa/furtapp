import type { Metadata } from "next";
import { LiveTryOn } from "@/components/tryon/LiveTryOn";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Experimente ao vivo | Cabelo 3D",
  description:
    "Ative a câmera e veja um modelo 3D de cabelo (CC BY) no seu rosto — experiência educativa do Dr. Francisco Furtado.",
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
          Modelo 3D gratuito do Sketchfab (CC BY) ancorado no rosto com
          MediaPipe. Privado no aparelho — {SITE.name} não recebe a imagem.
        </p>

        <div className="mt-10">
          <LiveTryOn />
        </div>
      </div>
    </div>
  );
}
