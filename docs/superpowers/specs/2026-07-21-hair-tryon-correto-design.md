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

### A — SDK B2B de beleza/AR (recomendado para qualidade)

| SDK | Força | Atenção |
|-----|--------|---------|
| **Banuba** Hair Style / Color | Web + mobile, segmentação + estilos | Licença comercial, custo |
| **Perfect Corp** YouCam Hair | Padrão da indústria, IA adaptativa em foto/vídeo | Licença; integração via SDK/API |
| **DeepAR** | Engine tipo Spark/Snap, assets 3D + oclusão | Precisa de hair assets bons + Studio |

**Quando usar:** queremos “parece de verdade” em semanas, não em meses de R&D.

**Recomendação de produto:** **DeepAR** ou **Banuba** para *live* no browser; **Perfect Corp** se aceitarmos fluxo **foto → resultado** (muito comum e às vezes mais convincente que vídeo fraco).

### B — Pipeline open-source / próprio (mais controle, mais risco)

1. **Face Landmarker** (já no repo) → pose / hairline.  
2. **Image Segmenter (Hair)** MediaPipe → máscara de cabelo existente.  
3. Recolor / density tint na máscara (útil, mas **não** troca o corte).  
4. Para *estilo*: assets 3D de cabelo + **mesh oclusora** da cabeça (face mesh invertida / depth) + Three.js — alto esforço de arte e engenharia.

**Quando usar:** orçamento zero de licença e time disposto a iterar visual por meses.

### C — Híbrido (recomendado para este site)

| Fase | Entrega | Tecnologia |
|------|---------|------------|
| **0** | Tirar franja; copy honesta; desligar estilos ruins ou marcar “em reformulação” | Código atual |
| **1** | Prova de pipeline: segmentação de cabelo + recolor/densidade ilustrativa (sem chapéu) | MediaPipe Hair Segmenter |
| **2** | Try-on de **estilos** com qualidade | DeepAR *ou* Banuba Web + 3–5 assets |
| **3** | Ligar estilos à narrativa clínica + WhatsApp (“quero avaliar o estilo X”) | Next.js `/experimente` |

Fase 1 evita mostrar o chapéu; Fase 2 entrega o que o usuário pediu (perucas/estilos de verdade).

---

## 4. Arquitetura alvo (Fase 2 — estilos reais)

```
[/experimente]
   LiveTryOnShell (UI marca, disclaimer, CTA)
        │
        ├─ Camera / PhotoCapture
        │
        └─ HairTryOnEngine (adapter)
               ├─ provider: 'deepar' | 'banuba' | 'mediapipe-segment'
               ├─ loadStyle(styleId)
               └─ render(frame) → canvas/video
```

**Adapter pattern:** a UI do site não fala com o SDK direto. Trocar Banuba↔DeepAR não reescreve a página.

**Estilos (catálogo clínico, sem franja no MVP comercial):**

- Curto  
- Clássico  
- Volumoso  
- Risca lateral  
- Ondulado  

Cada `styleId` mapeia para um **asset** do SDK (não para polígono canvas).

---

## 5. Requisitos não-funcionais

- HTTPS obrigatório (câmera).  
- Lazy-load do SDK (não pesa a home).  
- Fallback se WebGL/câmera falhar → upload de foto (se o SDK permitir).  
- Disclaimer: simulação educativa; resultado real só na avaliação.  
- LGPD: se frames forem a cloud (Perfect Corp cloud), consentimento explícito.

---

## 6. Critérios de aceite (Fase 2)

- [ ] Em vídeo frontal, o cabelo **não** flutua como chapéu ao girar a cabeça ±20°.  
- [ ] Oclusão básica: face/testa não “atravessa” o volume de forma óbvia.  
- [ ] ≥4 estilos selecionáveis sem franja.  
- [ ] 30 fps em desktop médio; ≥15 fps em mobile mid-range.  
- [ ] Nada parece cálculo de UF / promessa cirúrgica.

---

## 7. Fora de escopo (por agora)

- Geração generative “texto → corte”.  
- Medição de UF / mapa clínico no try-on.  
- App nativo iOS/Android (Web primeiro).

---

## 8. Próximo passo

Implementação detalhada em  
`docs/superpowers/plans/2026-07-21-hair-tryon-correto.md`  
começando pela Fase 0 (retirar franja + reformular UX) e Fase 1 (segmentação), com spike de licença DeepAR/Banuba em paralelo.
