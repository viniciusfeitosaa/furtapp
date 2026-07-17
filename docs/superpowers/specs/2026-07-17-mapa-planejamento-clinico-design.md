# Design: Mapa de planejamento clínico

**Data:** 2026-07-17  
**Status:** Aprovado  
**Objetivo:** Substituir o boneco 3D na home por um mapa interativo de planejamento (vista superior), com autoridade clínica e diferencial de marca.

## Valor

1. Prova visual de **como se pensa** o plano (doadora × receptora)  
2. Slider Calvo → Máximo como gesto de decisão  
3. Diferencial memorável — prancheta cirúrgica, não cartoon  

## UI — Surgical HUD

- Seção `#0F1115`, crânio `#1E2330`, receptoras ciano `#00D2FF`, doadora âmbar `#b6a46e`
- Vista **axial** anatômica: occipital largo, testa mais estreita, nariz (frente), orelhas translúcidas
- Estética blueprint/HUD (grade, cantos, scanlines leves) — não ilustração terrosa
- Uma composição: título + SVG + leitura lateral + slider
- Sem cards; 3D fora da home

## Zonas (SVG)

| Zona | Papel |
|------|--------|
| Doadora (ferradura) | Sempre visível (cinza/ouro suave) |
| Entradas L/R | Preenchem primeiro no slider |
| Frontal / linha | Depois |
| Médio | Intermediário |
| Coroa | Por último (máximo) |

## Slider

- 0 … 8000 UF (ilustrativo, alinhado ao MAX legado)
- Marcos: Calvo · 1.000 · 5.000 · Máximo
- Disclaimer: simulação ilustrativa; plano real só após avaliação

## Critério de sucesso

Visitante entende em ~5s: de onde sai, para onde vai, e que o slider muda o tamanho do plano. Visual de peça de marca.
