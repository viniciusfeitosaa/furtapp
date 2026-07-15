# Pacote A — Motion cinematográfico Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar motion cinematográfico leve na homepage (hero reveal + parallax, stagger dos pilares, linha de progresso da jornada, stroke draw do símbolo no header) sem libs novas e respeitando `prefers-reduced-motion`.

**Architecture:** Utilitários puros em `src/lib/motion.ts`; hooks client (`useScrollProgress`, `useInViewOnce`); wrappers `Reveal` e `BrandMark`; integração pontual em `Hero`, `HomeSections` e `Header`. Padrão de IO + rAF já validado em `ScrollZoomImage`.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, TypeScript — sem Framer/GSAP/Three neste plano.

**Spec:** `docs/superpowers/specs/2026-07-15-pacote-a-motion-design.md`

**Pacote C:** fora deste plano (folículo 3D depois).

---

## File map

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/lib/motion.ts` | `clamp`, `scrollProgressThrough`, `getPrefersReducedMotion` |
| `src/hooks/useScrollProgress.ts` | progresso 0–1 de um `ref` no viewport |
| `src/hooks/useInViewOnce.ts` | marca elemento quando entra 1× |
| `src/components/Reveal.tsx` | children com stagger/reveal |
| `src/components/BrandMark.tsx` | SVG stroke-draw do símbolo |
| `src/components/HeroParallaxImage.tsx` | img do hero com parallax |
| `src/components/HeroCopy.tsx` | bloco tipográfico com reveal |
| `src/components/JourneyTrack.tsx` | linha + checkpoints animados |
| `src/components/Hero.tsx` | troca imgs/copy pelos client pieces |
| `src/components/HomeSections.tsx` | Reveal nos pilares + JourneyTrack |
| `src/components/Header.tsx` | BrandMark no lugar do PNG |
| `src/app/globals.css` | classes `.ff-reveal` + reduced-motion |

---

### Task 1: Utilitários de motion

**Files:**
- Create: `src/lib/motion.ts`

- [ ] **Step 1: Criar funções puras**

```ts
/** src/lib/motion.ts */
export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Progresso 0–1 enquanto `rect` atravessa o viewport.
 * 0 = topo do elemento na base da tela; 1 = topo acima da tela pela altura do elemento.
 */
export function scrollProgressThrough(
  rectTop: number,
  rectHeight: number,
  viewHeight: number,
) {
  const total = viewHeight + rectHeight;
  if (total <= 0) return 0;
  return clamp((viewHeight - rectTop) / total, 0, 1);
}

export function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

- [ ] **Step 2: Verificar com Node (sem framework de teste no repo)**

Run:

```bash
node --input-type=module -e "
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// transpile-free check via tsx if available, else assert logic inline:
function clamp(n,min,max){return Math.min(max,Math.max(min,n))}
function scrollProgressThrough(rectTop,rectHeight,viewHeight){
  const total=viewHeight+rectHeight; if(total<=0) return 0;
  return clamp((viewHeight-rectTop)/total,0,1);
}
console.assert(scrollProgressThrough(800,600,800)===0,'start');
console.assert(scrollProgressThrough(-600,600,800)===1,'end');
console.assert(Math.abs(scrollProgressThrough(0,600,800)-800/1400)<1e-9,'mid');
console.log('ok');
"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add src/lib/motion.ts
git commit -m "feat(motion): utilitários de progresso e reduced-motion"
```

---

### Task 2: Hooks `useScrollProgress` e `useInViewOnce`

**Files:**
- Create: `src/hooks/useScrollProgress.ts`
- Create: `src/hooks/useInViewOnce.ts`

- [ ] **Step 1: Implementar `useScrollProgress`**

```tsx
"use client";

import { useEffect, useState, type RefObject } from "react";
import { getPrefersReducedMotion, scrollProgressThrough } from "@/lib/motion";

/** Retorna 0–1 enquanto o elemento atravessa o viewport (rAF só quando visível). */
export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (getPrefersReducedMotion()) {
      setProgress(0);
      return;
    }

    let active = false;
    let raf = 0;

    const read = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      setProgress(scrollProgressThrough(rect.top, rect.height, viewH));
    };

    const tick = () => {
      read();
      if (active) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (active) return;
      active = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start();
        else stop();
      },
      { threshold: [0, 0.01] },
    );
    io.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) start();
    else read();

    return () => {
      stop();
      io.disconnect();
    };
  }, [ref]);

  return progress;
}
```

- [ ] **Step 2: Implementar `useInViewOnce`**

```tsx
"use client";

import { useEffect, useState, type RefObject } from "react";
import { getPrefersReducedMotion } from "@/lib/motion";

export function useInViewOnce(
  ref: RefObject<HTMLElement | null>,
  threshold = 0.15,
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (getPrefersReducedMotion()) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);

  return inView;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useScrollProgress.ts src/hooks/useInViewOnce.ts
git commit -m "feat(motion): hooks de scroll progress e in-view once"
```

---

### Task 3: Classes CSS de reveal + reduced-motion

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Anexar ao final de `globals.css`**

```css
/* --- Motion Pacote A --- */
.ff-reveal {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 700ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--ff-reveal-delay, 0ms);
}

.ff-reveal.is-inview {
  opacity: 1;
  transform: translateY(0);
}

.ff-brand-stroke {
  stroke-dasharray: 120;
  stroke-dashoffset: 120;
  transition: stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1);
}

.ff-brand-stroke.is-drawn {
  stroke-dashoffset: 0;
}

.ff-brand-dot {
  opacity: 0;
  transition: opacity 400ms ease 700ms;
}

.ff-brand-dot.is-drawn {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .ff-reveal,
  .ff-brand-stroke,
  .ff-brand-dot {
    transition: none !important;
  }
  .ff-reveal {
    opacity: 1;
    transform: none;
  }
  .ff-brand-stroke {
    stroke-dashoffset: 0;
  }
  .ff-brand-dot {
    opacity: 1;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "style(motion): classes reveal e stroke-draw"
```

---

### Task 4: Componente `Reveal`

**Files:**
- Create: `src/components/Reveal.tsx`

- [ ] **Step 1: Criar wrapper**

```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { useInViewOnce } from "@/hooks/useInViewOnce";

export function Reveal({
  children,
  className = "",
  delayMs = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInViewOnce(ref);

  return (
    <Tag
      ref={ref as never}
      className={`ff-reveal ${inView ? "is-inview" : ""} ${className}`}
      style={{ ["--ff-reveal-delay" as string]: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Reveal.tsx
git commit -m "feat(motion): componente Reveal com stagger delay"
```

---

### Task 5: `BrandMark` (stroke draw)

**Files:**
- Create: `src/components/BrandMark.tsx`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Criar `BrandMark`** (paths de `public/brand/simbolo-pincelada.svg`, **sem** rect preto)

```tsx
"use client";

import { useEffect, useState } from "react";
import { getPrefersReducedMotion } from "@/lib/motion";

export function BrandMark({ className = "" }: { className?: string }) {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (getPrefersReducedMotion()) {
      setDrawn(true);
      return;
    }
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const strokeClass = `ff-brand-stroke ${drawn ? "is-drawn" : ""}`;
  const dotClass = `ff-brand-dot ${drawn ? "is-drawn" : ""}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
    >
      <path
        className={strokeClass}
        d="M22 48 C22 54 28 58 32 58 C36 58 42 54 42 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        className={strokeClass}
        d="M32 52 C31.2 42 31.6 32 32.4 22 C32.9 15 34.2 10 38 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        className={strokeClass}
        d="M32.2 48 C31.6 40 31.8 30 32.5 21 C33 14.5 34.5 9.5 37.6 6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle className={dotClass} cx="29.5" cy="18" r="1.35" fill="#82c4d1" />
      <circle className={dotClass} cx="35.2" cy="15.2" r="1.2" fill="#82c4d1" />
      <circle className={dotClass} cx="30.2" cy="12.5" r="1.15" fill="#a5e1ed" />
      <circle className={dotClass} cx="36.5" cy="10.8" r="1.05" fill="#82c4d1" />
      <circle className={dotClass} cx="32.8" cy="8.2" r="0.95" fill="#a5e1ed" />
      <circle className={dotClass} cx="37.8" cy="7.2" r="0.85" fill="#82c4d1" />
    </svg>
  );
}
```

- [ ] **Step 2: Trocar PNG no `Header`**

Substituir o `<img src="/brand/simbolo-pincelada.png" …>` por:

```tsx
import { BrandMark } from "@/components/BrandMark";

// ...
<BrandMark className="h-8 w-8 shrink-0 text-white sm:h-9 sm:w-9 md:h-10 md:w-10" />
```

- [ ] **Step 3: Build rápido**

Run: `npm run build`  
Expected: compile OK

- [ ] **Step 4: Commit**

```bash
git add src/components/BrandMark.tsx src/components/Header.tsx
git commit -m "feat(motion): stroke-draw do símbolo no header"
```

---

### Task 6: Hero — reveal tipográfico + parallax

**Files:**
- Create: `src/components/HeroCopy.tsx`
- Create: `src/components/HeroParallaxImage.tsx`
- Modify: `src/components/Hero.tsx`

- [ ] **Step 1: `HeroParallaxImage`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { getPrefersReducedMotion, scrollProgressThrough } from "@/lib/motion";

export function HeroParallaxImage({
  className,
  style,
  maxShift = 36,
}: {
  className?: string;
  style?: React.CSSProperties;
  maxShift?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;
    if (getPrefersReducedMotion()) return;

    let active = false;
    let raf = 0;
    const section = document.getElementById("inicio");

    const apply = () => {
      const el = section ?? wrap;
      const rect = el.getBoundingClientRect();
      const p = scrollProgressThrough(
        rect.top,
        rect.height,
        window.innerHeight || 1,
      );
      img.style.transform = `translate3d(0, ${p * maxShift}px, 0) scale(1.04)`;
    };

    const tick = () => {
      apply();
      if (active) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (active) return;
      active = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      ([e]) => (e?.isIntersecting ? start() : stop()),
      { threshold: [0, 0.01] },
    );
    io.observe(section ?? wrap);
    start();

    return () => {
      stop();
      io.disconnect();
    };
  }, [maxShift]);

  return (
    <div ref={wrapRef} className={className} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src="/media/dr-francisco-retrato-hero6.jpg"
        alt="Dr. Francisco Furtado"
        width={922}
        height={1152}
        decoding="async"
        fetchPriority="high"
        className="h-full w-full origin-center object-cover object-top will-change-transform md:object-contain md:object-right md:object-bottom"
        style={{ transform: "translate3d(0,0,0) scale(1.04)" }}
      />
    </div>
  );
}
```

Nota: no desktop o `object-*` do mobile/desktop difere — passar `imgClassName` separado se necessário ao integrar (duas instâncias: mobile `object-cover object-top`, desktop `object-contain object-right object-bottom` + `alt=""` / `aria-hidden` na decorativa).

- [ ] **Step 2: `HeroCopy` com reveal no mount**

```tsx
"use client";

import { useEffect, useState } from "react";
import { SITE, whatsappUrl } from "@/lib/site";
import { getPrefersReducedMotion } from "@/lib/motion";

export function HeroCopy() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (getPrefersReducedMotion()) {
      setOn(true);
      return;
    }
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const item = (delay: number, className: string, children: React.ReactNode) => (
    <div
      className={`ff-reveal ${on ? "is-inview" : ""} ${className}`}
      style={{ ["--ff-reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </div>
  );

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-28 pb-8 sm:px-5 md:px-6 md:pb-28">
      {item(0, "mb-5 md:mb-8", (
        <div className="h-px w-12 bg-brand-gold md:w-16" aria-hidden />
      ))}
      {item(80, "", (
        <p className="mb-3 text-[0.65rem] tracking-[0.28em] text-brand-gold uppercase sm:mb-5 sm:text-[0.7rem] sm:tracking-[0.35em]">
          {SITE.tagline}
        </p>
      ))}
      {item(160, "", (
        <h1 className="font-display max-w-[14ch] text-[2.75rem] leading-[0.95] text-white sm:max-w-xl sm:text-6xl md:max-w-2xl md:text-7xl lg:text-8xl">
          Francisco Furtado
        </h1>
      ))}
      {item(240, "", (
        <p className="font-serif-body mt-5 max-w-md text-base leading-relaxed text-white/80 sm:mt-8 sm:text-lg md:max-w-lg md:text-xl">
          Transplante capilar seguro, ético e natural — devolver autoestima com
          ciência, arte e cuidado humano em Fortaleza e em todo o Ceará.
        </p>
      ))}
      {item(320, "mt-8 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:items-center", (
        <>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center bg-brand-gold px-8 py-3.5 text-sm font-semibold tracking-wide text-brand-charcoal transition-colors hover:bg-brand-gold-soft"
          >
            Agende sua avaliação
          </a>
          <a
            href="#sobre"
            className="inline-flex min-h-12 items-center justify-center border border-white/30 px-8 py-3.5 text-sm tracking-wide text-white transition-colors hover:border-white hover:bg-white hover:text-black"
          >
            Conhecer o Dr. Francisco
          </a>
        </>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Integrar em `Hero.tsx`**

- Trocar wrappers das duas fotos por `HeroParallaxImage` (manter máscaras no wrapper como hoje).
- Trocar o bloco de texto final por `<HeroCopy />`.
- Mobile: `maxShift={22}`; desktop: `maxShift={36}`.
- Foto desktop: `alt=""`, `aria-hidden` — expor props no parallax component.

- [ ] **Step 4: Build + smoke**

Run: `npm run build`  
Expected: OK  
Run: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/` após `npm run start`  
Expected: `200`

- [ ] **Step 5: Commit**

```bash
git add src/components/HeroParallaxImage.tsx src/components/HeroCopy.tsx src/components/Hero.tsx
git commit -m "feat(motion): reveal e parallax do hero"
```

---

### Task 7: Stagger Ciência · Arte · Cuidado

**Files:**
- Modify: `src/components/HomeSections.tsx` (bloco `#pilares`)

- [ ] **Step 1: Importar `Reveal` e envolver cada item**

No map de Ciência/Arte/Cuidado, trocar o `<div key={item.t}>` por:

```tsx
import { Reveal } from "@/components/Reveal";

// ...
{items.map((item, i) => (
  <Reveal key={item.t} delayMs={i * 120}>
    <h3 className="text-lg font-semibold tracking-wide text-brand-gold">
      {item.t}
    </h3>
    <p className="mt-2 text-sm leading-relaxed text-white/80">{item.d}</p>
  </Reveal>
))}
```

Não mudar `ScrollZoomImage`.

- [ ] **Step 2: Commit**

```bash
git add src/components/HomeSections.tsx
git commit -m "feat(motion): stagger dos pilares Ciência Arte Cuidado"
```

---

### Task 8: `JourneyTrack` (linha dourada M0–M12)

**Files:**
- Create: `src/components/JourneyTrack.tsx`
- Modify: `src/components/HomeSections.tsx` (seção `#jornada`)

- [ ] **Step 1: Criar componente**

```tsx
"use client";

import { useRef } from "react";
import { CHECKPOINTS } from "@/lib/site";
import { useScrollProgress } from "@/hooks/useScrollProgress";

export function JourneyTrack() {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(ref);
  const activeIdx = Math.min(
    CHECKPOINTS.length - 1,
    Math.floor(progress * CHECKPOINTS.length),
  );

  return (
    <div ref={ref} className="mt-10">
      <div
        className="relative mb-8 h-px w-full bg-brand-gray-light"
        aria-hidden
      >
        <div
          className="absolute inset-y-0 left-0 origin-left bg-brand-gold transition-[width] duration-75"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <ol className="grid gap-4 sm:grid-cols-5">
        {CHECKPOINTS.map((cp, i) => {
          const on = i <= activeIdx;
          return (
            <li
              key={cp}
              className={`border px-3 py-4 text-center transition-colors duration-300 ${
                on
                  ? "border-brand-gold text-black"
                  : "border-brand-gray-light text-brand-charcoal"
              }`}
            >
              <span
                className={`block text-xs tracking-[0.2em] uppercase ${
                  on ? "text-brand-gold" : "text-brand-gray"
                }`}
              >
                Checkpoint
              </span>
              <span className="mt-2 block text-xl font-semibold">{cp}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: Em `#jornada`, remover o `<ol>` antigo e usar `<JourneyTrack />`** (manter lista `PHOTO_REGIONS` abaixo).

- [ ] **Step 3: Build**

Run: `npm run build`  
Expected: OK

- [ ] **Step 4: Commit**

```bash
git add src/components/JourneyTrack.tsx src/components/HomeSections.tsx
git commit -m "feat(motion): linha de progresso da jornada M0–M12"
```

---

### Task 9: Verificação final + preview

**Files:** nenhum novo

- [ ] **Step 1: Lint/build**

```bash
npm run build
```

Expected: sucesso sem erros TS

- [ ] **Step 2: Restart produção na `:3000`**

```bash
# matar next-server antigo se necessário, depois:
npm run start
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
```

Expected: `200`

- [ ] **Step 3: Checklist manual no preview**

- Header: símbolo desenha no load
- Hero: texto entra; foto desloca levemente ao rolar
- Pilares: itens escalonados; zoom continua
- Jornada: linha ouro avança; checkpoints ativam
- OS reduced-motion: tudo estático

- [ ] **Step 4: Push + atualizar PR**

```bash
git push -u origin HEAD
```

Atualizar PR via `ManagePullRequest`.

---

## Self-review (plano × spec)

| Spec item | Task |
|-----------|------|
| Hero reveal + parallax | Task 6 |
| Pilares stagger | Task 7 |
| Jornada linha ouro | Task 8 |
| Header stroke | Task 5 |
| Reduced motion | Tasks 1–6, CSS Task 3 |
| Sem deps novas | todas |
| Pacote C adiado | explícito no header |

Sem placeholders TBD. Helpers tipados consistentes (`scrollProgressThrough`, `getPrefersReducedMotion`).

---

## Depois do Pacote A

Abrir spec `docs/superpowers/specs/…-foliculo-3d-design.md` com:

- Modelo GLB de folículo alinhado ao “U” do símbolo
- Lazy R3F só na seção escolhida
- Fallback 2D / reduced-motion
