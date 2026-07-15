import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login administrativo",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="bg-black pt-28 pb-20 text-white">
      <div className="mx-auto max-w-md px-4">
        <p className="text-[0.7rem] tracking-[0.3em] text-brand-gold uppercase">
          Administração
        </p>
        <h1 className="font-display mt-3 text-4xl">Painel do Dr. Francisco</h1>
        <p className="mt-4 text-sm text-white/70">
          Gerencie pacientes, revise envios fotográficos e libere feedbacks
          clínicos.
        </p>
        <form className="mt-8 space-y-4 border border-white/15 p-6">
          <p className="text-xs text-white/45">
            Auth real na Fase 2. Protótipo de tela.
          </p>
          <div>
            <label className="text-xs uppercase" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="mt-2 w-full border border-white/20 bg-transparent px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs uppercase" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              className="mt-2 w-full border border-white/20 bg-transparent px-3 py-2.5 text-sm"
            />
          </div>
          <Link
            href="/admin"
            className="inline-flex w-full items-center justify-center bg-brand-gold px-4 py-3 text-sm font-semibold text-black"
          >
            Entrar (protótipo)
          </Link>
        </form>
      </div>
    </div>
  );
}
