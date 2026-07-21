export type HairEngineKind = "segment-tint" | "sdk-style";

export type HairDrawOpts = {
  /** Preset de cor / reforço (Fase 1) ou asset de estilo (Fase 2). */
  styleId: string;
  /** 0..1 */
  intensity: number;
};

export type HairTryOnEngine = {
  kind: HairEngineKind;
  init: () => Promise<void>;
  dispose: () => void;
  /**
   * Desenha o frame do vídeo (já espelhado pelo caller, se desejado)
   * e aplica o efeito no mesmo canvas.
   * Retorna true se detectou cabelo neste frame.
   */
  draw: (
    input: HTMLVideoElement,
    ctx: CanvasRenderingContext2D,
    opts: HairDrawOpts,
  ) => boolean;
};
