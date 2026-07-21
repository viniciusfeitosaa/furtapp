export type HairTryOnProvider = "segment-tint" | "banuba";

function hasBanubaCredentials(): boolean {
  const token = process.env.NEXT_PUBLIC_BANUBA_CLIENT_TOKEN?.trim();
  const styles = process.env.NEXT_PUBLIC_BANUBA_STYLES_BASE?.trim();
  const makeup = process.env.NEXT_PUBLIC_BANUBA_MAKEUP_EFFECT_URL?.trim();
  return Boolean(token && (styles || makeup));
}

/**
 * `auto` → Banuba se token + effect; senão MediaPipe segment-tint.
 * Override: NEXT_PUBLIC_HAIR_TRYON_PROVIDER=segment-tint|banuba|auto
 */
export function resolveHairTryOnProvider(): HairTryOnProvider {
  const raw = (process.env.NEXT_PUBLIC_HAIR_TRYON_PROVIDER ?? "auto").toLowerCase();
  const ready = hasBanubaCredentials();

  if (raw === "segment-tint") return "segment-tint";
  if (raw === "banuba") {
    if (!ready) {
      console.warn(
        "[tryon] Provider banuba sem token/effect — usando segment-tint.",
      );
      return "segment-tint";
    }
    return "banuba";
  }

  return ready ? "banuba" : "segment-tint";
}

export function getBanubaClientToken(): string | null {
  const t = process.env.NEXT_PUBLIC_BANUBA_CLIENT_TOKEN?.trim();
  return t || null;
}

/** CDN do SDK Banuba WebAR (wasm + modules). */
export function getBanubaSdkCdn(): string {
  return (
    process.env.NEXT_PUBLIC_BANUBA_SDK_CDN?.replace(/\/$/, "") ??
    "https://cdn.jsdelivr.net/npm/@banuba/webar@1.17.0"
  );
}

/**
 * URL do effect Makeup (hair color). Sem isso, Banuba tenta STYLES_BASE.
 * Ex.: /effects/Makeup.zip ou URL absoluta.
 */
export function getBanubaMakeupEffectUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_BANUBA_MAKEUP_EFFECT_URL?.trim();
  return u || null;
}

/**
 * Prefixo para effects de estilo: `${base}/curto.zip`, etc.
 * Ex.: https://cdn.example.com/hair-styles  ou  /effects/hair
 */
export function getBanubaStylesBase(): string | null {
  const u = process.env.NEXT_PUBLIC_BANUBA_STYLES_BASE?.trim().replace(/\/$/, "");
  return u || null;
}

export const HAIR_TRYON_PROVIDER = resolveHairTryOnProvider();
