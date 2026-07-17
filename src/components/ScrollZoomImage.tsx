"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Escala máxima no fim do scroll (1.12 = +12%). */
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
 * Zoom suave amarrado ao scroll: a escala acompanha a posição
 * da seção no viewport (sobe e desce junto com a rolagem).
 */
export function ScrollZoomImage({
  src,
  alt,
  width,
  height,
  className = "",
  maxScale = 1.12,
  sectionSelector = "#pilares",
  loading = "lazy",
  decoding = "async",
  "aria-hidden": ariaHidden,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const section =
      (img.closest(sectionSelector) as HTMLElement | null) ??
      (document.querySelector(sectionSelector) as HTMLElement | null);
    if (!section) return;

    let active = false;
    let raf = 0;

    const apply = () => {
      if (reduce.matches) {
        img.style.transform = "scale(1)";
        return;
      }
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      // Progresso linear do scroll: 0 ao entrar, 1 ao sair
      const total = viewH + rect.height;
      const progressed = viewH - rect.top;
      const p = clamp(progressed / total, 0, 1);
      img.style.transform = `scale(${1 + p * (maxScale - 1)})`;
    };

    const tick = () => {
      apply();
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
      apply();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start();
        else stop();
      },
      { root: null, threshold: [0, 0.01] },
    );
    io.observe(section);

    const rect = section.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) start();
    else apply();

    reduce.addEventListener("change", apply);

    return () => {
      stop();
      io.disconnect();
      reduce.removeEventListener("change", apply);
    };
  }, [maxScale, sectionSelector]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      aria-hidden={ariaHidden}
      className={`origin-center will-change-transform ${className}`}
      style={{ transform: "scale(1)" }}
    />
  );
}
