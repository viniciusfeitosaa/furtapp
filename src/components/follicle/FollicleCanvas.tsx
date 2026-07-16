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
        camera={{ position: [0.15, 0.35, 3.6], fov: 32 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#0c1018"]} />

        <ambientLight intensity={0.42} color="#dcdfe6" />
        <directionalLight
          castShadow
          position={[3.2, 4.5, 2.6]}
          intensity={1.35}
          color="#f7f1e4"
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[-2.6, 1.4, -2]}
          intensity={0.45}
          color="#96a4c9"
        />
        <pointLight position={[0.8, 1.2, 1.6]} intensity={0.35} color="#b6a46e" />

        <FollicleModel
          graftCount={graftCount}
          autoRotate={autoRotate}
          userDragging={dragging}
        />

        <ContactShadows
          position={[0, -1.35, 0]}
          opacity={0.42}
          scale={10}
          blur={2.6}
          far={4}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.5}
          minPolarAngle={Math.PI / 3.4}
          maxPolarAngle={Math.PI / 1.7}
          minAzimuthAngle={-Math.PI / 1.35}
          maxAzimuthAngle={Math.PI / 1.35}
          onStart={() => setDragging(true)}
          onEnd={() => setDragging(false)}
        />
      </Canvas>
    </div>
  );
}
