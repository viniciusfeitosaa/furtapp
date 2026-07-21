export type HairEngineKind = "segment-tint";

export type HairDrawOpts = {
  /** Id do preset de tom/densidade (MediaPipe). */
  styleId: string;
  /** 0..1 */
  intensity: number;
};

/** Engine canvas gratuito (MediaPipe Hair Segmenter). */
export type HairTryOnEngine = {
  kind: HairEngineKind;
  ownsCamera: false;
  init: () => Promise<void>;
  dispose: () => void;
  draw: (
    input: HTMLVideoElement,
    ctx: CanvasRenderingContext2D,
    opts: HairDrawOpts,
  ) => boolean;
};
