export type HairEngineKind = "segment-tint" | "sdk-style";

export type HairDrawOpts = {
  /** Preset de cor / reforço (Fase 1) ou asset de estilo (Fase 2). */
  styleId: string;
  /** 0..1 */
  intensity: number;
};

/** Engine canvas (MediaPipe): caller fornece vídeo + canvas. */
export type CanvasHairEngine = {
  kind: "segment-tint";
  ownsCamera: false;
  init: () => Promise<void>;
  dispose: () => void;
  draw: (
    input: HTMLVideoElement,
    ctx: CanvasRenderingContext2D,
    opts: HairDrawOpts,
  ) => boolean;
};

/**
 * Engine SDK (Banuba): dono da câmera e do canvas interno via Dom.render.
 */
export type SdkHairEngine = {
  kind: "sdk-style";
  ownsCamera: true;
  init: () => Promise<void>;
  dispose: () => void;
  mount: (container: HTMLElement) => Promise<void>;
  unmount: () => void;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  setStyle: (styleId: string, intensity: number) => Promise<void>;
};

export type HairTryOnEngine = CanvasHairEngine | SdkHairEngine;
