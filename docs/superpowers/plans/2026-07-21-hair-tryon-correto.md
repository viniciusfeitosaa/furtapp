# Hair Try-On correto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o overlay “chapéu de papelão” por um try-on de cabelo crível (segmentação +, em seguida, SDK de estilos), mantendo `/experimente` no site.

**Architecture:** Adapter `HairTryOnEngine` + MediaPipe Hair Segmenter (grátis/OSS). Banuba/DeepAR removidos.

**Tech Stack:** Next.js 16, React 19, `@mediapipe/tasks-vision` (Apache 2.0).

**Spec:** `docs/superpowers/specs/2026-07-21-hair-tryon-correto-design.md`

---

## File map

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/lib/tryon/wigStyles.ts` | Catálogo de estilos (sem franja na Fase 0) |
| `src/lib/tryon/drawWig.ts` | **Deprecar** após Fase 1 (não usar em produção) |
| `src/lib/tryon/HairTryOnEngine.ts` | Interface do adapter |
| `src/lib/tryon/engines/mediapipeHairSegment.ts` | Provider definitivo: máscara + tint |
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

## Fase 2 — Estilos reais (SDK pago)

> **Cancelada / substituída (2026-07-21):** Banuba removido. Provider definitivo = **MediaPipe** (grátis).

### Task 2.1–2.4 (histórico Banuba)

- [x] Spike: Banuba escolhido → **revertido** por exigência de stack gratuita
- [x] Remover `banubaHair.ts`, env vars e feature flag comercial
- [x] MediaPipe único provider + presets unificados

### Task 2.5: Aceite visual

- [ ] Checklist visual em `/experimente` (desktop + mobile)
- [x] Atualizar `MAPA DE BORDO.md`

---

## Fase 3 — Produto / conversão

> **Cancelada (2026-07-21):** pedido explícito — merge sem etapa de CTA/teaser na home.

### Task 3.1: CTA contextual

- [x] ~~WhatsApp com texto incluindo estilo selecionado~~ *(já parcial no LiveTryOn Banuba; sem teaser home)*
- [x] ~~Teaser na home~~ — **não fazer**

### Task 3.2: Remover código morto

- [ ] Deletar ou isolar `drawWig.ts` quando SDK estiver no ar *(oportunista, pós-trial)*
- [ ] Atualizar `2026-07-21-experimente-ao-vivo-design.md` com “superseded by…”

---

## Ordem de execução sugerida

1. Fase 0  
2. Spike licença SDK **em paralelo** com Fase 1  
3. Fase 1 + scaffold Fase 2 mergeáveis sem trial  
4. MediaPipe é o provider definitivo (sem SDK pago)  
5. ~~Fase 3 polish CTA~~ — cancelada  

---

## Test plan (manual)

1. `/experimente` sem câmera → CTA + erro amigável  
2. Com câmera → tracking estável  
3. Troca de estilo não trava o rAF loop  
4. Encerrar câmera libera `getUserMedia` tracks  
5. Mobile Safari: permissão + performance  

Não há testes unitários de canvas AR neste plano (baixa ROI); preferir checklist visual + build CI.
