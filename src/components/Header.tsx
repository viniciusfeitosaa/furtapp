"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS, SITE, whatsappUrl } from "@/lib/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black/95 text-white shadow-sm transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-2 py-3 sm:gap-3 sm:px-3 md:px-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 sm:gap-3"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/brand/simbolo-pincelada.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 rounded-sm md:h-10 md:w-10"
            priority
          />
          <span className="whitespace-nowrap">
            <span className="block text-sm font-semibold tracking-[0.12em] uppercase sm:tracking-[0.18em] md:text-base">
              {SITE.name}
            </span>
            <span className="mt-0.5 block text-[0.55rem] tracking-[0.12em] text-white/75 uppercase sm:text-[0.625rem] sm:tracking-[0.2em]">
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
            className="inline-flex items-center bg-brand-gold px-4 py-2.5 text-xs font-semibold tracking-wide text-black transition-opacity hover:opacity-90"
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
