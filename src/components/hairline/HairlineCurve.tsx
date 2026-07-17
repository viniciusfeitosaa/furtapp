"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CatmullRomCurve3,
  Color,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
} from "three";

/** Linha anterior recuada (entradas / têmporas). */
function curveBefore(): CatmullRomCurve3 {
  return new CatmullRomCurve3(
    [
      new Vector3(-1.55, 0.15, 0.35),
      new Vector3(-1.15, 0.55, 0.55),
      new Vector3(-0.75, 0.05, 0.7),
      new Vector3(-0.25, 0.45, 0.85),
      new Vector3(0, 0.55, 0.9),
      new Vector3(0.25, 0.45, 0.85),
      new Vector3(0.75, 0.05, 0.7),
      new Vector3(1.15, 0.55, 0.55),
      new Vector3(1.55, 0.15, 0.35),
    ],
    false,
    "catmullrom",
    0.35,
  );
}

/** Linha anterior natural (arco suave). */
function curveNatural(): CatmullRomCurve3 {
  return new CatmullRomCurve3(
    [
      new Vector3(-1.55, 0.2, 0.4),
      new Vector3(-1.1, 0.55, 0.75),
      new Vector3(-0.55, 0.72, 0.95),
      new Vector3(0, 0.8, 1.05),
      new Vector3(0.55, 0.72, 0.95),
      new Vector3(1.1, 0.55, 0.75),
      new Vector3(1.55, 0.2, 0.4),
    ],
    false,
    "catmullrom",
    0.4,
  );
}

function morphCurve(t: number): CatmullRomCurve3 {
  const a = curveBefore();
  const b = curveNatural();
  const n = 40;
  const pts: Vector3[] = [];
  for (let i = 0; i <= n; i += 1) {
    const u = i / n;
    const pa = a.getPoint(u);
    const pb = b.getPoint(u);
    pts.push(
      new Vector3(
        pa.x + (pb.x - pa.x) * t,
        pa.y + (pb.y - pa.y) * t,
        pa.z + (pb.z - pa.z) * t,
      ),
    );
  }
  return new CatmullRomCurve3(pts, false, "catmullrom", 0.4);
}

const GOLD = new Color("#b6a46e");
const GOLD_SOFT = new Color("#d4c49a");

export function HairlineCurve({ progress }: { progress: number }) {
  const root = useRef<Group>(null);
  const tube = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);
  const leftDot = useRef<Mesh>(null);
  const rightDot = useRef<Mesh>(null);
  const tSmooth = useRef(progress);
  const lastBuilt = useRef(-1);

  useEffect(() => {
    const curve = morphCurve(0);
    if (tube.current) {
      tube.current.geometry.dispose();
      tube.current.geometry = new TubeGeometry(curve, 80, 0.028, 8, false);
    }
    if (glow.current) {
      glow.current.geometry.dispose();
      glow.current.geometry = new TubeGeometry(curve, 80, 0.07, 8, false);
    }
    lastBuilt.current = 0;
  }, []);

  useFrame((_, delta) => {
    tSmooth.current += (progress - tSmooth.current) * Math.min(1, delta * 7);
    const t = tSmooth.current;

    if (Math.abs(t - lastBuilt.current) > 0.012) {
      lastBuilt.current = t;
      const curve = morphCurve(t);
      if (tube.current) {
        tube.current.geometry.dispose();
        tube.current.geometry = new TubeGeometry(curve, 80, 0.028, 8, false);
      }
      if (glow.current) {
        glow.current.geometry.dispose();
        glow.current.geometry = new TubeGeometry(curve, 80, 0.07, 8, false);
      }
    }

    if (leftDot.current) {
      leftDot.current.position.set(
        -1.2,
        0.35 + t * 0.25,
        0.6 + t * 0.2,
      );
    }
    if (rightDot.current) {
      rightDot.current.position.set(1.2, 0.35 + t * 0.25, 0.6 + t * 0.2);
    }

    if (root.current) {
      const now = performance.now();
      root.current.rotation.y = Math.sin(now * 0.00035) * 0.12;
      root.current.rotation.x = 0.08 + Math.sin(now * 0.0005) * 0.03;
    }
  });

  return (
    <group ref={root} position={[0, -0.15, 0]}>
      <mesh ref={glow}>
        <tubeGeometry args={[morphCurve(0), 80, 0.07, 8, false]} />
        <meshBasicMaterial
          color={GOLD_SOFT}
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={tube} castShadow>
        <tubeGeometry args={[morphCurve(0), 80, 0.028, 8, false]} />
        <meshStandardMaterial
          color={GOLD}
          roughness={0.35}
          metalness={0.55}
          emissive={GOLD}
          emissiveIntensity={0.22}
        />
      </mesh>
      <mesh ref={leftDot}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.4}
          roughness={0.3}
        />
      </mesh>
      <mesh ref={rightDot}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.4}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}
