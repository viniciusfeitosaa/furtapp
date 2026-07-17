# Pacote A — Motion cinematográfico (design)

**Data:** 2026-07-15  
**Status:** aprovado para planejamento (Pacote A primeiro; Pacote C depois)  
**Branch de trabalho:** `cursor/hero-final-5-e94e` (ou nova branch `cursor/motion-pacote-a-e94e` se preferir isolar)

## Contexto

O site institucional do Dr. Francisco Furtado já tem linguagem visual forte (foto fundida em degradê navy→cinza, máscaras CSS, tipografia Bebas/Arapey/Poppins/Great Vibes, ouro `#b6a46e`) e um único movimento: zoom leve da foto em `#pilares` (`ScrollZoomImage`, escala até 1.12).

O usuário aprovou:

- **Pacote A agora** — scroll cinematográfico leve
- **Pacote C depois** — cena 3D de **folículo** (Three.js / WebGL), não neste plano

## Objetivo do Pacote A

Dar presença e ritmo à homepage com **2–4 movimentos intencionais**, amarrados ao scroll/entrada em viewport, sem bibliotecas pesadas e sem estética genérica (sem particles, glow roxo, cards flutuantes).

## Escopo (4 peças)

| # | Peça | Comportamento | Intensidade |
|---|------|---------------|-------------|
| 1 | **Hero** | Entrada do texto (fade + leve translateY); parallax suave do retrato conforme scroll no `#inicio` | Sutil |
| 2 | **Pilares** (Ciência · Arte · Cuidado) | Stagger ao entrar no viewport; manter zoom existente | Médio |
| 3 | **Jornada** (M0–M12) | Linha dourada de progresso + destaque do checkpoint ativo conforme scroll na seção | Médio |
| 4 | **Header** | Stroke draw do `simbolo-pincelada.svg` no load (paths já existem) | Sutil, 1× |

## Fora de escopo (agora)

- Pacote B (tilt 3D, hover perspective)
- Pacote C (folículo WebGL) — só reservar âncora/seção futura e nota de asset
- Framer Motion / GSAP / Three.js
- Animar seções Sobre, FAQ, Resultados além do que já existe
- Trocar `next/image` no hero (manter `<img>` estático por estabilidade do preview)

## Princípios

1. **Presença, não ruído** — cada seção tem no máximo um job de movimento.
2. **`prefers-reduced-motion: reduce`** — desliga parallax/stagger/draw; conteúdo estático completo.
3. **Performance** — `transform`/`opacity` only; rAF com throttle; pausar loops fora da viewport (`IntersectionObserver`), padrão já usado em `ScrollZoomImage`.
4. **Sem deps novas** — CSS + React client hooks leves no stack atual (Next 16 / React 19 / Tailwind 4).
5. **Marca** — ouro `#b6a46e` na linha da jornada; stroke do símbolo em branco (como o SVG atual); timing ~400–900ms, easing suave.

## Arquitetura

```
src/lib/motion.ts              # funções puras: clamp, scrollProgressThrough, prefersReducedMotion
src/hooks/useScrollProgress.ts # progresso 0–1 de um elemento no viewport
src/hooks/useInViewOnce.ts     # entra 1× e adiciona data-inview / classe
src/components/Reveal.tsx      # wrapper client para stagger children
src/components/BrandMark.tsx   # SVG inline com stroke-dash draw
Hero.tsx (client ou split)     # parallax + reveal tipográfico
HomeSections.tsx               # Reveal nos pilares + JourneyTrack
Header.tsx                     # BrandMark no lugar do PNG (desktop+mobile)
globals.css                    # keyframes / util classes .ff-reveal
```

**Hero:** converter para `"use client"` *ou* extrair `HeroMotion` client wrapping imgs/texto, mantendo máscaras/gradientes no server se possível. Preferir **extrair client filhos** para não forçar o máximo da árvore a client.

## Especificação por peça

### 1. Hero

- **Reveal no load:** gold line, tagline, H1, parágrafo, CTAs com delay escalonado (0 / 80 / 160 / 240 / 320ms), `opacity 0→1`, `translateY 16px→0`, `duration ~700ms`, `ease cubic-bezier(0.22,1,0.36,1)`.
- **Parallax:** enquanto `#inicio` está no viewport, `translateY` da foto = `scrollProgress * 24–40px` (mobile menor: 16–24px). Texto sem parallax (legibilidade).
- Reduced motion: reveal instantâneo, parallax off.

### 2. Pilares

- Cada bloco Ciência/Arte/Cuidado começa com `opacity:0; translateY:20px` e ativa em sequência (+120ms) quando `#pilares` intersecta ≥15%.
- Não alterar `ScrollZoomImage` além de garantir convivência (zoom + fade são ortogonais).

### 3. Jornada

- Acima ou atrás do grid `CHECKPOINTS`, uma track com:
  - trilho `bg-brand-gray-light`
  - fill `bg-brand-gold` com `scaleX` ou `width` % = progresso da seção no viewport (0–100%)
- Checkpoint cuja posição proporcional no track ≤ progresso recebe classe ativa (texto ouro / borda).
- Progresso linear: mesma fórmula de `ScrollZoomImage` (`(viewH - top) / (viewH + height)`).

### 4. Header BrandMark

- Substituir PNG por SVG inline baseado em `public/brand/simbolo-pincelada.svg` (paths de folículo U + haste + pontos).
- No mount: `stroke-dasharray` / `stroke-dashoffset` animados ~900ms nos paths; círculos aparecem no final (opacity).
- Só anima **uma vez** por carregamento de página; se `prefers-reduced-motion`, SVG estático completo.
- Manter tamanho atual (h-8…h-10). Fundo do mark continua coerente com header transparente/sólido (rect preto do SVG ou transparente — preferir **sem rect** no inline para fundir no header).

## Pacote C (adiado — só âncora de produto)

- Objetivo futuro: modelo 3D de **folículo** (o símbolo da marca já traz o “U”).
- Provável home em seção dedicada ou dentro de Tratamentos/Sobre.
- Stack candidata: React Three Fiber + modelo GLB otimizado; lazy load; fallback imagem 2D.
- **Não implementar agora.** Documento de design separado quando o Pacote A estiver no ar.

## Critérios de aceite

- [ ] Homepage carrega sem regressão visual de máscaras/degradês
- [ ] 4 peças do Pacote A presentes e perceptíveis em desktop e mobile
- [ ] Com `prefers-reduced-motion`, zero movimento contínuo; conteúdo íntegro
- [ ] `npm run build` ok; preview `:3000` estável (sem next/image no hero)
- [ ] Nenhuma dependência nova no `package.json`

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Preview travar com GPU blur/filter | Só `transform`/`opacity`; sem filter/blur animado |
| Hero client hydrata tarde | Reveal CSS com `@starting-style` opcional + fallback JS; content SSR intact |
| Linha da jornada “pula” | rAF + IO; clamp; will-change pontual |
| SVG draw feio no PNG legacy | Usar paths do SVG oficial; testes visuais |
