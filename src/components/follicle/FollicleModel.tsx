"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CatmullRomCurve3,
  DoubleSide,
  MathUtils,
  Vector3,
  type Group,
  type Mesh,
} from "three";

type Props = {
  autoRotate?: boolean;
  /** Quando true (usuário arrastando), pausa a rotação idle. */
  userDragging?: boolean;
};

/**
 * Folículo mais anatômico (procedural):
 * pele → ostium → bainha externa → bainha interna → bulbo + papila → haste curvaba.
 */
export function FollicleModel({
  autoRotate = true,
  userDragging = false,
}: Props) {
  const root = useRef<Group>(null);
  const hair = useRef<Group>(null);
  const softPhase = useRef(0);

  const shaftCurve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, -0.42, 0),
        new Vector3(0.01, -0.05, 0.01),
        new Vector3(0.04, 0.45, -0.01),
        new Vector3(0.1, 0.95, 0.03),
        new Vector3(0.2, 1.45, 0.02),
      ]),
    [],
  );

  const tipCurve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0.2, 1.45, 0.02),
        new Vector3(0.28, 1.7, 0.04),
        new Vector3(0.34, 1.92, 0.01),
      ]),
    [],
  );

  useFrame((_, delta) => {
    if (!root.current) return;

    softPhase.current += delta;

    // Respiração leve no conjunto (escala + tilt)
    const breath = 1 + Math.sin(softPhase.current * 0.7) * 0.012;
    root.current.scale.setScalar(breath);
    root.current.rotation.x = 0.22 + Math.sin(softPhase.current * 0.45) * 0.04;

    if (autoRotate && !userDragging) {
      root.current.rotation.y += delta * 0.12;
    }

    // Balanceio orgânico da haste (fora do folículo)
    if (hair.current) {
      hair.current.rotation.z =
        Math.sin(softPhase.current * 0.9) * 0.045 +
        Math.sin(softPhase.current * 1.7) * 0.015;
      hair.current.rotation.x = Math.sin(softPhase.current * 0.55) * 0.025;
    }
  });

  return (
    <group ref={root} position={[0, -0.35, 0]} rotation={[0.22, 0.55, 0]}>
      {/* —— Pele / dermis —— */}
      <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.45, 64]} />
        <meshStandardMaterial
          color="#b8b6ae"
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>
      {/* Volume subcutâneo */}
      <mesh position={[0, -0.78, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 1.25, 0.35, 48]} />
        <meshStandardMaterial color="#9e9c96" roughness={0.9} metalness={0.03} />
      </mesh>
      {/* Anel do ostium (poro) */}
      <mesh position={[0, -0.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.32, 40]} />
        <meshStandardMaterial color="#8a8680" roughness={0.85} metalness={0.04} />
      </mesh>

      {/* —— Bainha externa (ORS) —— */}
      <mesh position={[0, -0.22, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.34, 0.78, 32, 1, true]} />
        <meshStandardMaterial
          color="#2a3348"
          roughness={0.72}
          metalness={0.06}
          side={DoubleSide}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* —— Bainha interna (IRS), levemente dourada —— */}
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.17, 0.22, 0.72, 28, 1, true]} />
        <meshStandardMaterial
          color="#5c5338"
          roughness={0.55}
          metalness={0.1}
          side={DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* —— Bulbo —— */}
      <mesh position={[0, -0.58, 0]} scale={[1.05, 1.25, 1.05]} castShadow>
        <sphereGeometry args={[0.3, 40, 28]} />
        <meshStandardMaterial
          color="#1a2035"
          roughness={0.48}
          metalness={0.14}
        />
      </mesh>
      {/* Papila dérmica (núcleo vivo) */}
      <mesh position={[0, -0.68, 0]} scale={[1, 0.75, 1]}>
        <sphereGeometry args={[0.12, 24, 16]} />
        <meshStandardMaterial
          color="#b6a46e"
          roughness={0.35}
          metalness={0.2}
          emissive="#b6a46e"
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* Glândula sebácea (sugestão lateral) */}
      <mesh position={[0.38, -0.28, 0.05]} scale={[1.1, 0.75, 0.9]}>
        <sphereGeometry args={[0.14, 20, 14]} />
        <meshStandardMaterial color="#c9c2b0" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* —— Haste do fio (curva) —— */}
      <group ref={hair}>
        <mesh castShadow>
          <tubeGeometry args={[shaftCurve, 72, 0.052, 14, false]} />
          <meshStandardMaterial
            color="#2c2c2c"
            roughness={0.38}
            metalness={0.22}
          />
        </mesh>
        {/* Camada de cutícula brilhante */}
        <mesh>
          <tubeGeometry args={[shaftCurve, 72, 0.058, 14, false]} />
          <meshStandardMaterial
            color="#3a3a3a"
            roughness={0.25}
            metalness={0.35}
            transparent
            opacity={0.35}
          />
        </mesh>
        {/* Ponta com reflexo ouro de marca */}
        <mesh castShadow>
          <tubeGeometry args={[tipCurve, 32, 0.032, 12, false]} />
          <meshStandardMaterial
            color="#b6a46e"
            roughness={0.32}
            metalness={0.28}
          />
        </mesh>
        <HairHighlight curve={shaftCurve} />
      </group>
    </group>
  );
}

/** Filete de luz ao longo do fio — reforça realismo sem glow genérico. */
function HairHighlight({ curve }: { curve: CatmullRomCurve3 }) {
  const mesh = useRef<Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    const mat = mesh.current.material;
    if ("opacity" in mat) {
      mat.opacity = MathUtils.lerp(
        0.12,
        0.28,
        (Math.sin(state.clock.elapsedTime * 1.2) + 1) / 2,
      );
    }
  });

  return (
    <mesh ref={mesh}>
      <tubeGeometry args={[curve, 72, 0.02, 8, false]} />
      <meshStandardMaterial
        color="#dcdfe6"
        roughness={0.15}
        metalness={0.55}
        transparent
        opacity={0.2}
      />
    </mesh>
  );
}
