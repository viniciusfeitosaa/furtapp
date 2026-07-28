import type { Metadata } from "next";
import { requirePatient } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Meu perfil",
  robots: { index: false, follow: false },
};

export default async function PacientePerfilPage() {
  const session = await requirePatient();
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.userId },
    include: { user: true },
  });

  if (!profile) return null;

  return (
    <div>
      <h1 className="font-display text-4xl">Meu perfil</h1>
      <dl className="mt-8 max-w-md space-y-4 border bg-white p-6 text-sm">
        <div>
          <dt className="text-xs font-medium text-brand-gray uppercase">Nome</dt>
          <dd className="mt-1">{profile.user.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-brand-gray uppercase">E-mail</dt>
          <dd className="mt-1">{profile.user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-brand-gray uppercase">
            Telefone
          </dt>
          <dd className="mt-1">{profile.phone ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-brand-gray uppercase">
            Data da cirurgia (M0)
          </dt>
          <dd className="mt-1">
            {profile.surgeryDate.toLocaleDateString("pt-BR")}
          </dd>
        </div>
      </dl>
      <p className="mt-6 text-xs text-brand-gray">
        Alteração de senha e consentimento LGPD entram na próxima fase.
      </p>
    </div>
  );
}
