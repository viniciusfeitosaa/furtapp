"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import type { HairTryOnEngine } from "@/lib/tryon/HairTryOnEngine";
import { createHairTryOnEngine } from "@/lib/tryon/createHairTryOnEngine";
import {
  DEFAULT_HAIR_GLB_STYLE_ID,
  getHairGlbStyle,
  hairGlbExists,
  HAIR_GLB_STYLES,
  type HairGlbStyleId,
} from "@/lib/tryon/hairAssets";
import {
  createGlbHairOverlayEngine,
  type GlbHairOverlayEngine,
} from "@/lib/tryon/engines/glbHairOverlay";
import { HAIR_LOOKS, type HairLookId } from "@/lib/tryon/hairTintPresets";
import { whatsappUrl } from "@/lib/site";

type Mode = "loading" | "glb" | "segment";

export function LiveTryOn() {
  const { videoRef, state, error, start, stop } = useCamera();
  const canvas2dRef = useRef<HTMLCanvasElement | null>(null);
  const canvas3dRef = useRef<HTMLCanvasElement | null>(null);
  const segmentEngineRef = useRef<HairTryOnEngine | null>(null);
  const glbEngineRef = useRef<GlbHairOverlayEngine | null>(null);
  const glbReadyRef = useRef(false);
  const rafRef = useRef(0);
  const styleRef = useRef<HairLookId>("natural");
  const intensityRef = useRef(0.8);
  const defaultFit = getHairGlbStyle(DEFAULT_HAIR_GLB_STYLE_ID).fit;
  const offsetYRef = useRef<number>(defaultFit.localY);
  const hairScaleRef = useRef<number>(defaultFit.matrixScale);
  const [intensity, setIntensity] = useState(80);
  const [offsetY, setOffsetY] = useState<number>(defaultFit.localY);
  const [hairScale, setHairScale] = useState<number>(defaultFit.matrixScale);
  const [hairStyleId, setHairStyleId] = useState<HairGlbStyleId>(
    DEFAULT_HAIR_GLB_STYLE_ID,
  );
  const [hairSwitching, setHairSwitching] = useState(false);
  const [styleId, setStyleId] = useState<HairLookId>("natural");
  const [mode, setMode] = useState<Mode>("loading");
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [statusHint, setStatusHint] = useState("Preparando…");
  const [hasTrack, setHasTrack] = useState(false);
  const hasTrackRef = useRef(false);

  const activeHair = getHairGlbStyle(hairStyleId);

  useEffect(() => {
    styleRef.current = styleId;
  }, [styleId]);
  useEffect(() => {
    intensityRef.current = intensity / 100;
  }, [intensity]);
  useEffect(() => {
    offsetYRef.current = offsetY;
  }, [offsetY]);
  useEffect(() => {
    hairScaleRef.current = hairScale;
  }, [hairScale]);

  // Boot: detectar GLB e pré-carregar motor
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatusHint("Verificando modelo 3D…");
      const hasGlb = await hairGlbExists();
      if (cancelled) return;

      if (hasGlb) {
        setMode("glb");
        setStatusHint("Carregando cabelo 3D + Face Landmarker…");
        const engine = createGlbHairOverlayEngine();
        glbEngineRef.current = engine;

        // Espera o canvas montar (mode=glb remove hidden)
        await new Promise<void>((resolve) => {
          const tick = () => {
            if (cancelled) return resolve();
            if (canvas3dRef.current) return resolve();
            requestAnimationFrame(tick);
          };
          tick();
        });
        if (cancelled) return;

        const canvas = canvas3dRef.current;
        if (!canvas) {
          setModelError("Canvas 3D indisponível.");
          return;
        }

        try {
          await engine.init(canvas, DEFAULT_HAIR_GLB_STYLE_ID);
          if (cancelled) return;
          glbReadyRef.current = true;
          setModelReady(true);
          setStatusHint("Pronto — ative a câmera");
        } catch (e) {
          console.error("[tryon] GLB init failed", e);
          if (cancelled) return;
          setStatusHint("GLB falhou — tentando MediaPipe…");
          glbEngineRef.current?.dispose();
          glbEngineRef.current = null;
          await bootSegment(cancelled);
        }
        return;
      }

      setStatusHint("GLB ausente — usando segmentação…");
      await bootSegment(cancelled);
    })();

    async function bootSegment(cancelledFlag: boolean) {
      setMode("segment");
      const engine = createHairTryOnEngine();
      segmentEngineRef.current = engine;
      try {
        await engine.init();
        if (cancelledFlag) return;
        setModelReady(true);
        setStatusHint("Pronto — ative a câmera (fallback)");
      } catch (e) {
        console.error("[tryon] MediaPipe init failed", e);
        if (!cancelledFlag) {
          setModelError(
            "Não foi possível carregar o try-on. Recarregue a página.",
          );
        }
      }
    }

    return () => {
      cancelled = true;
      glbEngineRef.current?.dispose();
      glbEngineRef.current = null;
      segmentEngineRef.current?.dispose();
      segmentEngineRef.current = null;
      glbReadyRef.current = false;
    };
  }, []);

  // Loop de render quando a câmera está live
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

    const loop = () => {
      if (cancelled) return;
      const eng3d = glbEngineRef.current;
      const eng2d = segmentEngineRef.current;
      const c2d = canvas2dRef.current;

      let tracked = false;
      if (mode === "glb" && eng3d && glbReadyRef.current) {
        tracked = eng3d.draw(video, {
          scale: hairScaleRef.current,
          offsetY: offsetYRef.current,
        });
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
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [state, videoRef, mode]);

  const usingGlb = mode === "glb";
  const active = HAIR_LOOKS.find((p) => p.id === styleId) ?? HAIR_LOOKS[0]!;

  async function switchHairStyle(nextId: HairGlbStyleId) {
    if (nextId === hairStyleId || hairSwitching) return;
    const engine = glbEngineRef.current;
    if (!engine) return;

    setHairSwitching(true);
    setStatusHint("Trocando corte…");
    glbReadyRef.current = false;
    try {
      await engine.setStyle(nextId);
      const fit = getHairGlbStyle(nextId).fit;
      setHairStyleId(nextId);
      setOffsetY(fit.localY);
      setHairScale(fit.matrixScale);
      offsetYRef.current = fit.localY;
      hairScaleRef.current = fit.matrixScale;
      glbReadyRef.current = true;
      setStatusHint(
        state === "live" ? "Corte atualizado" : "Pronto — ative a câmera",
      );
    } catch (e) {
      console.error("[tryon] troca de corte falhou", e);
      glbReadyRef.current = true;
      setStatusHint("Falha ao trocar o corte");
    } finally {
      setHairSwitching(false);
    }
  }

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
              usingGlb ? "pointer-events-none opacity-0" : ""
            }`}
            aria-hidden={usingGlb}
            aria-label="Segmentação de cabelo"
          />
          {/* Não usar display:none — WebGL precisa do canvas no layout */}
          <canvas
            ref={canvas3dRef}
            className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover ${
              usingGlb ? "" : "pointer-events-none opacity-0"
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
                  ? "Modelo 3D (Sketchfab CC BY) ancorado no rosto com MediaPipe."
                  : "Segmentação MediaPipe de tom/densidade (fallback)."}
              </p>
              <p className="text-[0.7rem] tracking-wide text-white/40 uppercase">
                {statusHint}
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
          Modelo: {activeHair.label}.{" "}
          {usingGlb && modelReady ? (
            <span className="text-brand-gold/90">
              {hairSwitching ? "Trocando corte…" : "Modo 3D ativo."}
            </span>
          ) : (
            <span>Modo: {mode}</span>
          )}
        </div>

        {usingGlb ? (
          <div>
            <p className="mb-3 text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase">
              Estilo de corte
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {HAIR_GLB_STYLES.map((s) => {
                const on = s.id === hairStyleId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={hairSwitching || !modelReady}
                    onClick={() => void switchHairStyle(s.id)}
                    className={`border px-4 py-3.5 text-left transition-colors disabled:cursor-wait disabled:opacity-50 ${
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
          </div>
        ) : null}

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
          <div className="space-y-6">
            {usingGlb ? (
              <div>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <label
                    htmlFor="tryon-offset-y"
                    className="text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase"
                  >
                    Posição na cabeça (↑↓)
                  </label>
                  <p className="font-mono text-sm tracking-wide text-brand-gold">
                    {offsetY.toFixed(1)}
                  </p>
                </div>
                <input
                  id="tryon-offset-y"
                  type="range"
                  min={-20}
                  max={15}
                  step={0.5}
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  className="plan-range h-2 w-full cursor-pointer appearance-none rounded-none bg-white/15"
                  style={{
                    background: `linear-gradient(to right, var(--color-brand-gold, #b6a46e) 0%, var(--color-brand-gold, #b6a46e) ${((offsetY + 20) / 35) * 100}%, rgba(255,255,255,0.15) ${((offsetY + 20) / 35) * 100}%, rgba(255,255,255,0.15) 100%)`,
                  }}
                />
                <p className="mt-2 text-[0.7rem] text-white/40">
                  Arraste para a esquerda para descer · valor atual em destaque
                </p>
              </div>
            ) : null}

            {usingGlb ? (
              <div>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <label
                    htmlFor="tryon-hair-scale"
                    className="text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase"
                  >
                    Tamanho do cabelo
                  </label>
                  <p className="font-mono text-sm tracking-wide text-brand-gold">
                    {hairScale.toFixed(1)}
                  </p>
                </div>
                <input
                  id="tryon-hair-scale"
                  type="range"
                  min={12}
                  max={55}
                  step={0.5}
                  value={hairScale}
                  onChange={(e) => setHairScale(Number(e.target.value))}
                  className="plan-range h-2 w-full cursor-pointer appearance-none rounded-none bg-white/15"
                  style={{
                    background: `linear-gradient(to right, var(--color-brand-gold, #b6a46e) 0%, var(--color-brand-gold, #b6a46e) ${((hairScale - 12) / 43) * 100}%, rgba(255,255,255,0.15) ${((hairScale - 12) / 43) * 100}%, rgba(255,255,255,0.15) 100%)`,
                  }}
                />
                <p className="mt-2 text-[0.7rem] text-white/40">
                  Maior = envolve mais o crânio (orelha a orelha)
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <label
                    htmlFor="tryon-intensity"
                    className="text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase"
                  >
                    Intensidade / tamanho
                  </label>
                  <p className="text-[0.65rem] tracking-wide text-white/40 uppercase">
                    {intensity}%
                  </p>
                </div>
                <input
                  id="tryon-intensity"
                  type="range"
                  min={30}
                  max={140}
                  step={1}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  disabled={state !== "live"}
                  className="plan-range h-2 w-full cursor-pointer appearance-none rounded-none bg-white/15 disabled:opacity-40"
                  style={{
                    background: `linear-gradient(to right, var(--color-brand-gold, #b6a46e) 0%, var(--color-brand-gold, #b6a46e) ${Math.min(100, intensity)}%, rgba(255,255,255,0.15) ${Math.min(100, intensity)}%, rgba(255,255,255,0.15) 100%)`,
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-white/55">
              {usingGlb
                ? "Ajuste tamanho e depois posição até o cabelo vestir a cabeça. Quando ficar bom, informe os dois valores — fixamos no código."
                : "Ajuste a intensidade do reforço. Luz frontal ajuda o tracking."}
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
