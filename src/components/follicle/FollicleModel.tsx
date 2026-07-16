"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  DynamicDrawUsage,
  Float32BufferAttribute,
  MathUtils,
  Matrix4,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Group,
  type InstancedMesh,
  type Mesh,
  type WebGLProgramParametersWithUniforms,
} from "three";
import {
  buildHairSites,
  buildScalpShades,
  countEarHairSites,
  type HairSite,
} from "@/components/follicle/hairSites";

/** Quantidade de enxertos na zona receptora (0 = Calvo, até MAX_GRAFTS). */
export type GraftCount = number;

export const MAX_GRAFTS = 8000;
/** Cabeça inteira no Calvo; só as entradas (têmporas) ficam vazias. */
const RESIDUAL_HAIRS = 38000;
/** Tamanho único padrão dos fios (sem variação). */
const HAIR_LEN = 0.11;
const HAIR_THICK = 0.01;
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
  const skinShader = useRef<WebGLProgramParametersWithUniforms | null>(null);
  const graftFill = useRef(0);

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

  // Sombra de suporte + máscara do couro (textura só no couro, não no rosto)
  useLayoutEffect(() => {
    if (!geometry) return;
    const { residual: rs, receptor: rc, surface } = buildScalpShades(geometry);
    geometry.setAttribute("aResidualShade", new Float32BufferAttribute(rs, 1));
    geometry.setAttribute("aReceptorShade", new Float32BufferAttribute(rc, 1));
    geometry.setAttribute("aScalpMask", new Float32BufferAttribute(surface, 1));
  }, [geometry]);

  const onBeforeCompile = useCallback(
    (shader: WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uGraftFill = { value: graftFill.current };
      skinShader.current = shader;

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
attribute float aResidualShade;
attribute float aReceptorShade;
attribute float aScalpMask;
varying float vResidualShade;
varying float vReceptorShade;
varying float vScalpMask;`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
vResidualShade = aResidualShade;
vReceptorShade = aReceptorShade;
vScalpMask = aScalpMask;`,
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
uniform float uGraftFill;
varying float vResidualShade;
varying float vReceptorShade;
varying float vScalpMask;`,
        )
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
{
  // Rosto: tom bronzeado (ACES + luz de estúdio sobem muito o midtone).
  vec3 flatSkin = vec3(0.561, 0.322, 0.196); // #8f5232
  float scalp = clamp(vScalpMask, 0.0, 1.0);
  // Couro também puxado para o mesmo tom — albedo original é clara demais.
  diffuseColor.rgb = mix(flatSkin, diffuseColor.rgb * flatSkin * 1.35, scalp * 0.55);

  // Sombra de suporte sob cabelo; entradas limpas no Calvo (uGraftFill=0)
  float shade = vResidualShade;
  shade = mix(shade, min(shade, vReceptorShade), clamp(uGraftFill, 0.0, 1.0));
  diffuseColor.rgb *= shade;
}`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
{
  float scalp = clamp(vScalpMask, 0.0, 1.0);
  normal = normalize(mix(nonPerturbedNormal, normal, scalp * 0.35));
}`,
        );
    },
    [],
  );

  const receptorSites = useMemo(
    () => (geometry ? buildHairSites(geometry, MAX_GRAFTS, "receptor") : []),
    [geometry],
  );
  const residualSites = useMemo(
    () => (geometry ? buildHairSites(geometry, RESIDUAL_HAIRS, "residual") : []),
    [geometry],
  );

  // Auditoria: fios na orelha devem ser 0
  useLayoutEffect(() => {
    if (!geometry) return;
    const earResidual = countEarHairSites(residualSites, geometry);
    const earReceptor = countEarHairSites(receptorSites, geometry);
    if (earResidual > 0 || earReceptor > 0) {
      console.warn(
        `[follicle] fios na orelha: residual=${earResidual} receptor=${earReceptor}`,
      );
    }
  }, [geometry, residualSites, receptorSites]);

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

    // Sombra de suporte das entradas acompanha o preenchimento dos enxertos
    graftFill.current = visible / MAX_GRAFTS;
    if (skinShader.current) {
      skinShader.current.uniforms.uGraftFill.value = graftFill.current;
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
        {/*
          PBR: albedo/normal só no couro (aScalpMask).
          Rosto permanece tom uniforme — evita falhas faciais da textura.
          Entradas = couro limpo no Calvo (sombra do receptor só com uGraftFill).
        */}
        <meshPhysicalMaterial
          map={albedo}
          normalMap={normalMap}
          normalScale={new Vector2(0.22, 0.22)}
          color="#a3623d"
          roughness={0.86}
          metalness={0.0}
          clearcoat={0.03}
          clearcoatRoughness={0.7}
          sheen={0.12}
          sheenRoughness={0.7}
          sheenColor="#8f5232"
          onBeforeCompile={onBeforeCompile}
          customProgramCacheKey={() => "scalp-pbr-skin-tan-v3"}
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
