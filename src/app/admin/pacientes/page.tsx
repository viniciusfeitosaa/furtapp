import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Pacientes",
  robots: { index: false, follow: false },
};

export default async function AdminPacientesPage() {
  await requireAdmin();

  const patients = await prisma.patientProfile.findMany({
    include: {
      user: true,
      checkpoints: {
        orderBy: { code: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] tracking-[0.3em] text-brand-gold-dark uppercase">
            Admin
          </p>
          <h1 className="font-display mt-2 text-4xl">Pacientes</h1>
        </div>
        <Link
          href="/admin/pacientes/novo"
          className="bg-brand-gold px-5 py-2.5 text-xs font-semibold tracking-wide text-black uppercase"
        >
          Cadastrar paciente
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto border border-black/5 bg-white">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b text-xs tracking-wide text-brand-gray uppercase">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Cirurgia</th>
              <th className="px-4 py-3">Próximo passo</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => {
              const next = p.checkpoints.find(
                (c) => c.status !== "COMPLETED",
              );
              return (
                <tr key={p.id} className="border-b border-brand-gray-light/80">
                  <td className="px-4 py-3 font-medium">{p.user.name}</td>
                  <td className="px-4 py-3 text-brand-gray">{p.user.email}</td>
                  <td className="px-4 py-3">
                    {p.surgeryDate.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {next
                      ? `${next.code} — ${next.status}`
                      : "Protocolo concluído"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
