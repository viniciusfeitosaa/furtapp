import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog | Tricologia e Transplante Capilar",
  description:
    "Artigos e orientações do Dr. Francisco Furtado sobre tricologia, transplante capilar e cuidado pós-operatório.",
};

export default function BlogPage() {
  return (
    <div className="bg-white pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-brand-charcoal uppercase">
          Blog
        </p>
        <h1 className="font-display mt-3 text-5xl text-black">
          Conteúdo clínico, em linguagem clara
        </h1>
        <p className="font-serif-body mt-6 text-lg text-brand-charcoal">
          Em breve, publicações sobre tricologia, indicação de transplante e o
          acompanhamento de 12 meses — do diagnóstico ao resultado. Enquanto
          isso, fale direto com a equipe.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/contato"
            className="inline-flex items-center justify-center bg-brand-gold px-6 py-3.5 text-sm font-semibold text-brand-charcoal transition-colors hover:bg-brand-gold-soft"
          >
            Agendar avaliação
          </Link>
          <Link
            href="/#inicio"
            className="inline-flex items-center justify-center border border-brand-gray-mid px-6 py-3.5 text-sm text-brand-charcoal transition-colors hover:border-black hover:text-black"
          >
            Voltar ao início
          </Link>
        </div>

        <p className="mt-16 text-sm text-brand-gray">
          {SITE.name} — {SITE.tagline}
        </p>
      </div>
    </div>
  );
}
