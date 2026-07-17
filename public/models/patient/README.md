# Assets do paciente — Modo A (fotogrametria 3D)

O site tem dois simuladores na seção Planejamento:

- **Foto 2.5D (B)** — já funciona no site (placeholder ilustrado)
- **3D fotogrametria (A)** — ativa com os arquivos abaixo + `enabled: true`

Ative o modo 3D colocando os três arquivos nesta pasta e mudando `manifest.json` → `"enabled": true`.

## Arquivos obrigatórios

| Arquivo | Descrição |
|---------|-----------|
| `head.glb` | Busto raspado (fotogrametria limpa no Blender) |
| `head_color.jpg` | Textura de cor (albedo) com o mesmo UV do GLB |
| `head_density.jpg` | Mapa em tons de cinza, **mesmo tamanho e UV** do albedo |

Opcional: `head_normal.jpg` (se tiver) — referencie em `manifest.json` → `"normal": "head_normal.jpg"`.

## Como pintar o density map

Abra o `head_color.jpg` no Photoshop/GIMP e pinte uma cópia:

- **Preto puro** — rosto, olhos, orelhas, pescoço, nuca baixa (nunca nasce fio)
- **Cinza médio** — couro que já tem cabelo residual no Calvo (ferradura / laterais)
- **Branco puro** — zona de enxerto (entradas / área que o slider preenche)
- Transições suaves (degradê) entre as zonas

Salve como JPEG ou PNG (o código lê luminância do canal R/média).

## Fotogrametria (resumo)

1. 50–100 fotos do paciente raspado, boa luz, ângulos ao redor da cabeça  
2. Meshroom / RealityCapture → malha + textura  
3. Blender: limpar ruído, escala em metros, UV ok, exportar `head.glb`  
4. Extrair/ajustar `head_color.jpg` e criar `head_density.jpg`

## Ativar no site

1. Copie os arquivos para `public/models/patient/`  
2. Em `manifest.json`, mude `"enabled": false` → `"enabled": true`  
3. Rebuild / refresh  

Com `enabled: false`, o simulador usa o modelo legado (Lee Perry-Smith + máscaras matemáticas).

## Limiares (`thresholds`)

```json
"thresholds": {
  "blackMax": 0.12,   // abaixo = sem fio
  "grayPeak": 0.38,   // pico do residual
  "whiteMin": 0.55    // acima = zona do slider (enxertos)
}
```

Ajuste se o mapa estiver muito claro/escuro.
