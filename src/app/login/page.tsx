import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="border-b border-white/10 px-4 py-4">
        <p className="mx-auto max-w-md text-[0.7rem] tracking-[0.3em] text-brand-gold uppercase">
          Portal Dr. Francisco Furtado
        </p>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <h1 className="font-display text-4xl">Entrar</h1>
        <p className="mt-4 text-sm text-white/70">
          Acesse o painel administrativo ou o acompanhamento do seu
          transplante com o mesmo login.
        </p>
        <div className="mt-8">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
        <div className="mt-8 rounded-sm border border-white/10 bg-white/[0.03] p-4 text-xs text-white/50">
          <p className="font-medium text-white/70">Ambiente de demonstração</p>
          <p className="mt-2">
            Admin: <code className="text-brand-gold">admin@ffurtado.com.br</code>
          </p>
          <p>
            Paciente: <code className="text-brand-gold">paciente@demo.com</code>
          </p>
          <p className="mt-2 text-white/40">
            Senhas definidas no seed — veja <code>.env.example</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
