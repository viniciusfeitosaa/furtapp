# Spike Fase 2 — Provider de hair try-on (Web)

**Data:** 2026-07-21  
**Decisão:** **Banuba WebAR** como provider oficial da Fase 2.

---

## Checklist comercial

| Critério | DeepAR | Banuba |
|----------|--------|--------|
| Hair no **browser** | ❌ Hair segmentation só **iOS** (2026) | ✅ WebAR + módulo `hair` |
| Hair **color** live | Limitado / iOS | ✅ Makeup/Beauty `Hair.color()` |
| Hair **style / wig** | Assets Studio; hair Web fraco | ✅ Produto Virtual Hairstyle / Wig (licença) |
| On-device (LGPD) | Sim (Web SDK) | Sim (WebAR no cliente) |
| Watermark trial | Sim (plano freemium) | Sim (token trial) |
| iOS Safari / WebGL2 | Sim | Sim (WebGL 2.0+) |
| Trial | Conta DeepAR | Formulário banuba.com / info@banuba.com |

**Por que não DeepAR:** o site é Web-first; hair segmentation DeepAR não está disponível no Web SDK.

**Perfect Corp:** reservado se aceitarmos fluxo foto→resultado em vez de vídeo ao vivo.

---

## Escopo técnico deste PR

1. Feature flag `NEXT_PUBLIC_HAIR_TRYON_PROVIDER` (`auto` | `segment-tint` | `banuba`).
2. Adapter `createBanubaHairEngine` (lazy CDN `@banuba/webar`).
3. Sem token → fallback automático para MediaPipe (Fase 1).
4. Com token + Makeup effect → hair color comercial (qualidade Banuba).
5. Com `NEXT_PUBLIC_BANUBA_STYLES_BASE` → troca de effect `.zip` por estilo clínico (curto, clássico…).

## Ação humana pendente

1. Solicitar **trial client token** em [banuba.com](https://www.banuba.com/face-filters-sdk) ou `info@banuba.com`.
2. Pedir trial / quote de **Virtual Hairstyle** (4–5 assets masculinos, sem franja).
3. Colocar token em `.env.local` (nunca commitar).
