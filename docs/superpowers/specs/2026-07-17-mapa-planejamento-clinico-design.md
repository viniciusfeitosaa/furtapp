# Design: Mapa de planejamento clínico

**Data:** 2026-07-17  
**Status:** Aprovado  
**Objetivo:** Substituir o boneco 3D na home por um mapa interativo de planejamento (vista superior), com autoridade clínica e diferencial de marca.

## Valor

1. Prova visual de **como se pensa** o plano (doadora × receptora)  
2. Slider Calvo → Máximo como gesto de decisão  
3. Diferencial memorável — prancheta cirúrgica, não cartoon  

## UI

- Seção escura `#060810`, tipografia da marca, ouro `#b6a46e`
- Uma composição: título + SVG do couro + leitura lateral + slider
- Sem cards; sem 2.5D; 3D sai da home (código follicle permanece no repo)

## Zonas (SVG)

| Zona | Papel |
|------|--------|
| Doadora (ferradura) | Sempre visível (cinza/ouro suave) |
| Entradas L/R | Preenchem primeiro no slider |
| Frontal / linha | Depois |
| Médio | Intermediário |
| Coroa | Por último (máximo) |

## Slider

- Escala ilustrativa 0–100% (sem quantidade absoluta de UF)
- Cascata de zonas: entradas → frontal → médio → coroa
- Disclaimer: volume real é individual, definido na avaliação
- Marcos: Calvo · 1.000 · 5.000 · Máximo
- Disclaimer: simulação ilustrativa; plano real só após avaliação

## Critério de sucesso

Visitante entende em ~5s: de onde sai, para onde vai, e que o slider muda o tamanho do plano. Visual de peça de marca.
