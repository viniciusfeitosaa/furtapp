"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createPatientAction,
  type CreatePatientState,
} from "@/lib/admin/actions";

const initial: CreatePatientState = {};

export function CreatePatientForm() {
  const [state, action, pending] = useActionState(
    createPatientAction,
    initial,
  );

  const defaultDate = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="mt-8 max-w-lg space-y-4 border bg-white p-6">
      {state.error ? (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      <div>
        <label className="text-xs font-medium uppercase" htmlFor="name">
          Nome completo
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-2 w-full border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-medium uppercase" htmlFor="email">
          E-mail (login)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-2 w-full border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-medium uppercase" htmlFor="password">
          Senha inicial
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="mt-2 w-full border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-medium uppercase" htmlFor="phone">
          Telefone
        </label>
        <input id="phone" name="phone" className="mt-2 w-full border px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium uppercase" htmlFor="surgeryDate">
          Data da cirurgia (M0)
        </label>
        <input
          id="surgeryDate"
          name="surgeryDate"
          type="date"
          required
          defaultValue={defaultDate}
          className="mt-2 w-full border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-black px-5 py-2.5 text-xs font-semibold text-white uppercase disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Criar paciente"}
        </button>
        <Link
          href="/admin/pacientes"
          className="border px-5 py-2.5 text-xs font-semibold uppercase"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
