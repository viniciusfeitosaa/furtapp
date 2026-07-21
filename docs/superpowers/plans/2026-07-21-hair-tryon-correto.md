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

- [x] Remover `"franja"` do union `WigStyleId`
- [x] Remover o objeto do array `WIG_STYLES`
- [x] Garantir `getWigStyle` fallback = `"classico"`
- [x] `npm run build` — OK

### Task 0.2: Copy honesta na página

**Files:** `src/app/experimente/page.tsx`, `src/components/tryon/LiveTryOn.tsx`

- [x] Ajustar textos: experiência em reformulação / prévia; não vender como resultado final
- [x] Manter disclaimer clínico (sem UF, avaliação presencial)

### Task 0.3: Commit Fase 0

- [x] Commit: `Remove franja e documenta plano de hair try-on correto`

---

## Fase 1 — Segmentação de cabelo (MediaPipe)

### Task 1.1: Spike Image Segmenter (Hair)

- [x] Carregar modelo Hair Segmenter via `@mediapipe/tasks-vision` (CDN wasm, como Face Landmarker)
- [x] Provar máscara em cima do vídeo (canvas alpha)

### Task 1.2: Interface do engine

**Files:** criar `src/lib/tryon/HairTryOnEngine.ts`

- [x] Implementar tipos do adapter

### Task 1.3: Engine `segment-tint`

**Files:** `src/lib/tryon/engines/mediapipeHairSegment.ts`

- [x] `segmentForVideo` → máscara de confiança
- [x] Tint só nos pixels de cabelo
- [x] Feedback se máscara vazia

### Task 1.4: Plugar na UI

**Files:** `src/components/tryon/LiveTryOn.tsx`

- [x] Trocar `drawWig(...)` por `engine.draw(...)`
- [x] Estilos Fase 1 = presets de tom/reforço
- [x] Build + teste manual em `/experimente`
- [x] Commit: `feat(tryon): segmentação de cabelo MediaPipe (Fase 1)`

---

## Fase 2 — Estilos reais (SDK)

### Task 2.1: Spike comercial (paralelo à Fase 1)

- [x] Solicitar trial **DeepAR** e/ou **Banuba** Web *(doc: Banuba escolhido; DeepAR Web sem hair)*
- [x] Checklist: preço, watermark, WebGL, iOS Safari, LGPD (on-device vs cloud)
- [x] Escolher **um** provider (doc: atualizar spec §3 com a escolha) → **Banuba**

### Task 2.2: Adapter do SDK escolhido

**Files:** `src/lib/tryon/engines/banubaHair.ts`

- [x] `init` carrega WASM/SDK lazy (dynamic import CDN)
- [x] `loadStyle(styleId)` troca effect/asset (`setStyle`)
- [x] Tratar permissão de câmera (Webcam Banuba; MediaPipe reusa `useCamera`)

### Task 2.3: Catálogo de assets

- [x] 4–5 hair assets ids: `curto`, `classico`, `volumoso`, `lateral`, `ondulado` (`styleCatalog.ts`)
- [x] **Sem** franja no catálogo clínico v1
- [ ] Preview thumbs na UI (imagem estática por estilo) — pendente assets
- [ ] Zips licenciados Banuba — **bloqueado até trial + assets**

### Task 2.4: Feature flag

**Files:** `src/lib/tryon/config.ts`

```ts
export const HAIR_TRYON_PROVIDER =
  process.env.NEXT_PUBLIC_HAIR_TRYON_PROVIDER ?? "auto";
```

- [x] Alternar segment-tint ↔ banuba (`auto` sem credenciais = Fase 1)
- [x] Commit: `feat(tryon): provider Banuba + feature flag (Fase 2)`

### Task 2.5: Aceite visual

- [ ] Gravar 10s de vídeo teste (desktop + iPhone) — requer token
- [ ] Checklist §6 da spec
- [x] Atualizar `MAPA DE BORDO.md`

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
