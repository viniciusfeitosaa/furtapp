import Link from "next/link";
import type { SessionUser } from "@/lib/auth/types";
import { LogoutButton } from "@/components/portal/LogoutButton";

type NavItem = { href: string; label: string };

type Props = {
  user: SessionUser;
  title?: string;
  subtitle?: string;
  nav: NavItem[];
  children: React.ReactNode;
};

export function PortalShell({
  user,
  title,
  subtitle,
  nav,
  children,
}: Props) {
  return (
    <div className="flex min-h-screen bg-brand-gray-light/40">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-black/5 bg-black text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="text-[0.65rem] tracking-[0.25em] text-brand-gold uppercase">
            Portal
          </p>
          <p className="mt-2 text-sm font-medium">{user.name}</p>
          <p className="text-xs text-white/50">{user.email}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Portal">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="block px-3 py-2 text-xs text-white/50 hover:text-white"
          >
            Site institucional
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-black/5 bg-white px-4 py-4 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {title ? (
              <div>
                {subtitle ? (
                  <p className="text-[0.7rem] tracking-[0.3em] text-brand-gold-dark uppercase">
                    {subtitle}
                  </p>
                ) : null}
                <h1 className="font-display mt-1 text-3xl md:text-4xl">{title}</h1>
              </div>
            ) : (
              <p className="text-sm font-medium text-brand-charcoal lg:hidden">
                {user.name}
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-brand-gray lg:inline">{user.name}</span>
              <LogoutButton />
            </div>
          </div>
          <nav
            className="mt-4 flex gap-2 overflow-x-auto lg:hidden"
            aria-label="Portal mobile"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 border border-black/10 px-3 py-1.5 text-xs"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="flex-1 px-4 py-8 md:px-8">{children}</div>
      </div>
    </div>
  );
}
