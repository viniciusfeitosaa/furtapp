# Experimente ao vivo — design MVP

**Data:** 2026-07-21  
**Branch:** `cursor/experimente-ao-vivo-e94e`

## Objetivo

Área “Experimente ao vivo” (inspirada no try-on da Ray-Ban): o visitante abre a câmera frontal e vê, em tempo real, um preenchimento ilustrativo de densidade capilar na região do couro/frente — sem número absoluto de enxertos.

## Princípios

- 100% no navegador (`getUserMedia` + MediaPipe). Nada é enviado ao servidor.
- Escala **0–100% densidade ilustrativa** (mesma linguagem do mapa de planejamento).
- Não é prognóstico médico; CTA leva à avaliação WhatsApp.
- Rota própria `/experimente` para não pesar o bundle da home.

## Arquitetura

1. `navigator.mediaDevices.getUserMedia` → vídeo espelhado.
2. `@mediapipe/tasks-vision` Face Landmarker (modo VIDEO) → malha facial.
3. Canvas sobre o vídeo: máscara suave + traços de “fio” na zona frontal/vértex, intensidade = slider.
4. Fallback: se câmera negada, mensagem clara + CTA WhatsApp / voltar ao mapa.

## UI

- Página full-bleed escura (marca).
- Botão “Ativar câmera”.
- Slider densidade ilustrativa.
- Disclaimer LGPD / educativo.
- Link no menu: **Experimente**.

## Fora do MVP (próximas iterações)

- Segmentação de cabelo (Image Segmenter).
- Estilos de linha anterior / coroa separados.
- Selfie com foto estática.
- Integração 3D Three.js com matriz facial.
