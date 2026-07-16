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
const DONOR_HAIRS = 2600;
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

/** Preenche as matrizes de um conjunto de fios (comprimento/curvatura variados). */
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

export function FollicleModel({
  graftCount,
  autoRotate = true,
  userDragging = false,
}: Props) {
  const root = useRef<Group>(null);
  const receptor = useRef<InstancedMesh>(null);
  const donor = useRef<InstancedMesh>(null);
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
  const donorSites = useMemo(
    () => (geometry ? buildHairSites(geometry, DONOR_HAIRS, "donor") : []),
    [geometry],
  );

  useLayoutEffect(() => {
    targetCount.current = graftCount;
  }, [graftCount]);

  // Donor: fios curtos permanentes (cabelo raspado das laterais/nuca)
  useLayoutEffect(() => {
    const mesh = donor.current;
    if (!mesh || donorSites.length === 0) return;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    for (let i = 0; i < donorSites.length; i += 1) {
      writeHair(mesh, donorSites[i]!, 1, 0.16, 0.1, 0.026, i);
    }
    mesh.count = donorSites.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [donorSites]);

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
      writeHair(mesh, site, grow, 0.32, 0.28, 0.03, i);
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
      {/* Cabeça real (Lee Perry-Smith) com pele PBR + SSS */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={albedo}
          normalMap={normalMap}
          normalScale={[0.6, 0.6]}
          color="#e6b9a6"
          roughness={0.62}
          metalness={0.0}
          clearcoat={0.18}
          clearcoatRoughness={0.55}
          sheen={0.4}
          sheenRoughness={0.5}
          sheenColor="#c67a63"
          transmission={0.16}
          thickness={0.9}
          attenuationColor="#a83a2e"
          attenuationDistance={0.7}
          ior={1.4}
        />
      </mesh>

      {/* Fios doadores (laterais/nuca) — sempre presentes */}
      <instancedMesh
        ref={donor}
        args={[undefined, undefined, DONOR_HAIRS]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 0.7, 1, 5]} />
        <meshStandardMaterial color="#242220" roughness={0.55} metalness={0.1} />
      </instancedMesh>

      {/* Fios receptores (enxertos) — controlados pela densidade */}
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
