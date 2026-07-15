"use client";

import { useEffect, useState, type RefObject } from "react";
import { getPrefersReducedMotion, scrollProgressThrough } from "@/lib/motion";

/** Retorna 0–1 enquanto o elemento atravessa o viewport (rAF só quando visível). */
export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (getPrefersReducedMotion()) {
      setProgress(0);
      return;
    }

    let active = false;
    let raf = 0;

    const read = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      setProgress(scrollProgressThrough(rect.top, rect.height, viewH));
    };

    const tick = () => {
      read();
      if (active) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (active) return;
      active = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      read();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start();
        else stop();
      },
      { threshold: [0, 0.01] },
    );
    io.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) start();
    else read();

    return () => {
      stop();
      io.disconnect();
    };
  }, [ref]);

  return progress;
}
