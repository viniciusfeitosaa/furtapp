"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  type Texture,
  type WebGLProgramParametersWithUniforms,
} from "three";
import {
  buildHairSites,
  buildScalpShades,
  countEarHairSites,
  type HairSite,
} from "@/components/follicle/hairSites";
import {
  buildHairSitesFromDensity,
  buildScalpShadesFromDensity,
} from "@/components/follicle/hairSitesDensity";
import { loadDensityMap, type DensityMapData } from "@/components/follicle/densityMap";
import {
  LEGACY_ASSETS,
  loadPatientManifest,
  patientUrl,
  type DensityThresholds,
} from "@/components/follicle/follicleConfig";

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

type AssetMode = "loading" | "legacy" | "photo";

type ResolvedAssets = {
  mode: AssetMode;
  glb: string;
  color: string;
  normal: string | null;
  densityUrl: string | null;
  thresholds: DensityThresholds | null;
};

function useResolvedAssets(): ResolvedAssets {
  const [assets, setAssets] = useState<ResolvedAssets>({
    mode: "loading",
    glb: LEGACY_ASSETS.glb,
    color: LEGACY_ASSETS.color,
    normal: LEGACY_ASSETS.normal,
    densityUrl: null,
    thresholds: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const manifest = await loadPatientManifest();
      if (cancelled) return;
      if (manifest?.enabled) {
        setAssets({
          mode: "photo",
          glb: patientUrl(manifest.glb),
          color: patientUrl(manifest.color),
          normal: manifest.normal ? patientUrl(manifest.normal) : null,
          densityUrl: patientUrl(manifest.density),
          thresholds: manifest.thresholds,
        });
      } else {
        setAssets({
          mode: "legacy",
          glb: LEGACY_ASSETS.glb,
          color: LEGACY_ASSETS.color,
          normal: LEGACY_ASSETS.normal,
          densityUrl: null,
          thresholds: null,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return assets;
}

function HeadMesh({
  glbUrl,
  onGeometry,
}: {
  glbUrl: string;
  onGeometry: (geo: BufferGeometry | null) => void;
}) {
  const gltf = useGLTF(glbUrl);
  useLayoutEffect(() => {
    let geo: BufferGeometry | null = null;
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && !geo) geo = m.geometry as BufferGeometry;
    });
    onGeometry(geo);
  }, [gltf, onGeometry]);
  return null;
}

function writeHair(
  mesh: InstancedMesh,
  site: HairSite,
  grow: number,
  index: number,
) {
  const g = Math.max(grow * (site.grow ?? 1), 0.001);
  const len = HAIR_LEN * g;
  const t = HAIR_THICK * Math.max(Math.sqrt(g), 0.35);
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

function useTextures(colorUrl: string, normalUrl: string | null) {
  return useMemo(() => {
    const loader = new TextureLoader();
    const color = loader.load(colorUrl);
    color.flipY = false;
    color.colorSpace = SRGBColorSpace;
    color.wrapS = color.wrapT = RepeatWrapping;
    color.anisotropy = 8;
    let normal: Texture | null = null;
    if (normalUrl) {
      normal = loader.load(normalUrl);
      normal.flipY = false;
      normal.wrapS = normal.wrapT = RepeatWrapping;
      normal.anisotropy = 8;
    }
    return { color, normal };
  }, [colorUrl, normalUrl]);
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

  const assets = useResolvedAssets();
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  const [densityMap, setDensityMap] = useState<DensityMapData | null>(null);

  const onGeometry = useCallback((geo: BufferGeometry | null) => {
    setGeometry(geo);
  }, []);

  const { color: albedo, normal: normalMap } = useTextures(
    assets.mode === "loading" ? LEGACY_ASSETS.color : assets.color,
    assets.mode === "photo" ? assets.normal : LEGACY_ASSETS.normal,
  );

  useLayoutEffect(() => {
    return () => {
      albedo.dispose();
      normalMap?.dispose();
    };
  }, [albedo, normalMap]);

  // Carrega density map no modo fotogrametria
  useEffect(() => {
    if (assets.mode !== "photo" || !assets.densityUrl) return;
    let cancelled = false;
    loadDensityMap(assets.densityUrl)
      .then((map) => {
        if (!cancelled) setDensityMap(map);
      })
      .catch((err) => {
        console.error(
          "[follicle] density map falhou — verifique os arquivos patient/",
          err,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [assets.mode, assets.densityUrl]);

  // Limpa density ao sair do modo foto (sem setState síncrono no ramo early-return)
  const densityForMode =
    assets.mode === "photo" ? densityMap : null;

  const photoReady =
    assets.mode === "photo" &&
    !!geometry &&
    !!densityForMode &&
    !!assets.thresholds;

  // Sombra / máscara
  useLayoutEffect(() => {
    if (!geometry) return;
    if (photoReady && densityForMode && assets.thresholds) {
      const { residual: rs, receptor: rc, surface } = buildScalpShadesFromDensity(
        geometry,
        densityForMode,
        assets.thresholds,
      );
      geometry.setAttribute("aResidualShade", new Float32BufferAttribute(rs, 1));
      geometry.setAttribute("aReceptorShade", new Float32BufferAttribute(rc, 1));
      geometry.setAttribute("aScalpMask", new Float32BufferAttribute(surface, 1));
      return;
    }
    if (assets.mode === "legacy") {
      const { residual: rs, receptor: rc, surface } = buildScalpShades(geometry);
      geometry.setAttribute("aResidualShade", new Float32BufferAttribute(rs, 1));
      geometry.setAttribute("aReceptorShade", new Float32BufferAttribute(rc, 1));
      geometry.setAttribute("aScalpMask", new Float32BufferAttribute(surface, 1));
    }
  }, [geometry, photoReady, densityForMode, assets.mode, assets.thresholds]);

  const onBeforeCompile = useCallback(
    (shader: WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uGraftFill = { value: graftFill.current };
      shader.uniforms.uPhotoMode = { value: assets.mode === "photo" ? 1 : 0 };
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
uniform float uPhotoMode;
varying float vResidualShade;
varying float vReceptorShade;
varying float vScalpMask;`,
        )
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
{
  if (uPhotoMode < 0.5) {
    // Legado: tom uniforme no rosto; albedo só no couro
    vec3 flatSkin = vec3(0.561, 0.322, 0.196);
    float scalp = clamp(vScalpMask, 0.0, 1.0);
    diffuseColor.rgb = mix(flatSkin, diffuseColor.rgb * flatSkin * 1.35, scalp * 0.55);
  }
  // Foto: albedo real intacto

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
  if (uPhotoMode < 0.5) {
    normal = normalize(mix(nonPerturbedNormal, normal, scalp * 0.35));
  }
}`,
        );
    },
    [assets.mode],
  );

  const receptorSites = useMemo(() => {
    if (!geometry) return [] as HairSite[];
    if (photoReady && densityForMode && assets.thresholds) {
      return buildHairSitesFromDensity(
        geometry,
        MAX_GRAFTS,
        "receptor",
        densityForMode,
        assets.thresholds,
      );
    }
    if (assets.mode === "legacy") {
      return buildHairSites(geometry, MAX_GRAFTS, "receptor");
    }
    return [] as HairSite[];
  }, [geometry, photoReady, densityForMode, assets.mode, assets.thresholds]);

  const residualSites = useMemo(() => {
    if (!geometry) return [] as HairSite[];
    if (photoReady && densityForMode && assets.thresholds) {
      return buildHairSitesFromDensity(
        geometry,
        RESIDUAL_HAIRS,
        "residual",
        densityForMode,
        assets.thresholds,
      );
    }
    if (assets.mode === "legacy") {
      return buildHairSites(geometry, RESIDUAL_HAIRS, "residual");
    }
    return [] as HairSite[];
  }, [geometry, photoReady, densityForMode, assets.mode, assets.thresholds]);

  useLayoutEffect(() => {
    if (assets.mode !== "legacy" || !geometry) return;
    const earResidual = countEarHairSites(residualSites, geometry);
    const earReceptor = countEarHairSites(receptorSites, geometry);
    if (earResidual > 0 || earReceptor > 0) {
      console.warn(
        `[follicle] fios na orelha: residual=${earResidual} receptor=${earReceptor}`,
      );
    }
  }, [geometry, residualSites, receptorSites, assets.mode]);

  useLayoutEffect(() => {
    targetCount.current = graftCount;
  }, [graftCount]);

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

    graftFill.current = visible / MAX_GRAFTS;
    if (skinShader.current) {
      skinShader.current.uniforms.uGraftFill.value = graftFill.current;
      if (skinShader.current.uniforms.uPhotoMode) {
        skinShader.current.uniforms.uPhotoMode.value =
          assets.mode === "photo" ? 1 : 0;
      }
    }
  });

  if (assets.mode === "loading") return null;

  const glbUrl = assets.glb;
  const useFlatTint = assets.mode === "legacy";

  return (
    <group
      ref={root}
      scale={HEAD_SCALE}
      position={[0, -0.35, 0]}
      rotation={[0, 0, 0]}
    >
      <HeadMesh glbUrl={glbUrl} onGeometry={onGeometry} />

      {geometry ? (
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshPhysicalMaterial
            map={albedo}
            normalMap={normalMap ?? undefined}
            normalScale={new Vector2(0.22, 0.22)}
            color={useFlatTint ? "#a3623d" : "#ffffff"}
            roughness={assets.mode === "photo" ? 0.72 : 0.86}
            metalness={0.0}
            clearcoat={0.03}
            clearcoatRoughness={0.7}
            sheen={assets.mode === "photo" ? 0.08 : 0.12}
            sheenRoughness={0.7}
            sheenColor={useFlatTint ? "#8f5232" : "#c4a08a"}
            onBeforeCompile={onBeforeCompile}
            customProgramCacheKey={() =>
              assets.mode === "photo"
                ? "scalp-photo-density-v1"
                : "scalp-pbr-skin-tan-v3"
            }
          />
        </mesh>
      ) : null}

      <instancedMesh
        ref={residual}
        args={[undefined, undefined, RESIDUAL_HAIRS]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 0.85, 1, 5]} />
        <meshStandardMaterial color="#2a2724" roughness={0.42} metalness={0.12} />
      </instancedMesh>

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

// Preload legado; o GLB do paciente é carregado sob demanda
useGLTF.preload(LEGACY_ASSETS.glb);
