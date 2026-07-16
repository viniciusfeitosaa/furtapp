"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  DynamicDrawUsage,
  MathUtils,
  Matrix4,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type BufferGeometry,
  type Group,
  type InstancedMesh,
  type Mesh,
} from "three";
import { buildHairSites, type HairSite } from "@/components/follicle/hairSites";

export type GraftCount = 0 | 1000 | 5000 | 8000;

const MAX_GRAFTS = 8000;
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
  const phase = useRef(0);
  const displayCount = useRef(0);
  const targetCount = useRef<number>(graftCount);

  const geometry = useHeadGeometry();
  const { albedo, normalMap } = useMemo(() => {
    const loader = new TextureLoader();
    const a = loader.load("/models/head-albedo.jpg");
    a.flipY = false;
    a.colorSpace = SRGBColorSpace;
    a.wrapS = a.wrapT = RepeatWrapping;
    a.anisotropy = 8;
    const n = loader.load("/models/head-normal.jpg");
    n.flipY = false;
    n.wrapS = n.wrapT = RepeatWrapping;
    n.anisotropy = 8;
    return { albedo: a, normalMap: n };
  }, []);

  useLayoutEffect(() => {
    return () => {
      albedo.dispose();
      normalMap.dispose();
    };
  }, [albedo, normalMap]);

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
        {/*
          Pele PBR com albedo/normal do Lee Perry-Smith.
          Sem transmission (causava manchas); SSS aproximado via sheen + luzes.
        */}
        <meshPhysicalMaterial
          map={albedo}
          normalMap={normalMap}
          normalScale={[0.38, 0.38]}
          color="#f2c9b0"
          roughness={0.58}
          metalness={0.0}
          clearcoat={0.12}
          clearcoatRoughness={0.48}
          sheen={0.55}
          sheenRoughness={0.42}
          sheenColor="#e8a088"
          specularIntensity={0.35}
          ior={1.4}
        />
      </mesh>

      {/* Cabelo remanescente (ferradura) — visível já no “Antes” */}
      <instancedMesh
        ref={residual}
        args={[undefined, undefined, RESIDUAL_HAIRS]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 0.7, 1, 5]} />
        <meshStandardMaterial color="#2a2724" roughness={0.42} metalness={0.12} />
      </instancedMesh>

      {/* Enxertos na zona das entradas / frontal / vértex */}
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
