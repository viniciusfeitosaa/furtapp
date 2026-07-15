import type { Metadata } from "next";
import Link from "next/link";
import { CHECKPOINTS, PHOTO_REGIONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Login do paciente",
  robots: { index: false, follow: false },
};

export default function PacienteLoginPage() {
  return (
    <div className="min-h-screen bg-brand-quiet pt-28 pb-20">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-6 h-px w-12 bg-brand-gold" aria-hidden />
        <p className="text-[0.7rem] tracking-[0.3em] text-brand-charcoal uppercase">
          Área do paciente
        </p>
        <h1 className="font-display mt-3 text-4xl text-black">
          Acompanhe sua evolução
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-brand-charcoal">
          Envie 5 fotos padronizadas a cada checkpoint ({CHECKPOINTS.join(", ")})
          e receba o retorno do Dr. Francisco no seu painel.
        </p>

        <form className="mt-8 space-y-4 border border-brand-gray-mid bg-white p-6">
          <p className="text-xs text-brand-gray">
            Autenticação real entra na Fase 2. Este é o protótipo de tela.
          </p>
          <div>
            <label
              className="text-xs font-medium text-black uppercase"
              htmlFor="email"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="mt-2 w-full border border-brand-gray-mid bg-white px-3 py-2.5 text-sm text-brand-charcoal outline-none focus:border-black"
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label
              className="text-xs font-medium text-black uppercase"
              htmlFor="senha"
            >
              Senha
            </label>
            <input
              id="senha"
              type="password"
              className="mt-2 w-full border border-brand-gray-mid bg-white px-3 py-2.5 text-sm text-brand-charcoal outline-none focus:border-black"
              autoComplete="current-password"
            />
          </div>
          <Link
            href="/paciente"
            className="inline-flex w-full items-center justify-center bg-black px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-charcoal"
          >
            Entrar (protótipo)
          </Link>
        </form>

        <ul className="mt-8 space-y-1.5 text-xs text-brand-charcoal">
          {PHOTO_REGIONS.map((r) => (
            <li key={r.id}>• {r.label}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
