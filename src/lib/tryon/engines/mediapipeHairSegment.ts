import type { HairTryOnEngine } from "@/lib/tryon/HairTryOnEngine";
import { getHairLook } from "@/lib/tryon/hairTintPresets";

const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const HAIR_MODEL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite";

type ImageSegmenterType = import("@mediapipe/tasks-vision").ImageSegmenter;

/**
 * Try-on gratuito/OSS: MediaPipe Hair Segmenter + tint só no cabelo.
 * Apache 2.0 — sem token, sem Banuba/DeepAR.
 */
export function createMediaPipeHairSegmentEngine(): HairTryOnEngine {
  let segmenter: ImageSegmenterType | null = null;
  let maskCanvas: HTMLCanvasElement | null = null;
  let maskCtx: CanvasRenderingContext2D | null = null;
  let lastTs = -1;

  return {
    kind: "segment-tint",
    ownsCamera: false,

    async init() {
      const visionMod = await import("@mediapipe/tasks-vision");
      const vision = await visionMod.FilesetResolver.forVisionTasks(WASM_ROOT);
      try {
        segmenter = await visionMod.ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: HAIR_MODEL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          outputCategoryMask: false,
          outputConfidenceMasks: true,
        });
      } catch {
        // Fallback CPU (alguns dispositivos sem WebGL adequado)
        segmenter = await visionMod.ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: HAIR_MODEL,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          outputCategoryMask: false,
          outputConfidenceMasks: true,
        });
      }
    },

    dispose() {
      segmenter?.close();
      segmenter = null;
      maskCanvas = null;
      maskCtx = null;
    },

    draw(input, ctx, opts) {
      if (!segmenter || input.readyState < 2) return false;

      const w = input.videoWidth || 640;
      const h = input.videoHeight || 480;
      if (ctx.canvas.width !== w || ctx.canvas.height !== h) {
        ctx.canvas.width = w;
        ctx.canvas.height = h;
      }

      const now = performance.now();
      if (now <= lastTs) return false;
      lastTs = now;

      ctx.save();
      ctx.clearRect(0, 0, w, h);
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(input, 0, 0, w, h);
      ctx.restore();

      let result;
      try {
        result = segmenter.segmentForVideo(input, now);
      } catch {
        return false;
      }

      const masks = result.confidenceMasks;
      if (!masks?.length) {
        result.close();
        return false;
      }

      const hairMask = masks.length > 1 ? masks[1]! : masks[0]!;
      const mw = hairMask.width;
      const mh = hairMask.height;
      const conf = hairMask.getAsFloat32Array();

      if (!maskCanvas) {
        maskCanvas = document.createElement("canvas");
        maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
      }
      if (!maskCtx) {
        result.close();
        return false;
      }
      if (maskCanvas.width !== mw || maskCanvas.height !== mh) {
        maskCanvas.width = mw;
        maskCanvas.height = mh;
      }

      const look = getHairLook(opts.styleId);
      const intensity = Math.min(1, Math.max(0, opts.intensity)) * look.boost;
      const img = maskCtx.createImageData(mw, mh);
      const data = img.data;
      let hairPixels = 0;
      const [tr, tg, tb] = look.rgb;

      for (let i = 0; i < conf.length; i += 1) {
        const c = conf[i] ?? 0;
        const a =
          c > 0.32 ? Math.min(1, (c - 0.32) / 0.5) * intensity * 0.78 : 0;
        const o = i * 4;
        data[o] = tr;
        data[o + 1] = tg;
        data[o + 2] = tb;
        data[o + 3] = Math.round(a * 255);
        if (a > 0.05) hairPixels += 1;
      }
      maskCtx.putImageData(img, 0, 0);

      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = true;
      // soft-light = reforço mais natural que overlay sólido
      ctx.globalCompositeOperation = "soft-light";
      ctx.drawImage(maskCanvas, 0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = Math.min(1, intensity * 0.55);
      ctx.drawImage(maskCanvas, 0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.restore();

      for (const m of masks) m.close();
      result.close();

      return hairPixels > mw * mh * 0.002;
    },
  };
}
