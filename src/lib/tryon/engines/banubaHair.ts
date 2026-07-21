import type { SdkHairEngine } from "@/lib/tryon/HairTryOnEngine";
import {
  getBanubaClientToken,
  getBanubaMakeupEffectUrl,
  getBanubaSdkCdn,
  getBanubaStylesBase,
} from "@/lib/tryon/config";
import { getClinicalStyle } from "@/lib/tryon/styleCatalog";

type BanubaPlayer = {
  addModule: (...modules: unknown[]) => Promise<void>;
  applyEffect: (effect: unknown) => Promise<void>;
  use: (input: unknown) => void;
  play: () => void;
  pause?: () => void;
};

type BanubaEffect = {
  evalJs: (code: string) => Promise<unknown>;
};

type BanubaModuleApi = {
  Player: {
    create: (opts: {
      clientToken: string;
      devicePixelRatio?: number;
      locateFile?: string | ((file: string) => string);
    }) => Promise<BanubaPlayer>;
  };
  Module: {
    preload: (urls: string[]) => Promise<unknown[]>;
  };
  Effect: {
    preload: (url: string) => Promise<BanubaEffect>;
  };
  Webcam: new () => { stop?: () => void };
  Dom: {
    render: (player: BanubaPlayer, selectorOrEl: string | HTMLElement) => void;
    unmount: (selectorOrEl: string | HTMLElement) => void;
  };
};

/** Import ESM remoto sem o bundler Next resolver o path em build. */
function importRemoteEsm(url: string): Promise<BanubaModuleApi> {
  const load = new Function("u", "return import(u)") as (
    u: string,
  ) => Promise<BanubaModuleApi>;
  return load(url);
}

/**
 * Fase 2: Banuba WebAR (CDN browser ESM).
 * - STYLES_BASE → effect .zip por estilo clínico
 * - MAKEUP_EFFECT_URL → Hair.color() no Makeup
 */
export function createBanubaHairEngine(): SdkHairEngine {
  const token = getBanubaClientToken();
  const cdn = getBanubaSdkCdn();
  const stylesBase = getBanubaStylesBase();
  const makeupUrl = getBanubaMakeupEffectUrl();

  let api: BanubaModuleApi | null = null;
  let player: BanubaPlayer | null = null;
  let effect: BanubaEffect | null = null;
  let webcam: { stop?: () => void } | null = null;
  let container: HTMLElement | null = null;
  let mounted = false;
  let mode: "style-zip" | "hair-color" | null = null;
  let currentStyleId = "classico";

  return {
    kind: "sdk-style",
    ownsCamera: true,

    async init() {
      if (!token) {
        throw new Error("NEXT_PUBLIC_BANUBA_CLIENT_TOKEN ausente");
      }
      if (!stylesBase && !makeupUrl) {
        throw new Error(
          "Configure NEXT_PUBLIC_BANUBA_STYLES_BASE ou NEXT_PUBLIC_BANUBA_MAKEUP_EFFECT_URL",
        );
      }

      api = await importRemoteEsm(`${cdn}/dist/BanubaSDK.browser.esm.js`);

      player = await api.Player.create({
        clientToken: token,
        devicePixelRatio: 1,
        locateFile: (file) => `${cdn}/dist/${file}`,
      });

      const modules = await api.Module.preload(
        ["face_tracker", "hair"].map((m) => `${cdn}/dist/modules/${m}.zip`),
      );
      await player.addModule(...modules);

      if (stylesBase) {
        mode = "style-zip";
        const first = getClinicalStyle(currentStyleId);
        effect = await api.Effect.preload(`${stylesBase}/${first.id}.zip`);
        await player.applyEffect(effect);
      } else {
        mode = "hair-color";
        effect = await api.Effect.preload(makeupUrl!);
        await player.applyEffect(effect);
        await applyHairColor(effect, currentStyleId, 0.75);
      }
    },

    async mount(el) {
      if (!api || !player) throw new Error("Banuba não inicializado");
      container = el;
      api.Dom.render(player, el);
      mounted = true;
    },

    unmount() {
      if (!api || !container) return;
      try {
        api.Dom.unmount(container);
      } catch {
        /* ignore */
      }
      mounted = false;
      container = null;
    },

    async startCamera() {
      if (!api || !player) throw new Error("Banuba não inicializado");
      webcam?.stop?.();
      webcam = new api.Webcam();
      player.use(webcam);
      player.play();
      if (container && api && !mounted) {
        api.Dom.render(player, container);
        mounted = true;
      }
    },

    stopCamera() {
      webcam?.stop?.();
      webcam = null;
      player?.pause?.();
    },

    async setStyle(styleId, intensity) {
      currentStyleId = styleId;
      if (!api || !player || !effect) return;

      if (mode === "style-zip" && stylesBase) {
        effect = await api.Effect.preload(`${stylesBase}/${styleId}.zip`);
        await player.applyEffect(effect);
        return;
      }

      if (mode === "hair-color") {
        await applyHairColor(effect, styleId, intensity);
      }
    },

    dispose() {
      this.stopCamera();
      this.unmount();
      player = null;
      effect = null;
      api = null;
      mode = null;
    },
  };
}

async function applyHairColor(
  effect: BanubaEffect,
  styleId: string,
  intensity: number,
) {
  const style = getClinicalStyle(styleId);
  const parts = style.banubaRgba.trim().split(/\s+/);
  const r = parts[0] ?? "0.1";
  const g = parts[1] ?? "0.08";
  const b = parts[2] ?? "0.05";
  const baseA = Number(parts[3] ?? "0.8");
  const a = Math.min(1, Math.max(0, baseA * intensity)).toFixed(2);
  await effect.evalJs(`Hair.color("${r} ${g} ${b} ${a}")`);
}
