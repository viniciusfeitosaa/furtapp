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
/** Área do topo/frontal coberta até a densidade 5.000 — já visível no “Antes”. */
const THINNING_HAIRS = 5000;
const RESIDUAL_HAIRS = 5200;
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
  baseLen: number,
  lenJitter: number,
  thick: number,
  index: number,
) {
  const len = (baseLen + site.jitter * lenJitter) * grow;
  const t = thick * Math.max(grow, 0.001);
  dummy.position.copy(site.position);
  dummy.quaternion.setFromUnitVectors(up, site.normal);
  dummy.scale.set(t, len, t);
  dummy.updateMatrix();
  tmpMat.makeTranslation(0, len * 0.5, 0);
  dummy.matrix.multiply(tmpMat);
  mesh.setMatrixAt(index, dummy.matrix);
}

function fillStaticHair(
  mesh: InstancedMesh | null,
  sites: HairSite[],
  baseLen: number,
  lenJitter: number,
  thick: number,
) {
  if (!mesh || sites.length === 0) return;
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  for (let i = 0; i < sites.length; i += 1) {
    writeHair(mesh, sites[i]!, 1, baseLen, lenJitter, thick, i);
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
  const thinning = useRef<InstancedMesh>(null);
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
  const thinningSites = useMemo(
    () => receptorSites.slice(0, THINNING_HAIRS),
    [receptorSites],
  );

  useLayoutEffect(() => {
    targetCount.current = graftCount;
  }, [graftCount]);

  // Remanescente: ferradura de cabelo nas laterais/nuca da coroa
  useLayoutEffect(() => {
    fillStaticHair(residual.current, residualSites, 0.46, 0.26, 0.03);
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

  useLayoutEffect(() => {
    const mesh = thinning.current;
    if (!mesh || thinningSites.length === 0) return;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    // Estado inicial: área dos 5.000 já preenchida (calvo / Antes)
    for (let i = 0; i < thinningSites.length; i += 1) {
      writeHair(mesh, thinningSites[i]!, 1, 0.28, 0.16, 0.024, i);
    }
    mesh.count = thinningSites.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [thinningSites]);

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
      writeHair(mesh, site, grow, 0.34, 0.24, 0.029, i);
    }
    for (let i = visible; i < Math.min(visible + 40, MAX_GRAFTS); i += 1) {
      dummy.position.set(0, -50, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    // Remanescente do topo: some conforme os enxertos ocupam a mesma área
    const thin = thinning.current;
    if (thin && thinningSites.length > 0) {
      const start = Math.min(visible, thinningSites.length);
      const remaining = thinningSites.length - start;
      for (let i = 0; i < remaining; i += 1) {
        writeHair(
          thin,
          thinningSites[start + i]!,
          1,
          0.28,
          0.16,
          0.024,
          i,
        );
      }
      thin.count = remaining;
      thin.instanceMatrix.needsUpdate = true;
    }
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

      {/* Cabelo remanescente (ferradura) — laterais / nuca da coroa */}
      <instancedMesh
        ref={residual}
        args={[undefined, undefined, RESIDUAL_HAIRS]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 0.7, 1, 5]} />
        <meshStandardMaterial color="#2a2724" roughness={0.42} metalness={0.12} />
      </instancedMesh>

      {/* Topo/frontal já com cabelo no “Antes” (área coberta até 5.000) */}
      <instancedMesh
        ref={thinning}
        args={[undefined, undefined, THINNING_HAIRS]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 0.7, 1, 5]} />
        <meshStandardMaterial color="#2c2926" roughness={0.48} metalness={0.08} />
      </instancedMesh>

      {/* Enxertos — densificam / substituem a área acima */}
      <instancedMesh
        ref={receptor}
        args={[undefined, undefined, MAX_GRAFTS]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 0.7, 1, 5]} />
        <meshStandardMaterial color="#282523" roughness={0.4} metalness={0.16} />
      </instancedMesh>
    </group>
  );
}

useGLTF.preload("/models/head.glb");
