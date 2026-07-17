# Mapa de planejamento clínico — Implementation Plan

> **For agentic workers:** implement task-by-task. Steps use checkbox syntax.

**Goal:** Substituir `FollicleSection` na home por um mapa SVG interativo de planejamento capilar.

**Architecture:** Dados em `planningMap.ts`; SVG em `ScalpMapSvg`; seção client `PlanningMapSection` com slider; `HomeSections` troca o import.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, SVG inline (sem deps novas).

---

### Task 1: Dados do plano

- Create: `src/lib/planningMap.ts`
- [ ] Constantes MAX_GRAFTS, marcos, pesos por zona, helpers de fill e hint

### Task 2: SVG + seção

- Create: `src/components/planning/ScalpMapSvg.tsx`
- Create: `src/components/planning/PlanningMapSection.tsx`
- [ ] Mapa vista superior com doadora + receptoras e densidade animada

### Task 3: Home

- Modify: `src/components/HomeSections.tsx`
- [ ] Trocar `FollicleSection` por `PlanningMapSection`

### Task 4: Verificar

- [ ] `npm run build`
- [ ] Commit + push + preview
