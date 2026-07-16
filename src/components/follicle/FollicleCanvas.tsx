"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
} from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import {
  FollicleModel,
  type GraftCount,
} from "@/components/follicle/FollicleModel";

export function FollicleCanvas({
  autoRotate = true,
  graftCount = 0,
}: {
  autoRotate?: boolean;
  graftCount?: GraftCount;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="aspect-[16/10] w-full bg-[#0c1018] md:aspect-[21/9]">
      <Canvas
        shadows
        camera={{ position: [0.15, 0.2, 3.6], fov: 28 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#0c1018"]} />

        {/* Ambiente de estúdio — reflexos suaves na pele */}
        <Environment preset="studio" environmentIntensity={0.45} />

        <hemisphereLight
          intensity={0.55}
          color="#fff2e6"
          groundColor="#2a3038"
        />
        {/* Key quente */}
        <directionalLight
          castShadow
          position={[2.8, 4.2, 3.2]}
          intensity={1.15}
          color="#fff6ea"
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
        />
        {/* Fill frio */}
        <directionalLight
          position={[-3.2, 1.8, -1.6]}
          intensity={0.35}
          color="#a8b4d0"
        />
        {/* Rim dourado */}
        <pointLight position={[1.2, 1.6, 2.0]} intensity={0.35} color="#c4b07a" />
        {/* SSS hint nas orelhas / laterais */}
        <pointLight position={[-1.2, 0.15, 0.5]} intensity={0.32} color="#e07868" />
        <pointLight position={[1.2, 0.15, 0.5]} intensity={0.28} color="#e07868" />

        <FollicleModel
          graftCount={graftCount}
          autoRotate={autoRotate}
          userDragging={dragging}
        />

        <ContactShadows
          position={[0, -1.45, 0]}
          opacity={0.4}
          scale={10}
          blur={3.2}
          far={4}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.48}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 1.75}
          minAzimuthAngle={-Math.PI / 1.35}
          maxAzimuthAngle={Math.PI / 1.35}
          onStart={() => setDragging(true)}
          onEnd={() => setDragging(false)}
        />
      </Canvas>
    </div>
  );
}
