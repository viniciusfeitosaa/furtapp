# Design: Simulador A (fotogrametria 3D) + B (foto 2.5D)

**Data:** 2026-07-17  
**Status:** B rejeitado — removido do site  
**Atualização:** O modo Foto 2.5D foi retirado após feedback. O modo A (3D + density map) permanece. Próxima solução a definir em nova spec.

## O que ficou

- **Modo A** — pipeline 3D + assets demo em `public/models/patient/` (`enabled: true`)
- Seção da home: `FollicleSection` (slider + canvas 3D)

## O que saiu

- Abas A/B, `PlanningSection`, `PhotoPlannerCanvas`, `photoDensity`
