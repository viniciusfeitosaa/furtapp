"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS, SITE, whatsappUrl } from "@/lib/site";

/** Rotas com fundo claro no topo: header sempre sólido para o texto branco continuar legível */
function useSolidHeader(pathname: string) {
  if (pathname === "/") return false;
  return true;
}

export function Header() {
  const pathname = usePathname();
  const solidByRoute = useSolidHeader(pathname);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = solidByRoute || scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "bg-black text-white" : "bg-transparent text-white"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 md:px-4">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2 sm:gap-3"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/simbolo-pincelada.png"
            alt=""
            width={40}
            height={40}
            className="h-8 w-8 shrink-0 rounded-sm sm:h-9 sm:w-9 md:h-10 md:w-10"
          />
          <span className="min-w-0">
            <span className="block truncate text-[0.8rem] font-semibold tracking-[0.1em] uppercase sm:text-sm sm:tracking-[0.18em] md:text-base">
              {SITE.name}
            </span>
            <span className="mt-0.5 block truncate text-[0.55rem] tracking-[0.1em] text-white/75 uppercase sm:text-[0.625rem] sm:tracking-[0.2em]">
              {SITE.tagline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 xl:gap-6 lg:flex" aria-label="Principal">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs tracking-wide text-white/80 transition-colors hover:text-brand-gold"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/paciente/login"
            className="text-xs tracking-wide text-white/60 transition-colors hover:text-white"
          >
            Área do paciente
          </Link>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-brand-gold px-4 py-2.5 text-xs font-semibold tracking-wide text-brand-charcoal transition-colors hover:bg-brand-gold-soft"
          >
            Agende sua avaliação
          </a>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center border border-white/30 lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <span className="block h-px w-5 bg-white" />
            <span className="block h-px w-5 bg-white" />
            <span className="block h-px w-5 bg-white" />
          </span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-black px-4 py-6 lg:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm tracking-wide text-white/85"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/paciente/login"
              className="text-sm text-white/60"
              onClick={() => setOpen(false)}
            >
              Área do paciente
            </Link>
            <Link
              href="/admin/login"
              className="text-sm text-white/40"
              onClick={() => setOpen(false)}
            >
              Área administrativa
            </Link>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center bg-brand-gold px-4 py-3 text-sm font-semibold text-black"
              onClick={() => setOpen(false)}
            >
              Agende sua avaliação
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
