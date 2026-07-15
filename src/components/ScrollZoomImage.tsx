"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Escala máxima (1.45 = +45%). */
  maxScale?: number;
  /** Seletor do container que define o progresso do scroll. */
  sectionSelector?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
  "aria-hidden"?: boolean | "true" | "false";
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Zoom evidenciado na imagem enquanto a seção atravessa o viewport.
 * Usa rAF enquanto a seção está visível (funciona mesmo se o scroll
 * for de um container ancestral, não só da window).
 */
export function ScrollZoomImage({
  src,
  alt,
  width,
  height,
  className = "",
  maxScale = 1.45,
  sectionSelector = "#pilares",
  loading = "lazy",
  decoding = "async",
  "aria-hidden": ariaHidden,
}: Props) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const section = document.querySelector(sectionSelector) as HTMLElement | null;
    if (!section) return;

    let active = false;
    let raf = 0;
    let lastScale = 1;

    const readScale = () => {
      if (reduce.matches) return 1;
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      // Zoom bem perceptível enquanto a seção ainda está em tela
      const start = viewH * 0.95;
      const end = viewH * 0.15;
      const raw = (start - rect.top) / (start - end);
      const p = clamp(raw, 0, 1);
      const eased = 1 - (1 - p) * (1 - p);
      return 1 + eased * (maxScale - 1);
    };

    const tick = () => {
      const next = readScale();
      if (Math.abs(next - lastScale) > 0.001) {
        lastScale = next;
        setScale(next);
      }
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
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start();
        else stop();
      },
      { threshold: [0, 0.05, 0.1] },
    );
    io.observe(section);

    // Kick inicial (ex.: já na viewport após refresh)
    const first = section.getBoundingClientRect();
    if (first.bottom > 0 && first.top < window.innerHeight) start();

    const onReduce = () => {
      lastScale = 1;
      setScale(1);
    };
    reduce.addEventListener("change", onReduce);

    return () => {
      stop();
      io.disconnect();
      reduce.removeEventListener("change", onReduce);
    };
  }, [maxScale, sectionSelector]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      aria-hidden={ariaHidden}
      className={`origin-center will-change-transform ${className}`}
      style={{ transform: `scale(${scale})` }}
    />
  );
}
