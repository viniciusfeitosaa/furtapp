"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  DynamicDrawUsage,
  MathUtils,
  Matrix4,
  Object3D,
  Quaternion,
  Vector3,
  type Group,
  type InstancedMesh,
} from "three";

export type GraftCount = 0 | 1000 | 5000 | 8000;

const MAX_GRAFTS = 8000;
const dummy = new Object3D();
const up = new Vector3(0, 1, 0);

type ScalpSite = {
  position: Vector3;
  quaternion: Quaternion;
  length: number;
  thick: number;
};

type Props = {
  graftCount: GraftCount;
  autoRotate?: boolean;
  userDragging?: boolean;
};

/** Amostras no couro cabeludo (topo + frente), Fibonacci. */
function buildScalpSites(count: number): ScalpSite[] {
  const sites: ScalpSite[] = [];
  const radius = 1.015;
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let accepted = 0; accepted < count; accepted += 1) {
    const yi = 1 - (accepted + 0.5) / count;
    const y = 0.18 + yi * 0.82;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * accepted;
    let x = Math.cos(theta) * radiusAtY;
    let z = Math.sin(theta) * radiusAtY;
    z -= 0.12 * (1 - y);
    const len = Math.hypot(x, y, z) || 1;
    x = (x / len) * radius;
    const yy = (y / len) * radius;
    z = (z / len) * radius;

    const normal = new Vector3(x, yy, z).normalize();
    const quaternion = new Quaternion().setFromUnitVectors(up, normal);
    const hash = (accepted * 2654435761) % 1000;
    sites.push({
      position: new Vector3(x, yy, z),
      quaternion,
      length: 0.055 + (hash % 40) * 0.0012,
      thick: 0.007 + (hash % 20) * 0.00025,
    });
  }
  return sites;
}

/**
 * Cabeça calva + densidade de enxertos (instanced).
 * Foco: crânio; folículos exemplificam o planejamento.
 */
export function FollicleModel({
  graftCount,
  autoRotate = true,
  userDragging = false,
}: Props) {
  const root = useRef<Group>(null);
  const grafts = useRef<InstancedMesh>(null);
  const phase = useRef(0);
  const displayCount = useRef(0);
  const targetCount = useRef<number>(graftCount);
  const tmpMat = useMemo(() => new Matrix4(), []);

  const sites = useMemo(() => buildScalpSites(MAX_GRAFTS), []);

  useLayoutEffect(() => {
    targetCount.current = graftCount;
  }, [graftCount]);

  useLayoutEffect(() => {
    const mesh = grafts.current;
    if (!mesh) return;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    for (let i = 0; i < MAX_GRAFTS; i += 1) {
      dummy.position.set(0, -20, 0);
      dummy.scale.set(0, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.count = 0;
    mesh.instanceMatrix.needsUpdate = true;
    displayCount.current = 0;
  }, []);

  useFrame((_, delta) => {
    if (!root.current) return;
    phase.current += delta;

    root.current.rotation.x = 0.12 + Math.sin(phase.current * 0.35) * 0.02;
    if (autoRotate && !userDragging) {
      root.current.rotation.y += delta * 0.1;
    }

    const mesh = grafts.current;
    if (!mesh) return;

    displayCount.current = MathUtils.damp(
      displayCount.current,
      targetCount.current,
      3.8,
      delta,
    );
    const visible = Math.round(displayCount.current);
    mesh.count = visible;

    const band = 120;
    const from = Math.max(0, visible - band);
    for (let i = from; i < visible; i += 1) {
      const site = sites[i]!;
      const t = MathUtils.clamp((visible - i) / band, 0, 1);
      const grow = MathUtils.smootherstep(t, 0, 1);
      const len = site.length * grow;
      const thick = site.thick * Math.max(grow, 0.001);

      dummy.position.copy(site.position);
      dummy.quaternion.copy(site.quaternion);
      dummy.scale.set(thick, len, thick);
      dummy.updateMatrix();
      // Push half-length along hair axis (local Y)
      tmpMat.makeTranslation(0, len * 0.5, 0);
      dummy.matrix.multiply(tmpMat);
      mesh.setMatrixAt(i, dummy.matrix);
    }

    for (let i = visible; i < Math.min(visible + 40, MAX_GRAFTS); i += 1) {
      dummy.position.set(0, -20, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={root} position={[0, -0.05, 0]}>
      {/* Crânio */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial
          color="#c4b8a8"
          roughness={0.78}
          metalness={0.04}
        />
      </mesh>
      {/* Couro no topo */}
      <mesh>
        <sphereGeometry args={[1.002, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
        <meshStandardMaterial
          color="#b5a494"
          roughness={0.84}
          metalness={0.03}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* Pescoço */}
      <mesh position={[0, -0.98, 0.06]} castShadow>
        <cylinderGeometry args={[0.36, 0.46, 0.55, 32]} />
        <meshStandardMaterial color="#b8ab9c" roughness={0.8} metalness={0.03} />
      </mesh>

      <instancedMesh
        ref={grafts}
        args={[undefined, undefined, MAX_GRAFTS]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 0.85, 1, 5]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={0.42}
          metalness={0.16}
        />
      </instancedMesh>
    </group>
  );
}
