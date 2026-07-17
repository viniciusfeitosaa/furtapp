# Design: Simulador A (fotogrametria 3D) + B (foto 2.5D)

**Data:** 2026-07-17  
**Status:** Aprovado para implementação  
**Objetivo:** Manter o valor de planejamento do “boneco” com dois caminhos — um realista (A) e um entregável já (B).

## Valor comum (o que o boneco entregava)

1. Prova visual de densidade  
2. Ferramenta de decisão (slider)  
3. Diferencial memorável no site  

## Modo A — Fotogrametria 3D

- Assets em `public/models/patient/` (`head.glb`, `head_color.jpg`, `head_density.jpg`)
- `manifest.json` → `enabled: true`
- Pipeline já existente em `FollicleModel` + `hairSitesDensity`
- Ativa quando os arquivos chegarem; até lá fica off

## Modo B — Foto 2.5D (protótipo agora)

- Foto/ilustração frontal do couro (placeholder até foto real)
- Density map 2D (mesmo conceito: preto / cinza / branco)
- Slider preenche a zona branca com “fios” desenhados sobre a foto
- Sem malha, sem orelha 3D — entrega rápida do mesmo gesto de planejamento

## UI

Seção de planejamento com abas:

- **Foto (2.5D)** — padrão enquanto A não está enabled  
- **3D (fotogrametria)** — usa o pipeline A; se `enabled: false`, mostra estado “aguardando assets”

## Convenção do density map (A e B)

| Valor | Significado |
|-------|-------------|
| Preto | Sem fio (rosto, orelha, pescoço) |
| Cinza | Residual no Calvo |
| Branco | Zona de enxerto (slider) |

## Critérios de sucesso

- B utilizável hoje no site com placeholder  
- A liga só com `enabled: true` + arquivos  
- Mesmo copy de transparência (“simulação ilustrativa”)  
