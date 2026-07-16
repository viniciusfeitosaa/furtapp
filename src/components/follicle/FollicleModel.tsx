"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  DynamicDrawUsage,
  MathUtils,
  Matrix4,
  Object3D,
  Vector3,
  type BufferGeometry,
  type Group,
  type InstancedMesh,
  type Mesh,
} from "three";
import { buildHairSites, type HairSite } from "@/components/follicle/hairSites";

export type GraftCount = 0 | 1000 | 5000 | 8000;

const MAX_GRAFTS = 8000;
/** Cabeça inteira no Calvo; só as entradas (têmporas) ficam vazias. */
const RESIDUAL_HAIRS = 25000;
/** Tamanho único padrão dos fios (sem variação). */
const HAIR_LEN = 0.1;
const HAIR_THICK = 0.009;
const HEAD_SCALE = 0.3;
const dummy = new Object3D();
const up = new Vector3(0, 1, 0);
const tmpMat = new Matrix4();

type Props = {
  graftCount: GraftCount;
  autoRotate?: boolean;
  userDragging?: boolean;
};

function useHeadGeometry(): BufferGeometry | null {
  const gltf = useGLTF("/models/head.glb");
  return useMemo(() => {
    let geo: BufferGeometry | null = null;
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && !geo) geo = m.geometry as BufferGeometry;
    });
    return geo;
  }, [gltf]);
}

function writeHair(
  mesh: InstancedMesh,
  site: HairSite,
  grow: number,
  index: number,
) {
  const len = HAIR_LEN * grow;
  const t = HAIR_THICK * Math.max(grow, 0.001);
  dummy.position.copy(site.position);
  dummy.quaternion.setFromUnitVectors(up, site.normal);
  dummy.scale.set(t, len, t);
  dummy.updateMatrix();
  tmpMat.makeTranslation(0, len * 0.5, 0);
  dummy.matrix.multiply(tmpMat);
  mesh.setMatrixAt(index, dummy.matrix);
}

function fillStaticHair(mesh: InstancedMesh | null, sites: HairSite[]) {
  if (!mesh || sites.length === 0) return;
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  for (let i = 0; i < sites.length; i += 1) {
    writeHair(mesh, sites[i]!, 1, i);
  }
  mesh.count = sites.length;
  mesh.instanceMatrix.needsUpdate = true;
}

export function FollicleModel({
  graftCount,
  autoRotate = true,
  userDragging = false,
}: Props) {
  const root = useRef<Group>(null);
  const receptor = useRef<InstancedMesh>(null);
  const residual = useRef<InstancedMesh>(null);
  const phase = useRef(0);
  const displayCount = useRef(0);
  const targetCount = useRef<number>(graftCount);

  const geometry = useHeadGeometry();

  const receptorSites = useMemo(
    () => (geometry ? buildHairSites(geometry, MAX_GRAFTS, "receptor") : []),
    [geometry],
  );
  const residualSites = useMemo(
    () => (geometry ? buildHairSites(geometry, RESIDUAL_HAIRS, "residual") : []),
    [geometry],
  );

  useLayoutEffect(() => {
    targetCount.current = graftCount;
  }, [graftCount]);

  // Cabeça preenchida — zona dos enxertos fica vazia no Calvo
  useLayoutEffect(() => {
    fillStaticHair(residual.current, residualSites);
  }, [residualSites]);

  useLayoutEffect(() => {
    const mesh = receptor.current;
    if (!mesh) return;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    for (let i = 0; i < MAX_GRAFTS; i += 1) {
      dummy.position.set(0, -50, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.count = 0;
    mesh.instanceMatrix.needsUpdate = true;
    displayCount.current = 0;
  }, [receptorSites]);

  useFrame((_, delta) => {
    if (!root.current) return;
    phase.current += delta;
    root.current.rotation.x = 0.02 + Math.sin(phase.current * 0.3) * 0.012;
    if (autoRotate && !userDragging) {
      root.current.rotation.y += delta * 0.075;
    }

    const mesh = receptor.current;
    if (!mesh || receptorSites.length === 0) return;

    displayCount.current = MathUtils.damp(
      displayCount.current,
      targetCount.current,
      3.4,
      delta,
    );
    const visible = Math.round(displayCount.current);
    mesh.count = visible;

    const band = 140;
    const from = Math.max(0, visible - band);
    for (let i = from; i < visible; i += 1) {
      const site = receptorSites[i]!;
      const t = MathUtils.clamp((visible - i) / band, 0, 1);
      const grow = MathUtils.smootherstep(t, 0, 1);
      writeHair(mesh, site, grow, i);
    }
    for (let i = visible; i < Math.min(visible + 40, MAX_GRAFTS); i += 1) {
      dummy.position.set(0, -50, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!geometry) return null;

  return (
    <group
      ref={root}
      scale={HEAD_SCALE}
      position={[0, -0.35, 0]}
      rotation={[0, 0, 0]}
    >
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#d7a487"
          roughness={0.78}
          metalness={0.0}
          clearcoat={0.06}
          clearcoatRoughness={0.6}
          sheen={0.18}
          sheenRoughness={0.6}
          sheenColor="#c9967d"
        />
      </mesh>

      {/* Cabelo em toda a cabeça (exceto zona dos enxertos) */}
      <instancedMesh
        ref={residual}
        args={[undefined, undefined, RESIDUAL_HAIRS]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 0.85, 1, 5]} />
        <meshStandardMaterial color="#2a2724" roughness={0.42} metalness={0.12} />
      </instancedMesh>

      {/* Enxertos: vazios no Calvo → preenchem em 1.000 / 5.000 / Máximo */}
      <instancedMesh
        ref={receptor}
        args={[undefined, undefined, MAX_GRAFTS]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 0.85, 1, 5]} />
        <meshStandardMaterial color="#282523" roughness={0.4} metalness={0.16} />
      </instancedMesh>
    </group>
  );
}

useGLTF.preload("/models/head.glb");
