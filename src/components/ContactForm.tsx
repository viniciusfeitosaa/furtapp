"use client";

import { FormEvent, useState } from "react";
import { SITE, whatsappUrl } from "@/lib/site";

export function ContactForm() {
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [msg, setMsg] = useState("Gostaria de agendar uma avaliação.");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = `Olá! Sou ${nome || "interessado(a)"}.\nTelefone: ${tel || "—"}\n\n${msg}`;
    window.open(whatsappUrl(text), "_blank", "noopener,noreferrer");
  }

  return (
    <form className="mt-14 space-y-5" onSubmit={onSubmit}>
      <div>
        <label htmlFor="nome" className="text-xs tracking-wide uppercase">
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mt-2 w-full border border-brand-gray-mid bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold"
        />
      </div>
      <div>
        <label htmlFor="tel" className="text-xs tracking-wide uppercase">
          Telefone / WhatsApp
        </label>
        <input
          id="tel"
          name="tel"
          required
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          className="mt-2 w-full border border-brand-gray-mid bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold"
        />
      </div>
      <div>
        <label htmlFor="msg" className="text-xs tracking-wide uppercase">
          Mensagem
        </label>
        <textarea
          id="msg"
          name="msg"
          rows={4}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className="mt-2 w-full border border-brand-gray-mid bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold"
        />
      </div>
      <p className="text-xs text-brand-gray">
        Ao enviar, você será direcionado ao WhatsApp com os dados para contato.
        Em breve o formulário também poderá notificar {SITE.email}.
      </p>
      <button
        type="submit"
        className="bg-black px-6 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-charcoal"
      >
        Continuar no WhatsApp
      </button>
    </form>
  );
}
