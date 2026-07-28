import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin — visão geral",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Aguardando",
  OPEN: "Em janela",
  SUBMITTED: "Enviado",
  IN_REVIEW: "Em análise",
  COMPLETED: "Concluído",
  LATE: "Atrasado",
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [submitted, late, openSoon, queue] = await Promise.all([
    prisma.checkpoint.count({ where: { status: "SUBMITTED" } }),
    prisma.checkpoint.count({ where: { status: "LATE" } }),
    prisma.checkpoint.count({
      where: {
        status: "OPEN",
        windowEnd: { lte: new Date(Date.now() + 7 * 86400000) },
      },
    }),
    prisma.checkpoint.findMany({
      where: { status: { in: ["SUBMITTED", "IN_REVIEW", "LATE"] } },
      include: {
        patient: { include: { user: true } },
        photos: true,
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    }),
  ]);

  const patientCount = await prisma.patientProfile.count();

  return (
    <div>
      <p className="text-[0.7rem] tracking-[0.3em] text-brand-gold-dark uppercase">
        Admin
      </p>
      <h1 className="font-display mt-2 text-4xl md:text-5xl">Visão geral</h1>

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {[
          { label: "Aguardando análise", value: String(submitted) },
          { label: "Atrasados", value: String(late) },
          { label: "Janelas (7 dias)", value: String(openSoon) },
          { label: "Pacientes ativos", value: String(patientCount) },
        ].map((card) => (
          <div key={card.label} className="border border-black/5 bg-white p-5">
            <p className="text-xs tracking-wide text-brand-gray uppercase">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-sm tracking-[0.2em] uppercase">Fila prioritária</h2>
        <Link
          href="/admin/pacientes/novo"
          className="bg-black px-4 py-2 text-xs font-semibold tracking-wide text-white uppercase"
        >
          Novo paciente
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto border border-black/5 bg-white">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-brand-gray-light text-xs tracking-wide text-brand-gray uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">Checkpoint</th>
              <th className="px-4 py-3 font-medium">Fotos</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-gray">
                  Nenhum envio na fila.
                </td>
              </tr>
            ) : (
              queue.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-brand-gray-light/80"
                >
                  <td className="px-4 py-3">{row.patient.user.name}</td>
                  <td className="px-4 py-3">{row.code}</td>
                  <td className="px-4 py-3">{row.photos.length}/5</td>
                  <td className="px-4 py-3">
                    {STATUS_LABEL[row.status] ?? row.status}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/analise/${row.id}`}
                      className="text-brand-gold-dark underline-offset-2 hover:underline"
                    >
                      Abrir análise
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
