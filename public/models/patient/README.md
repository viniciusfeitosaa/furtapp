# Assets do paciente — Modo A (fotogrametria 3D)

## Estado atual (demo)

Esta pasta já contém um **pacote demo** gerado a partir da cabeça Lee Perry-Smith do site:

| Arquivo | Origem |
|---------|--------|
| `head.glb` | cópia de `/models/head.glb` |
| `head_color.jpg` | cópia do albedo legado |
| `head_normal.jpg` | cópia do normal legado |
| `head_density.jpg` | bake UV (preto / cinza / branco) via `scripts/bake-patient-density.mjs` |
| `manifest.json` | `"enabled": true` |

**Não é fotogrametria de paciente real** — serve para validar o pipeline A no site. Quando tiver o material do paciente, substitua os quatro arquivos e mantenha `enabled: true`.

Regenerar o demo:

```bash
node scripts/bake-patient-density.mjs
```

## Arquivos obrigatórios (paciente real)

| Arquivo | Descrição |
|---------|-----------|
| `head.glb` | Busto raspado (fotogrametria limpa no Blender) |
| `head_color.jpg` | Textura de cor (albedo) com o mesmo UV do GLB |
| `head_density.jpg` | Mapa em tons de cinza, **mesmo tamanho e UV** do albedo |

Opcional: `head_normal.jpg` — referencie em `manifest.json` → `"normal": "head_normal.jpg"`.

## Como pintar o density map

Abra o `head_color.jpg` no Photoshop/GIMP e pinte uma cópia:

- **Preto puro** — rosto, olhos, orelhas, pescoço, nuca baixa (nunca nasce fio)
- **Cinza médio** — couro que já tem cabelo residual no Calvo (ferradura / laterais)
- **Branco puro** — zona de enxerto (entradas / área que o slider preenche)
- Transições suaves (degradê) entre as zonas

## Fotogrametria (resumo)

1. 50–100 fotos do paciente raspado, boa luz, ângulos ao redor da cabeça  
2. Meshroom / RealityCapture → malha + textura  
3. Blender: limpar ruído, escala em metros, UV ok, exportar `head.glb`  
4. Extrair/ajustar `head_color.jpg` e criar `head_density.jpg`

## Limiares (`thresholds`)

```json
"thresholds": {
  "blackMax": 0.12,
  "grayPeak": 0.38,
  "whiteMin": 0.55
}
```

Ajuste se o mapa estiver muito claro/escuro.
