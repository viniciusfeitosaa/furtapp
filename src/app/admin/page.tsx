import type { Metadata } from "next";
import Link from "next/link";
import { CHECKPOINTS, PHOTO_REGIONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Admin — pacientes",
  robots: { index: false, follow: false },
};

const FILA_DEMO = [
  { nome: "Paciente A", checkpoint: "M3", status: "ENVIADO" },
  { nome: "Paciente B", checkpoint: "M6", status: "ATRASADO" },
  { nome: "Paciente C", checkpoint: "M3", status: "EM_ANALISE" },
];

export default function AdminDashboardPage() {
  return (
    <div className="bg-brand-gray-light/40 pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] tracking-[0.3em] text-brand-gold-dark uppercase">
              Admin
            </p>
            <h1 className="font-display mt-2 text-4xl md:text-5xl">
              Fila de análise
            </h1>
          </div>
          <Link href="/admin/login" className="text-sm text-brand-gray underline">
            Sair
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { label: "Aguardando análise", value: "1" },
            { label: "Atrasados", value: "1" },
            { label: "Janelas nos próximos 7 dias", value: "—" },
          ].map((card) => (
            <div key={card.label} className="border border-black/5 bg-white p-5">
              <p className="text-xs tracking-wide text-brand-gray uppercase">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold">{card.value}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-sm tracking-[0.2em] uppercase">Pacientes</h2>
        <div className="mt-4 overflow-x-auto border border-black/5 bg-white">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-brand-gray-light text-xs tracking-wide text-brand-gray uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Paciente</th>
                <th className="px-4 py-3 font-medium">Checkpoint</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {FILA_DEMO.map((row) => (
                <tr key={row.nome} className="border-b border-brand-gray-light/80">
                  <td className="px-4 py-3">{row.nome}</td>
                  <td className="px-4 py-3">{row.checkpoint}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <span className="text-brand-gold-dark">Abrir sala de análise</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-14 border border-black/5 bg-white p-6">
          <h2 className="text-sm tracking-[0.2em] uppercase">
            Sala de análise (wireframe)
          </h2>
          <p className="mt-3 text-sm text-brand-charcoal">
            Comparar a mesma região em {CHECKPOINTS.join(" · ")}. Nota privada
            vs feedback ao paciente. Escalas 1–5. Detalhe no MAPA DE BORDO §3.7.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {PHOTO_REGIONS.map((r) => (
              <div
                key={r.id}
                className="flex aspect-square items-center justify-center bg-brand-gray-light text-center text-[0.65rem] text-brand-gray"
              >
                {r.label}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
