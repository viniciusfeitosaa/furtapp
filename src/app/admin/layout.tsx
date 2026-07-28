import { requireAdmin } from "@/lib/auth/guards";
import { PortalShell } from "@/components/portal/PortalShell";

const ADMIN_NAV = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/pacientes", label: "Pacientes" },
  { href: "/admin/analises", label: "Análises" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <PortalShell user={user} nav={ADMIN_NAV}>
      {children}
    </PortalShell>
  );
}
