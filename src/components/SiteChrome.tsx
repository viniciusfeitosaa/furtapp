"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

const PORTAL_PREFIXES = ["/login", "/admin", "/paciente"];

function isPortalRoute(pathname: string): boolean {
  return PORTAL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const portal = isPortalRoute(pathname);

  if (portal) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
