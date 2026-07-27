"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import type { HairTryOnEngine } from "@/lib/tryon/HairTryOnEngine";
import { createHairTryOnEngine } from "@/lib/tryon/createHairTryOnEngine";
import {
  HAIR_GLB_ASSET,
  hairGlbExists,
} from "@/lib/tryon/hairAssets";
import {
  createGlbHairOverlayEngine,
  type GlbHairOverlayEngine,
} from "@/lib/tryon/engines/glbHairOverlay";
import {
  HAIR_LOOKS,
  type HairLookId,
} from "@/lib/tryon/hairTintPresets";
import { whatsappUrl } from "@/lib/site";

type Mode = "loading" | "glb" | "segment" | "waiting-glb";

export function LiveTryOn() {
  const { videoRef, state, error, start, stop } = useCamera();
  const canvas2dRef = useRef<HTMLCanvasElement | null>(null);
  const canvas3dRef = useRef<HTMLCanvasElement | null>(null);
  const segmentEngineRef = useRef<HairTryOnEngine | null>(null);
  const glbEngineRef = useRef<GlbHairOverlayEngine | null>(null);
  const rafRef = useRef(0);
  const styleRef = useRef<HairLookId>("natural");
  const intensityRef = useRef(0.75);
  const [intensity, setIntensity] = useState(75);
  const [styleId, setStyleId] = useState<HairLookId>("natural");
  const [mode, setMode] = useState<Mode>("loading");
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [hasTrack, setHasTrack] = useState(false);
  const hasTrackRef = useRef(false);

  useEffect(() => {
    styleRef.current = styleId;
  }, [styleId]);
  useEffect(() => {
    intensityRef.current = intensity / 100;
  }, [intensity]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hasGlb = await hairGlbExists();
      if (cancelled) return;

      if (hasGlb) {
        const engine = createGlbHairOverlayEngine();
        glbEngineRef.current = engine;
        try {
          // canvas pode ainda não existir; init lazy no start
          setMode("glb");
          setModelReady(true);
        } catch (e) {
          setModelError(
            e instanceof Error ? e.message : "Falha ao preparar o modelo 3D.",
          );
          setMode("segment");
        }
        return;
      }

      // Sem GLB ainda: MediaPipe como fallback + aviso
      setMode("waiting-glb");
      const engine = createHairTryOnEngine();
      segmentEngineRef.current = engine;
      try {
        await engine.init();
        if (!cancelled) {
          setModelReady(true);
          setMode("segment");
        }
      } catch {
        if (!cancelled) {
          setModelError(
            "Não foi possível carregar MediaPipe. Coloque o GLB em public/models/hair/short-layered.glb",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      glbEngineRef.current?.dispose();
      glbEngineRef.current = null;
      segmentEngineRef.current?.dispose();
      segmentEngineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (state !== "live") {
      cancelAnimationFrame(rafRef.current);
      hasTrackRef.current = false;
      setHasTrack(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const boot = async () => {
      if (mode === "glb" || (mode === "loading" && glbEngineRef.current)) {
        const canvas = canvas3dRef.current;
        const engine = glbEngineRef.current;
        if (!canvas || !engine) return;
        try {
          await engine.init(canvas);
        } catch (e) {
          if (!cancelled) {
            setModelError(
              e instanceof Error
                ? e.message
                : "Não foi possível carregar o GLB de cabelo.",
            );
            // Fallback MediaPipe
            const seg = createHairTryOnEngine();
            segmentEngineRef.current = seg;
            try {
              await seg.init();
              setMode("segment");
              setModelError(
                "GLB falhou ao carregar — usando segmentação MediaPipe. Verifique public/models/hair/short-layered.glb",
              );
            } catch {
              /* keep error */
            }
          }
          return;
        }
      }

      const loop = () => {
        if (cancelled) return;
        const eng3d = glbEngineRef.current;
        const eng2d = segmentEngineRef.current;
        const c2d = canvas2dRef.current;

        let tracked = false;
        if (eng3d && canvas3dRef.current) {
          tracked = eng3d.draw(video, { intensity: intensityRef.current });
        } else if (eng2d && c2d) {
          const ctx = c2d.getContext("2d");
          if (ctx) {
            tracked = eng2d.draw(video, ctx, {
              styleId: styleRef.current,
              intensity: intensityRef.current,
            });
          }
        }

        if (tracked !== hasTrackRef.current) {
          hasTrackRef.current = tracked;
          setHasTrack(tracked);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    };

    void boot();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [state, videoRef, mode]);

  const usingGlb = mode === "glb";
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
            className={
              usingGlb
                ? "absolute inset-0 h-full w-full scale-x-[-1] object-cover"
                : "pointer-events-none absolute h-px w-px opacity-0"
            }
            playsInline
            muted
            autoPlay
          />
          <canvas
            ref={canvas2dRef}
            className={`absolute inset-0 h-full w-full object-cover ${
              usingGlb ? "hidden" : ""
            }`}
            aria-label="Segmentação de cabelo"
          />
          <canvas
            ref={canvas3dRef}
            className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover ${
              usingGlb ? "" : "hidden"
            }`}
            aria-label="Cabelo 3D ao vivo"
          />

          {state !== "live" ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-[#060810]/px-6 text-center">
              <p className="font-display text-3xl text-white sm:text-4xl">
                Experimente ao vivo
              </p>
              <p className="font-serif-body max-w-md text-sm text-white/70 sm:text-base">
                {usingGlb
                  ? "Modelo 3D gratuito (Sketchfab CC BY) ancorado no rosto com MediaPipe Face Landmarker."
                  : "Enquanto o GLB não estiver em public/models/hair/, usamos segmentação MediaPipe (tom/densidade)."}
              </p>
              <button
                type="button"
                onClick={() => void start()}
                disabled={!modelReady || !!modelError}
                className="inline-flex min-h-12 items-center justify-center bg-brand-gold px-7 py-3.5 text-sm font-semibold tracking-wide text-brand-charcoal transition-colors hover:bg-brand-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                {!modelReady && !modelError
                  ? "Carregando…"
                  : "Ativar câmera"}
              </button>
              {modelError ? (
                <p className="max-w-sm text-sm text-red-300">{modelError}</p>
              ) : null}
              {error ? (
                <p className="max-w-sm text-sm text-red-300">{error}</p>
              ) : null}
            </div>
          ) : null}

          {state === "live" ? (
            <div className="absolute top-3 left-3 z-20 max-w-[90%] rounded-full bg-black/50 px-3 py-1.5 text-[0.65rem] tracking-wide text-white/80 uppercase backdrop-blur-sm">
              <span className="inline-flex items-center gap-2">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${hasTrack ? "bg-brand-gold" : "bg-white/30"}`}
                />
                {usingGlb
                  ? hasTrack
                    ? "Rosto + cabelo 3D"
                    : "Centralize o rosto"
                  : hasTrack
                    ? "Cabelo detectado"
                    : "Sem máscara de cabelo"}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <div className="rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
          Modelo:{" "}
          <a
            href={HAIR_GLB_ASSET.sketchfabUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-gold underline-offset-2 hover:underline"
          >
            {HAIR_GLB_ASSET.label}
          </a>{" "}
          por {HAIR_GLB_ASSET.author} ({HAIR_GLB_ASSET.license}). Créditos:{" "}
          {HAIR_GLB_ASSET.originalCredit}.{" "}
          {!usingGlb ? (
            <span className="text-brand-gold/90">
              Falta o arquivo{" "}
              <code className="text-white/80">
                public/models/hair/short-layered.glb
              </code>{" "}
              — baixe no Sketchfab e coloque nessa pasta.
            </span>
          ) : (
            <span>GLB carregado.</span>
          )}
        </div>

        {!usingGlb ? (
          <div>
            <p className="mb-3 text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase">
              Fallback — tom / reforço
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
                    <span className="text-sm font-semibold tracking-wide">
                      {s.label}
                    </span>
                    <span className="mt-1 block text-[0.7rem] text-white/45">
                      {s.blurb}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-white/50">
              Selecionado:{" "}
              <span className="text-brand-gold">{active.label}</span>
            </p>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <label
                htmlFor="tryon-intensity"
                className="text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase"
              >
                Intensidade
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
              Pausamos a “criação” procedural de cabelo. O caminho agora é o
              modelo 3D CC BY do Sketchfab + tracking facial gratuito (MediaPipe).
            </p>
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
                  "Olá! Testei o try-on 3D de cabelo no site e gostaria de agendar minha avaliação.",
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
