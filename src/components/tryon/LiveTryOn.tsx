"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import type { HairTryOnEngine } from "@/lib/tryon/HairTryOnEngine";
import { createHairTryOnEngine } from "@/lib/tryon/createHairTryOnEngine";
import {
  HAIR_LOOKS,
  type HairLookId,
} from "@/lib/tryon/hairTintPresets";
import { whatsappUrl } from "@/lib/site";

export function LiveTryOn() {
  const { videoRef, state, error, start, stop } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<HairTryOnEngine | null>(null);
  const rafRef = useRef(0);
  const styleRef = useRef<HairLookId>("natural");
  const intensityRef = useRef(0.7);
  const [intensity, setIntensity] = useState(70);
  const [styleId, setStyleId] = useState<HairLookId>("natural");
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [hasHair, setHasHair] = useState(false);
  const hasHairRef = useRef(false);

  useEffect(() => {
    styleRef.current = styleId;
  }, [styleId]);
  useEffect(() => {
    intensityRef.current = intensity / 100;
  }, [intensity]);

  useEffect(() => {
    let cancelled = false;
    const engine = createHairTryOnEngine();
    engineRef.current = engine;
    (async () => {
      try {
        await engine.init();
        if (!cancelled) setModelReady(true);
      } catch {
        if (!cancelled) {
          setModelError(
            "Não foi possível carregar o modelo MediaPipe de cabelo. Recarregue a página.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (state !== "live") {
      cancelAnimationFrame(rafRef.current);
      hasHairRef.current = false;
      setHasHair(false);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const engine = engineRef.current;
      if (!engine || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const detected = engine.draw(video, ctx, {
        styleId: styleRef.current,
        intensity: intensityRef.current,
      });

      if (detected !== hasHairRef.current) {
        hasHairRef.current = detected;
        setHasHair(detected);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, videoRef]);

  const active = HAIR_LOOKS.find((p) => p.id === styleId) ?? HAIR_LOOKS[0]!;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="relative overflow-hidden border border-white/10 bg-[#080a12]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent"
          aria-hidden
        />

        <div className="relative aspect-[3/4] w-full bg-black sm:aspect-video">
          <video
            ref={videoRef}
            className="pointer-events-none absolute h-px w-px opacity-0"
            playsInline
            muted
            autoPlay
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full object-cover"
            aria-label="Segmentação de cabelo ao vivo"
          />

          {state !== "live" ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-[#060810]/px-6 text-center">
              <p className="font-display text-3xl text-white sm:text-4xl">
                Experimente ao vivo
              </p>
              <p className="font-serif-body max-w-md text-sm text-white/70 sm:text-base">
                MediaPipe (Google, open source) segmenta o cabelo no seu
                aparelho e aplica reforço de tom/densidade — sem chapéu 3D, sem
                conta paga. Nada é gravado ou enviado.
              </p>
              <button
                type="button"
                onClick={() => void start()}
                disabled={!modelReady || !!modelError}
                className="inline-flex min-h-12 items-center justify-center bg-brand-gold px-7 py-3.5 text-sm font-semibold tracking-wide text-brand-charcoal transition-colors hover:bg-brand-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                {!modelReady && !modelError
                  ? "Carregando modelo…"
                  : "Ativar câmera"}
              </button>
              {modelError ? (
                <p className="max-w-sm text-sm text-red-300">{modelError}</p>
              ) : null}
              {error ? (
                <p className="max-w-sm text-sm text-red-300">{error}</p>
              ) : null}
              {state === "unsupported" ? (
                <p className="max-w-sm text-sm text-white/55">
                  Use um celular ou computador com câmera e HTTPS.
                </p>
              ) : null}
            </div>
          ) : null}

          {state === "live" ? (
            <div className="absolute top-3 left-3 z-20 max-w-[90%] rounded-full bg-black/50 px-3 py-1.5 text-[0.65rem] tracking-wide text-white/80 uppercase backdrop-blur-sm">
              <span className="inline-flex items-center gap-2">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${hasHair ? "bg-brand-gold" : "bg-white/30"}`}
                />
                {hasHair
                  ? "Cabelo detectado"
                  : "Sem cabelo na máscara — centralize o rosto"}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <div>
          <p className="mb-3 text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase">
            Tom / reforço ilustrativo
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {HAIR_LOOKS.map((s) => {
              const on = s.id === styleId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyleId(s.id)}
                  className={`border px-3 py-3 text-left transition-colors ${
                    on
                      ? "border-brand-gold bg-brand-gold/15 text-white"
                      : "border-white/15 text-white/70 hover:border-white/35 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 shrink-0 rounded-full border border-white/20"
                      style={{
                        backgroundColor: `rgb(${s.rgb.join(",")})`,
                      }}
                      aria-hidden
                    />
                    <span className="text-sm font-semibold tracking-wide">
                      {s.label}
                    </span>
                  </span>
                  <span className="mt-1 block text-[0.7rem] leading-snug text-white/45">
                    {s.blurb}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-white/50">
            Selecionado: <span className="text-brand-gold">{active.label}</span>{" "}
            — {active.blurb}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <label
                htmlFor="tryon-intensity"
                className="text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase"
              >
                Intensidade do reforço
              </label>
              <p className="text-[0.65rem] tracking-wide text-white/40 uppercase">
                {intensity}%
              </p>
            </div>
            <input
              id="tryon-intensity"
              type="range"
              min={15}
              max={100}
              step={1}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              disabled={state !== "live"}
              className="plan-range h-2 w-full cursor-pointer appearance-none rounded-none bg-white/15 disabled:opacity-40"
              style={{
                background: `linear-gradient(to right, var(--color-brand-gold, #b6a46e) 0%, var(--color-brand-gold, #b6a46e) ${intensity}%, rgba(255,255,255,0.15) ${intensity}%, rgba(255,255,255,0.15) 100%)`,
              }}
            />
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-white/55">
              Stack 100% gratuita: MediaPipe Hair Segmenter. Reforça o cabelo
              existente — não troca o corte por uma peruca 3D. Não é prognóstico
              cirúrgico.
            </p>
            {!hasHair && state === "live" ? (
              <p className="text-sm text-brand-gold/90">
                Se a área estiver raspada ou a luz for fraca, a máscara pode
                falhar.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {state === "live" ? (
                <button
                  type="button"
                  onClick={stop}
                  className="inline-flex min-h-11 items-center justify-center border border-white/25 px-5 py-2.5 text-xs font-semibold tracking-wide text-white/80 uppercase transition-colors hover:border-white/50"
                >
                  Encerrar câmera
                </button>
              ) : null}
              <a
                href={whatsappUrl(
                  "Olá! Testei a segmentação de cabelo ao vivo no site e gostaria de agendar minha avaliação.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center bg-brand-gold px-5 py-2.5 text-xs font-semibold tracking-wide text-brand-charcoal uppercase transition-colors hover:bg-brand-gold-soft"
              >
                Agendar avaliação
              </a>
              <Link
                href="/#foliculo"
                className="inline-flex min-h-11 items-center justify-center border border-brand-gold/50 px-5 py-2.5 text-xs font-semibold tracking-wide text-brand-gold uppercase transition-colors hover:bg-brand-gold hover:text-brand-charcoal"
              >
                Ver mapa de planejamento
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
