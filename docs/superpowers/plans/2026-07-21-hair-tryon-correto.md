# Hair Try-On correto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o overlay “chapéu de papelão” por um try-on de cabelo crível (segmentação +, em seguida, SDK de estilos), mantendo `/experimente` no site.

**Architecture:** Adapter `HairTryOnEngine` atrás da UI; Fase 0 limpa o catálogo; Fase 1 MediaPipe Hair Segmenter; Fase 2 DeepAR ou Banuba com assets reais; UI nunca fala com o SDK direto.

**Tech Stack:** Next.js 16, React 19, `@mediapipe/tasks-vision` (já no repo), candidato Fase 2: DeepAR Web ou Banuba Web SDK.

**Spec:** `docs/superpowers/specs/2026-07-21-hair-tryon-correto-design.md`

---

## File map

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/lib/tryon/wigStyles.ts` | Catálogo de estilos (sem franja na Fase 0) |
| `src/lib/tryon/drawWig.ts` | **Deprecar** após Fase 1 (não usar em produção) |
| `src/lib/tryon/HairTryOnEngine.ts` | Interface do adapter |
| `src/lib/tryon/engines/mediapipeHairSegment.ts` | Fase 1: máscara de cabelo + tint |
| `src/lib/tryon/engines/deeparHair.ts` (ou banuba) | Fase 2: estilos reais |
| `src/components/tryon/LiveTryOn.tsx` | UI: câmera, estilos, intensidade, CTA |
| `src/app/experimente/page.tsx` | Copy / SEO |
| `docs/superpowers/specs/2026-07-21-hair-tryon-correto-design.md` | Decisões |

---

## Fase 0 — Limpeza imediata (este PR)

### Task 0.1: Remover estilo “Com franja”

**Files:** `src/lib/tryon/wigStyles.ts`

- [ ] Remover `"franja"` do union `WigStyleId`
- [ ] Remover o objeto do array `WIG_STYLES`
- [ ] Garantir `getWigStyle` fallback = `"classico"`
- [ ] `npm run build` — OK

### Task 0.2: Copy honesta na página

**Files:** `src/app/experimente/page.tsx`, `src/components/tryon/LiveTryOn.tsx`

- [ ] Ajustar textos: experiência em reformulação / prévia; não vender como resultado final
- [ ] Manter disclaimer clínico (sem UF, avaliação presencial)

### Task 0.3: Commit Fase 0

- [ ] Commit: `Remove franja e documenta plano de hair try-on correto`

---

## Fase 1 — Segmentação de cabelo (MediaPipe)

### Task 1.1: Spike Image Segmenter (Hair)

- [ ] Carregar modelo Hair Segmenter via `@mediapipe/tasks-vision` (CDN wasm, como Face Landmarker)
- [ ] Provar máscara em cima do vídeo (canvas alpha)
- [ ] Anotar FPS mobile/desktop no PR

### Task 1.2: Interface do engine

**Files:** criar `src/lib/tryon/HairTryOnEngine.ts`

```ts
export type HairEngineKind = "segment-tint" | "sdk-style";

export type HairTryOnEngine = {
  kind: HairEngineKind;
  init(): Promise<void>;
  dispose(): void;
  /** frame: video element; out: canvas 2d */
  draw(input: HTMLVideoElement, out: CanvasRenderingContext2D, opts: {
    styleId: string;
    intensity: number; // 0..1
  }): void;
};
```

- [ ] Implementar stub + tipos
- [ ] Commit

### Task 1.3: Engine `segment-tint`

**Files:** `src/lib/tryon/engines/mediapipeHairSegment.ts`

- [ ] `detectForVideo` → máscara
- [ ] Tint / reforço de densidade **só** nos pixels de cabelo (não inventar chapéu acima da cabeça)
- [ ] Se não houver cabelo detectável, mostrar mensagem: “Para estilos completos, use a avaliação / versão com SDK”

### Task 1.4: Plugar na UI

**Files:** `src/components/tryon/LiveTryOn.tsx`

- [ ] Trocar `drawWig(...)` por `engine.draw(...)`
- [ ] Estilos na Fase 1 = presets de **cor/intensidade** (não cortes 3D)
- [ ] Build + teste manual em `/experimente`
- [ ] Commit: `feat(tryon): segmentação de cabelo MediaPipe (Fase 1)`

---

## Fase 2 — Estilos reais (SDK)

### Task 2.1: Spike comercial (paralelo à Fase 1)

- [ ] Solicitar trial **DeepAR** e/ou **Banuba** Web
- [ ] Checklist: preço, watermark, WebGL, iOS Safari, LGPD (on-device vs cloud)
- [ ] Escolher **um** provider (doc: atualizar spec §3 com a escolha)

### Task 2.2: Adapter do SDK escolhido

**Files:** `src/lib/tryon/engines/deeparHair.ts` *ou* `banubaHair.ts`

- [ ] `init` carrega WASM/SDK lazy (dynamic import)
- [ ] `loadStyle(styleId)` troca effect/asset
- [ ] Tratar permissão de câmera (reusar `useCamera` ou API do SDK)

### Task 2.3: Catálogo de assets

- [ ] 4–5 hair assets licenciados mapeados aos ids: `curto`, `classico`, `volumoso`, `lateral`, `ondulado`
- [ ] **Sem** franja no catálogo clínico v1
- [ ] Preview thumbs na UI (imagem estática por estilo)

### Task 2.4: Feature flag

**Files:** `src/lib/tryon/config.ts`

```ts
export const HAIR_TRYON_PROVIDER =
  process.env.NEXT_PUBLIC_HAIR_TRYON_PROVIDER ?? "segment-tint";
```

- [ ] Alternar segment-tint ↔ sdk sem redeploy de UI
- [ ] Commit: `feat(tryon): provider SDK de estilos (Fase 2)`

### Task 2.5: Aceite visual

- [ ] Gravar 10s de vídeo teste (desktop + iPhone)
- [ ] Checklist §6 da spec
- [ ] Atualizar `MAPA DE BORDO.md`

---

## Fase 3 — Produto / conversão

### Task 3.1: CTA contextual

- [ ] WhatsApp com texto incluindo estilo selecionado
- [ ] Teaser na home apontando para a versão estável

### Task 3.2: Remover código morto

- [ ] Deletar ou isolar `drawWig.ts` quando SDK estiver no ar
- [ ] Atualizar `2026-07-21-experimente-ao-vivo-design.md` com “superseded by…”

---

## Ordem de execução sugerida

1. Fase 0 (hoje)  
2. Spike licença SDK (e-mail/trial) **em paralelo** com Fase 1  
3. Fase 1 mergeável mesmo se SDK atrasar  
4. Fase 2 quando houver trial + assets  
5. Fase 3 polish  

---

## Test plan (manual)

1. `/experimente` sem câmera → CTA + erro amigável  
2. Com câmera → tracking estável  
3. Troca de estilo não trava o rAF loop  
4. Encerrar câmera libera `getUserMedia` tracks  
5. Mobile Safari: permissão + performance  

Não há testes unitários de canvas AR neste plano (baixa ROI); preferir checklist visual + build CI.
