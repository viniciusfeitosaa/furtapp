"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { FollicleFallback } from "@/components/follicle/FollicleFallback";
import { FollicleErrorBoundary } from "@/components/follicle/FollicleErrorBoundary";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const FollicleCanvas = dynamic(
  () =>
    import("@/components/follicle/FollicleCanvas").then((m) => m.FollicleCanvas),
  {
    ssr: false,
    loading: () => <FollicleFallback />,
  },
);

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export function FollicleSection() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [webgl] = useState(() =>
    typeof window === "undefined" ? true : canUseWebGL(),
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const show3d = inView && webgl && !reduced;

  return (
    <section
      ref={ref}
      id="foliculo"
      className="scroll-mt-24 bg-[#060810] px-4 py-20 text-white md:px-6 md:py-28"
      aria-labelledby="foliculo-title"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-[0.7rem] tracking-[0.3em] text-brand-gold uppercase">
          Ciência
        </p>
        <h2
          id="foliculo-title"
          className="font-display max-w-xl text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl"
        >
          Do folículo ao resultado
        </h2>
        <p className="font-serif-body mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          Cada unidade folicular é planejada com critério técnico — densidade,
          direção e naturalidade da linha anterior.
        </p>

        <div className="mt-10 overflow-hidden border border-white/10">
          {show3d ? (
            <FollicleErrorBoundary>
              <FollicleCanvas autoRotate />
            </FollicleErrorBoundary>
          ) : (
            <FollicleFallback />
          )}
        </div>
        <p className="mt-4 text-center text-xs tracking-wide text-white/45">
          {show3d
            ? "Arraste para girar o modelo"
            : "Representação estilizada do folículo"}
        </p>
      </div>
    </section>
  );
}
