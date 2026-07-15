"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group } from "three";

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
          side={DoubleSide}
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
