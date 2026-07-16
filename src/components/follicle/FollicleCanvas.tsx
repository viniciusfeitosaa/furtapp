"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
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
        camera={{ position: [0.2, 0.25, 3.8], fov: 30 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMappingExposure: 1.05,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#0c1018"]} />

        <ambientLight intensity={0.28} color="#dcdfe6" />
        <directionalLight
          castShadow
          position={[3.4, 4.8, 2.8]}
          intensity={1.45}
          color="#fff4e8"
          shadow-mapSize={[1024, 1024]}
        />
        {/* Fill frio */}
        <directionalLight
          position={[-2.8, 1.6, -2.2]}
          intensity={0.4}
          color="#96a4c9"
        />
        {/* Rim dourado de marca */}
        <pointLight position={[0.9, 1.4, 1.8]} intensity={0.4} color="#b6a46e" />
        {/* Luz de orelha / SSS hint */}
        <pointLight position={[-1.1, 0.1, 0.4]} intensity={0.25} color="#e07060" />

        <FollicleModel
          graftCount={graftCount}
          autoRotate={autoRotate}
          userDragging={dragging}
        />

        <ContactShadows
          position={[0, -1.45, 0]}
          opacity={0.45}
          scale={10}
          blur={2.8}
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
