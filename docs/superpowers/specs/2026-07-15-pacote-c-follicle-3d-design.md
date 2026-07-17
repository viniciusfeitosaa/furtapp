# Pacote C — Folículo 3D (design)

**Data:** 2026-07-15  
**Status:** aprovado (abordagem A + posição em Tratamentos)  
**Branch:** `cursor/hero-final-5-e94e`

## Objetivo

Inserir um **folículo 3D interativo** na seção **Tratamentos** (`#tratamentos`), reforçando o pilar Ciência sem estética genérica de “orbe WebGL”. O modelo ecoa o “U” do símbolo da marca (bulbo + haste).

## Decisões travadas

| Tema | Decisão |
|------|---------|
| Abordagem | **Procedural** (geometria em código) — sem GLB externo |
| Stack | `three` + `@react-three/fiber` + `@react-three/drei` |
| Onde | Dentro de `#tratamentos`, **abaixo** da lista de procedimentos (bloco branco); faixa escura dedicada |
| Interação | Auto-rotação lenta + OrbitControls (drag/touch), sem zoom extremo |
| Carga | Lazy: `next/dynamic` `ssr: false` + montar só quando a faixa entra no viewport |
| Fallback | PNG `/brand/simbolo-pincelada.png` se sem WebGL, erro de load, ou `prefers-reduced-motion` |
| Nav | Sem item novo no menu (permanece sob Tratamentos) |

## Fora de escopo

- Modelo anatômico hiper-realista / GLB comprado
- Particle systems, glow neon, fog pesada
- Pacote B (tilt em cards)
- Alterar hero / pilares / jornada além da integração mínima em `HomeSections`

## Composição visual

```
[Pilares escuro — já existe]
[Tratamentos — fundo branco]
  eyebrow / H2 / parágrafo / lista 3 itens
[Faixa folículo — fundo navy→preto]
  eyebrow "Ciência"
  H2 "Do folículo ao resultado"
  1 frase de apoio
  Canvas 3D (aspect ~ 16/10 mobile, ~ 21/9 desktop) OU fallback img
```

**Cores do modelo (alinhadas à marca):**
- Pele / dermis: linen / mist (`#c1c2bd` → `#dcdfe6`)
- Bulbo: navy profundo (`#1a2035`)
- Haste do fio: charcoal → ouro suave (`#323232` → `#b6a46e`)
- Luz: ambiente suave + key light lateral; sem bloom

**Motion:**
- Idle: `rotation.y += delta * 0.15` (aprox.)
- OrbitControls: enableZoom false, enablePan false, damping
- Reduced motion: não montar Canvas; mostrar fallback estático

## Arquitetura de componentes

```
src/components/follicle/
  FollicleSection.tsx     # shell tipográfico + lazy mount (IntersectionObserver)
  FollicleCanvas.tsx      # "use client" Canvas + lights + controls (dynamic import target)
  FollicleModel.tsx       # meshes procedurais (bulbo, haste, pele)
  FollicleFallback.tsx    # img + texto curto
src/components/HomeSections.tsx  # importa FollicleSection após a lista
```

**Performance:**
- Chunk separado via `dynamic(() => import(...), { ssr: false })`
- Dpr capped `[1, 1.5]`
- Pausar frameloop quando fora da viewport (`frameloop="demand"` + invalidate no rotate, ou desmontar)

## Critérios de aceite

- [ ] Bloco visível em Tratamentos, desktop e mobile
- [ ] Folículo reconhecível (U / bulbo + haste), cores de marca
- [ ] Arraste/rotação funciona; idle subtle
- [ ] Reduced-motion / no-WebGL → fallback PNG
- [ ] Homepage sem regressão de pilares/hero; `npm run build` + `npm run lint` ok
- [ ] First load da home não baixa three.js até aproximar a seção (verificar Network)

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Preview Cursor / GPU fraca | DPR baixo, geometria simples, desmontar fora da view |
| Bundle pesado | dynamic + IO gate |
| Looks genérico | Materiais sóbrios, sem grid/floor infinito, tipografia institucional |
| Hydration / R3F + React 19 | pinned versions compatíveis; ssr:false |
