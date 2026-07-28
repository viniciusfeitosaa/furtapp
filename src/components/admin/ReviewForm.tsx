"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveReviewAction, type ReviewState } from "@/lib/admin/actions";
import { PHOTO_REGIONS } from "@/lib/site";

const initial: ReviewState = {};

type Props = {
  checkpointId: string;
  patientName: string;
  code: string;
  photoCount: number;
  defaultPrivate?: string;
  defaultFeedback?: string;
  defaultScore?: number;
  released: boolean;
};

export function ReviewForm({
  checkpointId,
  patientName,
  code,
  photoCount,
  defaultPrivate,
  defaultFeedback,
  defaultScore,
  released,
}: Props) {
  const [state, action, pending] = useActionState(saveReviewAction, initial);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <section className="border bg-white p-6">
        <h2 className="text-sm tracking-[0.2em] uppercase">
          Regiões — {patientName} / {code}
        </h2>
        <p className="mt-2 text-sm text-brand-gray">
          {photoCount}/5 fotos recebidas
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {PHOTO_REGIONS.map((r) => (
            <div
              key={r.id}
              className="flex aspect-video items-center justify-center border border-dashed border-brand-gray-mid bg-brand-gray-light/50 text-center text-[0.65rem] text-brand-gray"
            >
              {r.label}
            </div>
          ))}
        </div>
      </section>

      <form action={action} className="space-y-4 border bg-white p-6">
        <input type="hidden" name="checkpointId" value={checkpointId} />
        {state.error ? (
          <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {state.success}
          </p>
        ) : null}
        <div>
          <label className="text-xs font-medium uppercase" htmlFor="privateNote">
            Nota clínica (privada)
          </label>
          <textarea
            id="privateNote"
            name="privateNote"
            rows={4}
            defaultValue={defaultPrivate}
            className="mt-2 w-full border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            className="text-xs font-medium uppercase"
            htmlFor="patientFeedback"
          >
            Feedback ao paciente
          </label>
          <textarea
            id="patientFeedback"
            name="patientFeedback"
            rows={4}
            defaultValue={defaultFeedback}
            className="mt-2 w-full border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase" htmlFor="densityScore">
            Densidade percebida (1–5)
          </label>
          <input
            id="densityScore"
            name="densityScore"
            type="number"
            min={1}
            max={5}
            defaultValue={defaultScore ?? 3}
            className="mt-2 w-24 border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            name="release"
            value="0"
            disabled={pending}
            className="border px-4 py-2 text-xs font-semibold uppercase disabled:opacity-50"
          >
            Salvar rascunho
          </button>
          <button
            type="submit"
            name="release"
            value="1"
            disabled={pending || released}
            className="bg-brand-gold px-4 py-2 text-xs font-semibold text-black uppercase disabled:opacity-50"
          >
            Liberar ao paciente
          </button>
          <Link href="/admin/analises" className="px-4 py-2 text-xs underline">
            Voltar
          </Link>
        </div>
        {released ? (
          <p className="text-xs text-brand-gray">
            Este feedback já foi liberado ao paciente.
          </p>
        ) : null}
      </form>
    </div>
  );
}
