# Design: Vídeo de acompanhamento na seção Resultados

**Data:** 2026-07-17  
**Status:** Aprovado  
**Objetivo:** Substituir o placeholder de `#resultados` por um vídeo real de acompanhamento / trabalho clínico.

## Asset

- Origem: `conteudos-para-o-site/05-videos/AQPn….mp4`
- Destino: `public/media/acompanhamento-paciente.mp4`
- Formato: vertical 720×1280, ~90s, H.264

## UI

- Seção `#resultados`: copy curto + player HTML5 centralizado
- `controls`, `playsInline`, `preload="metadata"`, sem autoplay com som
- Moldura full-bleed do player em fundo escuro suave; sem card genérico
- Nota de consentimento / conteúdo real
- Responsivo: max-height no mobile, centralizado no desktop

## Fora de escopo

- Upload no CMS, múltiplos casos, legendas
