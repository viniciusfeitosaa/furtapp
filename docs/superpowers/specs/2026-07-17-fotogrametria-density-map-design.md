# Design: Simulador capilar por fotogrametria + density map UV

**Data:** 2026-07-17  
**Status:** Aprovado (opção A — pipeline de código + pasta de assets)  
**Contexto:** Substituir heurísticas matemáticas (orelha/pescoço/calvície) por mapas UV derivados da foto real.

## Problema

As máscaras em `hairSites.ts` tentam adivinhar anatomia na malha Lee Perry-Smith. Falham em orelha, bochecha, costeleta e abaixo da orelha — e não representam o paciente real.

## Solução

1. **Asset:** busto raspado por fotogrametria (`head.glb`) + albedo real (`head_color.jpg`) + mapa de densidade em tons de cinza (`head_density.jpg`), mesmo UV.
2. **Runtime:** amostrar a superfície; ler o texel da density pelo UV; plantar fios só onde o mapa permitir.
3. **Fallback:** se `manifest.json` não estiver `enabled`, manter o pipeline legado (máscaras atuais).

## Convenção do density map

| Valor | Aparência | Comportamento |
|-------|-----------|---------------|
| Preto (~0) | Rosto, orelha, pescoço, nuca baixa | Nunca nasce fio |
| Cinza (~0.2–0.55) | Couro residual / transição rala | Fios residual (Calvo já preenchido) |
| Branco (~0.55–1) | Zona de enxerto (entradas/coroa) | Vazio no Calvo; slider preenche |

Limiares configuráveis em `public/models/patient/manifest.json`.

## Slider Calvo → Máximo

- `graftCount / MAX_GRAFTS` = fração da zona branca preenchida.
- Ordenação dos sítios receptor: da linha anterior para trás (como hoje).

## Arquivos

```
public/models/patient/
  README.md              # passos Meshroom/Blender/Photoshop
  manifest.json          # enabled + limiares + nomes dos arquivos
  head.glb               # (você fornece)
  head_color.jpg         # (você fornece)
  head_density.jpg       # (você fornece)

src/components/follicle/
  follicleConfig.ts      # lê manifest / decide modo
  densityMap.ts          # carrega ImageData + sample(u,v)
  hairSitesDensity.ts    # buildHairSites via UV density
  FollicleModel.tsx      # usa modo photo ou legacy
```

## Demo assets (sem fotogrametria real)

Enquanto não houver scan do paciente, `scripts/bake-patient-density.mjs` gera um pacote demo em `public/models/patient/` (GLB/albedo/normal da Lee Perry-Smith + density bake UV) com `enabled: true`, para validar o pipeline A.

## Fora de escopo (esta entrega)

- Fotogrametria real do paciente.
- Multi-paciente / upload no portal (fase seguinte).

## Critérios de sucesso

- Com `enabled: false`: site continua igual (legado).
- Com assets + `enabled: true`: sem fios em preto; residual no cinza; slider só no branco; pele usa `head_color.jpg`.
- README da pasta patient explica exatamente o que dropar e como ativar.
