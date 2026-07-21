# Experimente ao vivo — Hair Try-On correto (design)

**Data:** 2026-07-21  
**Status:** diagnóstico + decisão de arquitetura (substituir overlay “chapéu”)  
**Contexto:** o MVP com silhueta 2D ancorada em Face Landmarker ficou com aspecto de peruca/chapéu rígido. Isso é esperado: cabelo não é objeto rígido como óculos.

---

## 1. Por que o MVP falhou visualmente

| Óculos (Ray-Ban) | Cabelo |
|------------------|--------|
| Rígido, poucos pontos de ancoragem | Deformável, milhares de fios |
| Só precisa de pose da cabeça | Precisa de **oclusão** (cabelo atrás da orelha/face some) |
| Mesh 3D “cola” no nariz/olhos | Precisa seguir o **formato do crânio** + hairline |
| Opacidade total | Precisa **alpha** por fio / volume |

O MediaPipe Face Landmarker sozinho resolve pose facial — **não** resolve segmentação de cabelo, oclusão de cabeça nem assets de estilo. Desenhar um polígono acima da linha anterior gera exatamente o “chapéu de papelão”.

**Decisão:** abandonar `drawWig` como solução de produto. Manter `/experimente` como rota, com pipeline novo.

**UI imediata:** retirar o estilo **Com franja** (pior leitura clínica + reforça o artefato).

---

## 2. Objetivos do produto (clínica)

1. Visitante vê **estilo/volume capilar** no próprio rosto (foto ou vídeo), sem parecer filtro amador.
2. Continuar **educativo** (não prometer resultado cirúrgico).
3. CTA claro → WhatsApp / avaliação.
4. Preferência: rodar na **Web** (Next.js atual), mobile-first.
5. Privacidade: idealmente processamento no cliente ou política clara se houver cloud AI.

---

## 3. Três caminhos viáveis

### A — SDK B2B de beleza/AR (pago)

| SDK | Força | Atenção |
|-----|--------|---------|
| **Banuba** Hair Style / Color | Web + mobile, estilos | Licença comercial |
| **Perfect Corp** YouCam Hair | Foto/vídeo de marca | Licença |
| **DeepAR** | Face filters | Hair no Web indisponível (só iOS) |

### A2 — Open source / grátis (escolhido)

| Stack | Força | Limite |
|-------|--------|--------|
| **MediaPipe Hair Segmenter** | Apache 2.0, Web, on-device, sem token | Recolor/densidade do cabelo existente — **não** troca o corte 3D |

**Escolha (2026-07-21):** MediaPipe gratuito. Banuba foi removido do produto para evitar licença. Cortes AR “de verdade” exigem SDK pago; não há equivalente OSS maduro no browser.

Detalhes: `docs/superpowers/specs/2026-07-21-hair-tryon-fase2-spike.md`

### B — Pipeline open-source / próprio (mais controle, mais risco)

1. **Face Landmarker** (já no repo) → pose / hairline.  
2. **Image Segmenter (Hair)** MediaPipe → máscara de cabelo existente.  
3. Recolor / density tint na máscara (útil, mas **não** troca o corte).  
4. Para *estilo*: assets 3D de cabelo + **mesh oclusora** da cabeça (face mesh invertida / depth) + Three.js — alto esforço de arte e engenharia.

**Quando usar:** orçamento zero de licença e time disposto a iterar visual por meses.

### C — Híbrido (recomendado para este site)

| Fase | Entrega | Tecnologia |
|------|---------|------------|
| **0** | Tirar franja; copy honesta | Código atual |
| **1** | Segmentação + recolor/densidade (grátis) | MediaPipe Hair Segmenter |
| **2** | ~~Banuba estilos~~ → **cancelada**; MediaPipe é o provider definitivo | OSS |
| **3** | ~~CTA home~~ — cancelada | — |

Fase 1 é o produto: sem chapéu, sem licença.

---

## 4. Arquitetura (MediaPipe)

```
[/experimente]
   LiveTryOn
        │
        ├─ useCamera (getUserMedia)
        │
        └─ HairTryOnEngine → mediapipeHairSegment
               ├─ ImageSegmenter (hair)
               └─ tint soft-light nos pixels de cabelo
```

**Looks:** Natural, Castanho, Escuro, Densidade, Quente — reforço de tom, não asset 3D.

---

## 5. Requisitos não-funcionais

- HTTPS obrigatório (câmera).  
- Lazy-load do SDK (não pesa a home).  
- Fallback se WebGL/câmera falhar → upload de foto (se o SDK permitir).  
- Disclaimer: simulação educativa; resultado real só na avaliação.  
- LGPD: se frames forem a cloud (Perfect Corp cloud), consentimento explícito.

---

## 6. Critérios de aceite

- [x] Sem chapéu/peruca flutuante — só tint na máscara de cabelo.  
- [x] ≥4 looks selecionáveis.  
- [ ] 30 fps desktop / ≥15 fps mobile (teste manual).  
- [x] Sem UF / promessa cirúrgica.  
- [x] Sem dependência de SDK pago.

---

## 7. Fora de escopo (por agora)

- Geração generative “texto → corte”.  
- Medição de UF / mapa clínico no try-on.  
- App nativo iOS/Android (Web primeiro).

---

## 8. Próximo passo

Implementação em `docs/superpowers/plans/2026-07-21-hair-tryon-correto.md`.  
Provider definitivo: MediaPipe (grátis).
