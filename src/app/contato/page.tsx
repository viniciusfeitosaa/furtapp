import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { SITE, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato e agendamento",
  description:
    "Agende sua avaliação de tricologia e transplante capilar com o Dr. Francisco Furtado em Fortaleza e no Ceará.",
};

export default function ContatoPage() {
  return (
    <div className="bg-white pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <p className="text-[0.7rem] tracking-[0.3em] text-brand-gold-dark uppercase">
          Contato
        </p>
        <h1 className="font-display mt-3 text-5xl">Agende sua avaliação</h1>
        <p className="font-serif-body mt-6 text-lg text-brand-charcoal">
          Atendimento em {SITE.region}. Prefere WhatsApp? Use o botão abaixo ou
          envie os dados pelo formulário.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-brand-gold px-6 py-3.5 text-sm font-semibold text-black"
          >
            Falar no WhatsApp
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="inline-flex items-center justify-center border border-black/20 px-6 py-3.5 text-sm"
          >
            {SITE.email}
          </a>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
