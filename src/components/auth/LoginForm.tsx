"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/auth/login-action";

const initial: LoginState = {};

type Props = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl }: Props) {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4 border border-white/15 p-6">
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}
      <p className="text-xs text-white/45">
        Uma única entrada para administrador e paciente. O sistema redireciona
        automaticamente conforme o perfil.
      </p>
      {state.error ? (
        <p
          className="border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-200"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <div>
        <label className="text-xs uppercase" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-2 w-full border border-white/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-gold"
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label className="text-xs uppercase" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full border border-white/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-gold"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center bg-brand-gold px-4 py-3 text-sm font-semibold text-black transition-opacity disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-xs text-white/40">
        <Link href="/" className="underline-offset-2 hover:underline">
          Voltar ao site
        </Link>
      </p>
    </form>
  );
}
