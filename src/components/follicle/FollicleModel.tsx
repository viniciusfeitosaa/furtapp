"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  DoubleSide,
  DynamicDrawUsage,
  MathUtils,
  Matrix4,
  Object3D,
  Quaternion,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
} from "three";
import {
  createScalpTextures,
  disposeScalpTextures,
  type ScalpTextures,
} from "@/components/follicle/scalpTextures";

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

function buildScalpSites(count: number): ScalpSite[] {
  const sites: ScalpSite[] = [];
  const radius = 1.02;
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i += 1) {
    const yi = 1 - (i + 0.5) / count;
    const y = 0.35 + yi * 0.65;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    let x = Math.cos(theta) * radiusAtY;
    let z = Math.sin(theta) * radiusAtY;
    z -= 0.18 * (1 - y);
    const len = Math.hypot(x, y, z) || 1;
    x = (x / len) * radius;
    const yy = (y / len) * radius;
    z = (z / len) * radius;
    const normal = new Vector3(x, yy, z).normalize();
    const quaternion = new Quaternion().setFromUnitVectors(up, normal);
    const hash = (i * 2654435761) % 1000;
    sites.push({
      position: new Vector3(x, yy, z),
      quaternion,
      length: 0.045 + (hash % 40) * 0.001,
      thick: 0.0055 + (hash % 20) * 0.0002,
    });
  }
  return sites;
}

function SkinMaterial({
  textures,
  color = "#e0a899",
}: {
  textures?: ScalpTextures;
  color?: string;
}) {
  return (
    <meshPhysicalMaterial
      map={textures?.albedo}
      roughnessMap={textures?.roughness}
      normalMap={textures?.normal}
      normalScale={textures ? [0.4, 0.4] : undefined}
      color={color}
      roughness={0.58}
      metalness={0.02}
      clearcoat={0.14}
      clearcoatRoughness={0.5}
      sheen={0.4}
      sheenRoughness={0.4}
      sheenColor="#c4876e"
      // SSS leve (sem parecer vidro)
      transmission={0.06}
      thickness={0.7}
      attenuationColor="#b84a3a"
      attenuationDistance={0.55}
      ior={1.4}
    />
  );
}

function HeadBust({ textures }: { textures: ScalpTextures }) {
  return (
    <group>
      <mesh castShadow receiveShadow scale={[0.92, 1.08, 1.0]} position={[0, 0.05, 0]}>
        <sphereGeometry args={[1, 72, 56]} />
        <SkinMaterial textures={textures} />
      </mesh>

      <mesh castShadow position={[0, -0.55, 0.12]} scale={[0.72, 0.45, 0.7]}>
        <sphereGeometry args={[0.85, 40, 28]} />
        <SkinMaterial color="#d4a089" />
      </mesh>

      <mesh
        castShadow
        position={[0, -0.05, 0.88]}
        rotation={[0.35, 0, 0]}
        scale={[0.22, 0.35, 0.4]}
      >
        <sphereGeometry args={[0.5, 24, 16]} />
        <meshPhysicalMaterial
          color="#d2a08c"
          roughness={0.45}
          metalness={0.02}
          clearcoat={0.18}
          sheen={0.3}
          sheenColor="#c4876e"
        />
      </mesh>

      {([-1, 1] as const).map((side) => (
        <mesh
          key={side}
          castShadow
          position={[side * 0.92, -0.08, 0.05]}
          rotation={[0.15, side * 0.35, side * 0.2]}
          scale={[0.18, 0.35, 0.12]}
        >
          <sphereGeometry args={[1, 20, 14]} />
          <meshPhysicalMaterial
            color="#d4a089"
            roughness={0.55}
            metalness={0.02}
            transmission={0.1}
            thickness={0.9}
            attenuationColor="#b84a3a"
            attenuationDistance={0.35}
            side={DoubleSide}
          />
        </mesh>
      ))}

      <mesh castShadow position={[0, -1.05, 0.08]} scale={[1, 1, 0.95]}>
        <cylinderGeometry args={[0.34, 0.42, 0.7, 36]} />
        <meshPhysicalMaterial
          color="#c99a82"
          roughness={0.65}
          metalness={0.02}
          clearcoat={0.06}
          sheen={0.2}
          sheenColor="#c4876e"
        />
      </mesh>

      {/* Sombra de cabelo raspado (área doadora) */}
      <mesh scale={[0.925, 1.085, 1.005]} position={[0, 0.05, 0]}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial
          map={textures.donorShadow}
          transparent
          opacity={0.7}
          depthWrite={false}
          roughness={0.92}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

export function FollicleModel({
  graftCount,
  autoRotate = true,
  userDragging = false,
}: Props) {
  const root = useRef<Group>(null);
  const grafts = useRef<InstancedMesh>(null);
  const marksRef = useRef<Mesh>(null);
  const phase = useRef(0);
  const displayCount = useRef(0);
  const targetCount = useRef<number>(graftCount);
  const surgicalOpacity = useRef(0);
  const tmpMat = useMemo(() => new Matrix4(), []);
  const sites = useMemo(() => buildScalpSites(MAX_GRAFTS), []);
  const textures = useMemo(() => createScalpTextures(), []);

  useLayoutEffect(() => () => disposeScalpTextures(textures), [textures]);
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
    root.current.rotation.x = 0.06 + Math.sin(phase.current * 0.3) * 0.015;
    if (autoRotate && !userDragging) {
      root.current.rotation.y += delta * 0.08;
    }

    surgicalOpacity.current = MathUtils.damp(
      surgicalOpacity.current,
      graftCount > 0 ? 0.88 : 0,
      3.2,
      delta,
    );
    const marks = marksRef.current;
    if (marks && marks.material && "opacity" in marks.material) {
      marks.material.opacity = surgicalOpacity.current;
      marks.visible = surgicalOpacity.current > 0.02;
    }

    const mesh = grafts.current;
    if (!mesh) return;

    displayCount.current = MathUtils.damp(
      displayCount.current,
      targetCount.current,
      3.5,
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
    <group ref={root} position={[0, -0.1, 0]} scale={0.95}>
      <HeadBust textures={textures} />

      <mesh
        ref={marksRef}
        scale={[0.928, 1.088, 1.008]}
        position={[0, 0.05, 0]}
        visible={false}
      >
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial
          map={textures.surgical}
          transparent
          opacity={0}
          depthWrite={false}
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      <instancedMesh
        ref={grafts}
        args={[undefined, undefined, MAX_GRAFTS]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 0.75, 1, 5]} />
        <meshStandardMaterial
          color="#1f1f1f"
          roughness={0.38}
          metalness={0.2}
        />
      </instancedMesh>
    </group>
  );
}
