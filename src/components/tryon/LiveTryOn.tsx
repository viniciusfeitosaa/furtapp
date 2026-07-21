"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { drawWig } from "@/lib/tryon/drawWig";
import { WIG_STYLES, type WigStyleId } from "@/lib/tryon/wigStyles";
import { whatsappUrl } from "@/lib/site";

const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type FaceLandmarkerType = import("@mediapipe/tasks-vision").FaceLandmarker;

export function LiveTryOn() {
  const { videoRef, state, error, start, stop } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarkerType | null>(null);
  const rafRef = useRef(0);
  const lastTsRef = useRef(-1);
  const styleRef = useRef<WigStyleId>("classico");
  const opacityRef = useRef(0.85);
  const [opacity, setOpacity] = useState(85);
  const [styleId, setStyleId] = useState<WigStyleId>("classico");
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const trackingRef = useRef(false);

  useEffect(() => {
    styleRef.current = styleId;
  }, [styleId]);
  useEffect(() => {
    opacityRef.current = opacity / 100;
  }, [opacity]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const visionMod = await import("@mediapipe/tasks-vision");
        const vision = await visionMod.FilesetResolver.forVisionTasks(WASM_ROOT);
        const landmarker = await visionMod.FaceLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
          },
        );
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setModelReady(true);
      } catch {
        if (!cancelled) {
          setModelError(
            "Não foi possível carregar o modelo de rastreamento facial. Recarregue a página.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (state !== "live") {
      cancelAnimationFrame(rafRef.current);
      setTracking(false);
      trackingRef.current = false;
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const landmarker = landmarkerRef.current;
      if (!landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const now = performance.now();
      if (now <= lastTsRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastTsRef.current = now;

      ctx.save();
      ctx.clearRect(0, 0, w, h);
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      try {
        const result = landmarker.detectForVideo(video, now);
        const face = result.faceLandmarks?.[0];
        if (face?.length) {
          if (!trackingRef.current) {
            trackingRef.current = true;
            setTracking(true);
          }
          ctx.save();
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          drawWig(
            ctx,
            face,
            w,
            h,
            styleRef.current,
            opacityRef.current,
            false,
          );
          ctx.restore();
        } else if (trackingRef.current) {
          trackingRef.current = false;
          setTracking(false);
        }
      } catch {
        // frame ocasional pode falhar — ignora
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, videoRef]);

  const active = WIG_STYLES.find((s) => s.id === styleId) ?? WIG_STYLES[1]!;

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
            aria-label="Experimente estilos de cabelo ao vivo"
          />

          {state !== "live" ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-[#060810]/px-6 text-center">
              <p className="font-display text-3xl text-white sm:text-4xl">
                Experimente ao vivo
              </p>
              <p className="font-serif-body max-w-md text-sm text-white/70 sm:text-base">
                Prévia experimental. Em breve: try-on com segmentação e estilos
                reais (Banuba / DeepAR). Nada é gravado ou enviado.
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
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-[0.65rem] tracking-wide text-white/80 uppercase backdrop-blur-sm">
              <span
                className={`size-1.5 rounded-full ${tracking ? "bg-brand-gold" : "bg-white/30"}`}
              />
              {tracking ? "Rosto detectado" : "Centralize o rosto"}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <div>
          <p className="mb-3 text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase">
            Estilo da peruca
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {WIG_STYLES.map((s) => {
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
                  <span className="block text-sm font-semibold tracking-wide">
                    {s.label}
                  </span>
                  <span className="mt-1 block text-[0.7rem] leading-snug text-white/45">
                    {s.blurb}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-white/50">
            Selecionado: <span className="text-brand-gold">{active.label}</span> —{" "}
            {active.blurb}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <label
                htmlFor="tryon-opacity"
                className="text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase"
              >
                Intensidade da peruca
              </label>
              <p className="text-[0.65rem] tracking-wide text-white/40 uppercase">
                {opacity}%
              </p>
            </div>
            <input
              id="tryon-opacity"
              type="range"
              min={20}
              max={100}
              step={1}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              disabled={state !== "live"}
              className="plan-range h-2 w-full cursor-pointer appearance-none rounded-none bg-white/15 disabled:opacity-40"
              style={{
                background: `linear-gradient(to right, var(--color-brand-gold, #b6a46e) 0%, var(--color-brand-gold, #b6a46e) ${opacity}%, rgba(255,255,255,0.15) ${opacity}%, rgba(255,255,255,0.15) 100%)`,
              }}
            />
            <div className="mt-2 flex justify-between text-[0.6rem] tracking-wide text-white/40 uppercase">
              <span>Sutil</span>
              <span>Cheia</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-white/55">
              Esta prévia ainda não é o try-on final — o plano técnico está em{" "}
              <span className="text-white/70">docs/superpowers</span> (segmentação
              + SDK). Não representa resultado cirúrgico; a avaliação presencial
              define o plano real.
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
                  "Olá! Experimentei os estilos de cabelo ao vivo no site e gostaria de agendar minha avaliação.",
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
