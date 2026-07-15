"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SITE, whatsappUrl } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function HeroCopy() {
  const reduced = usePrefersReducedMotion();
  const [on, setOn] = useState(false);
  const show = reduced || on;

  useEffect(() => {
    if (reduced) return;
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  const item = (delay: number, className: string, children: ReactNode) => (
    <div
      className={`ff-reveal ${show ? "is-inview" : ""} ${className}`}
      style={{ ["--ff-reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </div>
  );

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-28 pb-8 sm:px-5 md:px-6 md:pb-28">
      {item(0, "mb-5 md:mb-8", (
        <div className="h-px w-12 bg-brand-gold md:w-16" aria-hidden />
      ))}
      {item(80, "", (
        <p className="mb-3 text-[0.65rem] tracking-[0.28em] text-brand-gold uppercase sm:mb-5 sm:text-[0.7rem] sm:tracking-[0.35em]">
          {SITE.tagline}
        </p>
      ))}
      {item(160, "", (
        <h1 className="font-display max-w-[14ch] text-[2.75rem] leading-[0.95] text-white sm:max-w-xl sm:text-6xl md:max-w-2xl md:text-7xl lg:text-8xl">
          Francisco Furtado
        </h1>
      ))}
      {item(240, "", (
        <p className="font-serif-body mt-5 max-w-md text-base leading-relaxed text-white/80 sm:mt-8 sm:text-lg md:max-w-lg md:text-xl">
          Transplante capilar seguro, ético e natural — devolver autoestima com
          ciência, arte e cuidado humano em Fortaleza e em todo o Ceará.
        </p>
      ))}
      {item(320, "mt-8 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:items-center", (
        <>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center bg-brand-gold px-8 py-3.5 text-sm font-semibold tracking-wide text-brand-charcoal transition-colors hover:bg-brand-gold-soft"
          >
            Agende sua avaliação
          </a>
          <a
            href="#sobre"
            className="inline-flex min-h-12 items-center justify-center border border-white/30 px-8 py-3.5 text-sm tracking-wide text-white transition-colors hover:border-white hover:bg-white hover:text-black"
          >
            Conhecer o Dr. Francisco
          </a>
        </>
      ))}
    </div>
  );
}
