import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { SITE, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Agende sua Avaliação | Fortaleza",
  description:
    "Fale pelo WhatsApp ou agende sua avaliação para transplante capilar com o Dr. Francisco Furtado. Atendimento em Fortaleza e todo o Ceará.",
};

export default function ContatoPage() {
  return (
    <div className="bg-white pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-brand-charcoal uppercase">
          Contato
        </p>
        <h1 className="font-display mt-3 text-5xl text-black">
          Vamos conversar sobre o seu caso
        </h1>
        <p className="font-serif-body mt-6 text-lg text-brand-charcoal">
          Toda avaliação começa com uma conversa. Fale pelo WhatsApp, envie um
          e-mail ou agende diretamente sua avaliação — atendimento em{" "}
          {SITE.region}.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-brand-gold px-6 py-3.5 text-sm font-semibold text-brand-charcoal transition-colors hover:bg-brand-gold-soft"
          >
            Falar no WhatsApp
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="inline-flex items-center justify-center border border-brand-gray-mid px-6 py-3.5 text-sm text-brand-charcoal transition-colors hover:border-black hover:text-black"
          >
            {SITE.email}
          </a>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
