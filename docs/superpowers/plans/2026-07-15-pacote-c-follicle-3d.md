# Pacote C — Folículo 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma faixa 3D de folículo procedural na seção Tratamentos, com lazy load, OrbitControls suaves e fallback estático.

**Architecture:** `FollicleSection` controla tipografia + IntersectionObserver; `FollicleCanvas` (dynamic, ssr:false) hospeda R3F; `FollicleModel` é geometria procedural; `FollicleFallback` cobre reduced-motion / WebGL off.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, `three`, `@react-three/fiber`, `@react-three/drei`

**Spec:** `docs/superpowers/specs/2026-07-15-pacote-c-follicle-3d-design.md`

---

## File map

| Arquivo | Papel |
|---------|--------|
| `package.json` | deps three / r3f / drei |
| `src/components/follicle/FollicleFallback.tsx` | fallback 2D |
| `src/components/follicle/FollicleModel.tsx` | meshes procedurais |
| `src/components/follicle/FollicleCanvas.tsx` | Canvas + lights + controls |
| `src/components/follicle/FollicleSection.tsx` | UI + lazy mount |
| `src/components/HomeSections.tsx` | integrar após lista de tratamentos |
| `MAPA DE BORDO.md` | registrar entrega |

---

### Task 1: Instalar dependências

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Instalar**

```bash
cd /workspace
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

- [ ] **Step 2: Confirmar package.json**

`dependencies` deve incluir `three`, `@react-three/fiber`, `@react-three/drei`.  
`devDependencies` deve incluir `@types/three` (se não vier embutido).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: adicionar three + R3F para folículo 3D"
```

---

### Task 2: `FollicleFallback`

**Files:**
- Create: `src/components/follicle/FollicleFallback.tsx`

- [ ] **Step 1: Criar componente**

```tsx
export function FollicleFallback({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-[#0c1018] md:aspect-[21/9] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/simbolo-pincelada.png"
        alt="Símbolo Francisco Furtado — folículo estilizado"
        width={160}
        height={160}
        className="h-28 w-28 opacity-90 sm:h-36 sm:w-36"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/follicle/FollicleFallback.tsx
git commit -m "feat(follicle): fallback 2D estático"
```

---

### Task 3: `FollicleModel` procedural

**Files:**
- Create: `src/components/follicle/FollicleModel.tsx`

- [ ] **Step 1: Implementar malhas**

Grupo vertical alinhado ao “U” da marca: disco de pele, bulbo esférico/óvulo navy, haste alongada charcoal→ouro.

```tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

/** Folículo estilizado (procedural) — bulbo + haste + dermis. */
export function FollicleModel({ autoRotate = true }: { autoRotate?: boolean }) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!autoRotate || !group.current) return;
    group.current.rotation.y += delta * 0.18;
  });

  return (
    <group ref={group} position={[0, -0.15, 0]} rotation={[0.25, 0.4, 0]}>
      {/* Dermis */}
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 48]} />
        <meshStandardMaterial color="#c1c2bd" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[0.55, 0.7, 0.12, 32]} />
        <meshStandardMaterial color="#dcdfe6" roughness={0.8} metalness={0.04} />
      </mesh>

      {/* Canal / U */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.7, 24, 1, true]} />
        <meshStandardMaterial
          color="#1a2035"
          roughness={0.7}
          metalness={0.08}
          side={2}
        />
      </mesh>

      {/* Bulbo */}
      <mesh position={[0, -0.55, 0]} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.32, 32, 24]} />
        <meshStandardMaterial color="#1a2035" roughness={0.55} metalness={0.12} />
      </mesh>

      {/* Haste do fio */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.045, 0.09, 1.5, 16]} />
        <meshStandardMaterial color="#323232" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[0.05, 1.25, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.03, 0.045, 0.55, 12]} />
        <meshStandardMaterial color="#b6a46e" roughness={0.4} metalness={0.25} />
      </mesh>
    </group>
  );
}
```

Use `import { DoubleSide } from "three"` e `side={DoubleSide}` em vez de `side={2}` se preferir clareza.

- [ ] **Step 2: Commit**

```bash
git add src/components/follicle/FollicleModel.tsx
git commit -m "feat(follicle): modelo procedural bulbo+haste"
```

---

### Task 4: `FollicleCanvas`

**Files:**
- Create: `src/components/follicle/FollicleCanvas.tsx`

- [ ] **Step 1: Canvas R3F**

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { FollicleModel } from "@/components/follicle/FollicleModel";

export function FollicleCanvas({ autoRotate = true }: { autoRotate?: boolean }) {
  return (
    <div className="aspect-[16/10] w-full bg-[#0c1018] md:aspect-[21/9]">
      <Canvas
        camera={{ position: [0, 0.4, 3.2], fov: 35 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#0c1018"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 2]} intensity={1.1} color="#f5f2ea" />
        <directionalLight position={[-2, 1, -2]} intensity={0.35} color="#96a4c9" />
        <FollicleModel autoRotate={autoRotate} />
        <ContactShadows
          position={[0, -0.7, 0]}
          opacity={0.35}
          scale={6}
          blur={2.5}
          far={2}
        />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          dampingFactor={0.08}
          enableDamping
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/follicle/FollicleCanvas.tsx
git commit -m "feat(follicle): canvas R3F com luzes e orbit"
```

---

### Task 5: `FollicleSection` (lazy + a11y)

**Files:**
- Create: `src/components/follicle/FollicleSection.tsx`

- [ ] **Step 1: Implementar gate de viewport + dynamic import**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { FollicleFallback } from "@/components/follicle/FollicleFallback";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const FollicleCanvas = dynamic(
  () =>
    import("@/components/follicle/FollicleCanvas").then((m) => m.FollicleCanvas),
  {
    ssr: false,
    loading: () => <FollicleFallback />,
  },
);

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export function FollicleSection() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    setWebgl(canUseWebGL());
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const show3d = inView && webgl && !reduced;

  return (
    <section
      ref={ref}
      id="foliculo"
      className="scroll-mt-24 bg-[#060810] px-4 py-20 text-white md:px-6 md:py-28"
      aria-labelledby="foliculo-title"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-[0.7rem] tracking-[0.3em] text-brand-gold uppercase">
          Ciência
        </p>
        <h2
          id="foliculo-title"
          className="font-display max-w-xl text-[2.15rem] leading-[1.05] sm:text-4xl md:text-5xl"
        >
          Do folículo ao resultado
        </h2>
        <p className="font-serif-body mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          Cada unidade folicular é planejada com critério técnico — densidade,
          direção e naturalidade da linha anterior.
        </p>

        <div className="mt-10 overflow-hidden border border-white/10">
          {show3d ? (
            <FollicleCanvas autoRotate={!reduced} />
          ) : (
            <FollicleFallback />
          )}
        </div>
        <p className="mt-4 text-center text-xs tracking-wide text-white/45">
          {show3d
            ? "Arraste para girar o modelo"
            : "Representação estilizada do folículo"}
        </p>
      </div>
    </section>
  );
}
```

Note: `setWebgl` in useEffect may trip `react-hooks/set-state-in-effect`. Prefer:

```tsx
const [webgl] = useState(() =>
  typeof window === "undefined" ? true : canUseWebGL(),
);
```

Or detect in the IO callback once.

- [ ] **Step 2: Commit**

```bash
git add src/components/follicle/FollicleSection.tsx
git commit -m "feat(follicle): seção lazy com fallback e a11y"
```

---

### Task 6: Integrar em `HomeSections`

**Files:**
- Modify: `src/components/HomeSections.tsx`

- [ ] **Step 1: Import e inserção**

Após o `</div>` do bloco branco de Tratamentos (antes do `</section>` que fecha `#tratamentos`), inserir:

```tsx
import { FollicleSection } from "@/components/follicle/FollicleSection";

// ...
            </ul>
          </div>
        </div>

        <FollicleSection />
      </section>
```

Estrutura final: pilares + (lista tratamentos + FollicleSection) dentro de `#tratamentos`, **ou** FollicleSection como irmão logo após o wrapper branco mas ainda dentro de `#tratamentos`.

Preferência da spec: **dentro** de `#tratamentos`, abaixo da lista.

- [ ] **Step 2: Build + lint**

```bash
npm run lint
npm run build
```

Expected: ambos OK

- [ ] **Step 3: Commit**

```bash
git add src/components/HomeSections.tsx
git commit -m "feat(follicle): integrar faixa 3D em Tratamentos"
```

---

### Task 7: Verificação + docs

**Files:**
- Modify: `MAPA DE BORDO.md` (registrar em Feito / Pendente conforme estrutura do arquivo)

- [ ] **Step 1: Smoke preview**

```bash
npm run start
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
```

Expected: `200`. Manual: rolar até Tratamentos → modelo aparece; arrastar; reduced-motion mostra PNG.

- [ ] **Step 2: Atualizar MAPA DE BORDO**

Registrar: Pacote C folículo 3D em Tratamentos entregue; deps three/R3F.

- [ ] **Step 3: Push + PR**

```bash
git add MAPA DE BORDO.md
git commit -m "docs: registrar Pacote C folículo 3D no mapa de bordo"
git push -u origin cursor/hero-final-5-e94e
```

Atualizar PR via ManagePullRequest.

---

## Self-review (plano × spec)

| Spec | Task |
|------|------|
| Procedural mesh | Task 3 |
| R3F canvas + orbit | Task 4 |
| Em Tratamentos | Task 6 |
| Lazy + fallback | Tasks 2, 5 |
| Marca colors | Task 3–4 |
| Lint/build | Tasks 6–7 |

Sem placeholders TBD. Versões de pacote: instalar latest compatível com React 19 no momento da Task 1; se R3F falhar peer deps, pin versão documentada no commit message.
