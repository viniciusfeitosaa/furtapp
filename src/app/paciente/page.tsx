import type { Metadata } from "next";
import Link from "next/link";
import { CHECKPOINTS, PHOTO_REGIONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Meu acompanhamento",
  robots: { index: false, follow: false },
};

export default function PacienteDashboardPage() {
  return (
    <div className="bg-white pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] tracking-[0.3em] text-brand-gold-dark uppercase">
              Painel do paciente
            </p>
            <h1 className="font-display mt-2 text-4xl md:text-5xl">
              Acompanhamento 12 meses
            </h1>
          </div>
          <Link href="/paciente/login" className="text-sm text-brand-gray underline">
            Sair
          </Link>
        </div>

        <p className="font-serif-body mt-6 max-w-2xl text-lg text-brand-charcoal">
          Próximo checkpoint (protótipo): <strong>M3</strong> — envie as 5
          regiões enquanto a janela estiver aberta. O Dr. analisa e libera o
          feedback por aqui.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-5">
          {CHECKPOINTS.map((cp, i) => (
            <div
              key={cp}
              className={`border px-3 py-4 text-center ${
                i === 1
                  ? "border-brand-gold bg-brand-gold/15"
                  : "border-brand-gray-light"
              }`}
            >
              <span className="text-xs tracking-widest text-brand-gray uppercase">
                {i === 0 ? "Baseline" : `+${i * 3} meses`}
              </span>
              <span className="mt-1 block text-xl font-semibold">{cp}</span>
              <span className="mt-2 block text-[0.65rem] text-brand-gray">
                {i === 0 ? "Concluído" : i === 1 ? "Em janela" : "Aguardando"}
              </span>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-sm tracking-[0.2em] uppercase">
          Upload — 5 regiões (M3)
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {PHOTO_REGIONS.map((region) => (
            <label
              key={region.id}
              className="flex cursor-pointer flex-col gap-2 border border-dashed border-brand-gray-mid p-5 transition-colors hover:border-brand-gold"
            >
              <span className="text-sm font-medium">{region.label}</span>
              <span className="text-xs text-brand-gray">
                Guia visual (overlay) na Fase 2 · toque para selecionar foto
              </span>
              <input type="file" accept="image/*" className="text-xs" disabled />
            </label>
          ))}
        </div>
        <p className="mt-6 text-xs text-brand-gray">
          Upload real, storage privado e LGPD entram na Fase 2 — ver MAPA DE
          BORDO §3.
        </p>
      </div>
    </div>
  );
}
