import { requirePatient } from "@/lib/auth/guards";
import { PortalShell } from "@/components/portal/PortalShell";

const PATIENT_NAV = [
  { href: "/paciente", label: "Acompanhamento" },
  { href: "/paciente/historico", label: "Histórico" },
  { href: "/paciente/perfil", label: "Meu perfil" },
];

export default async function PacienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePatient();

  return (
    <PortalShell user={user} nav={PATIENT_NAV}>
      {children}
    </PortalShell>
  );
}
