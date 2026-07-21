# Spike — Provider free/OSS (substitui Banuba)

**Data:** 2026-07-21  
**Decisão:** **MediaPipe Hair Segmenter** (`@mediapipe/tasks-vision`, Apache 2.0).

---

## Por que não Banuba / DeepAR

| SDK | Custo | Hair no Web |
|-----|--------|-------------|
| Banuba | Trial + licença comercial | Sim, mas pago |
| DeepAR | Freemium; hair só iOS | ❌ Web |
| **MediaPipe** | **Grátis / OSS** | ✅ segmentação + recolor |

Cortes 3D realistas (peruca AR) **não existem de graça** com qualidade comercial no browser. O caminho gratuito honesto é reforçar o cabelo detectado (tom/densidade), sem chapéu flutuante.

---

## Stack em produção

- `@mediapipe/tasks-vision` + modelo `hair_segmenter` (float32, CDN Google)
- Tint soft-light + overlay só na máscara de confiança
- Presets: Natural, Castanho, Escuro, Densidade, Quente
- 100% on-device (LGPD-friendly)

Banuba removido do código e das env vars.
