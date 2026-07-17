"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  TESTIMONIALS,
  instagramProfileUrl,
} from "@/lib/testimonials";

function CommentCard({
  handle,
  quote,
}: {
  handle: string;
  quote: string;
}) {
  return (
    <blockquote className="w-[min(85vw,20rem)] shrink-0 rounded-2xl bg-white px-4 py-3.5 text-brand-charcoal shadow-[0_1px_2px_rgba(0,0,0,0.06)] sm:w-80">
      <footer className="flex items-center gap-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1.5px]"
          aria-hidden
        >
          <span className="flex size-full items-center justify-center rounded-full bg-white text-[0.65rem] font-semibold text-brand-charcoal">
            {handle.slice(0, 1).toUpperCase()}
          </span>
        </span>
        <a
          href={instagramProfileUrl(handle)}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-sm font-semibold text-black transition-opacity hover:opacity-70"
        >
          {handle}
        </a>
      </footer>
      <p className="mt-2.5 text-sm leading-relaxed text-brand-charcoal">
        {quote}
      </p>
    </blockquote>
  );
}

/** Carrossel infinito que desliza sozinho; pausa no hover/foco e com reduced-motion. */
export function TestimonialsSlider() {
  const reduced = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    let last = performance.now();
    const speed = 32; // px/s

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!paused) {
        offsetRef.current += speed * dt;
        const half = track.scrollWidth / 2;
        if (half > 0 && offsetRef.current >= half) {
          offsetRef.current -= half;
        }
        track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, reduced]);

  const items = [...TESTIMONIALS, ...TESTIMONIALS];

  if (reduced) {
    return (
      <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {TESTIMONIALS.map((item) => (
          <li key={item.handle}>
            <CommentCard handle={item.handle} quote={item.quote} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className="relative mt-12 -mx-4 overflow-hidden md:-mx-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[rgba(26,32,53,0.95)] to-transparent sm:w-16"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[rgba(26,32,53,0.95)] to-transparent sm:w-16"
        aria-hidden
      />

      <div
        ref={trackRef}
        className="flex w-max gap-3 px-4 will-change-transform sm:gap-4 md:px-6"
        role="list"
        aria-label="Depoimentos em carrossel"
      >
        {items.map((item, i) => (
          <div key={`${item.handle}-${i}`} role="listitem">
            <CommentCard handle={item.handle} quote={item.quote} />
          </div>
        ))}
      </div>
    </div>
  );
}
