"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { HairlineCurve } from "@/components/hairline/HairlineCurve";

export function HairlineCanvas({ progress = 0 }: { progress?: number }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="aspect-[16/10] w-full bg-[#060810] md:aspect-[21/9]">
      <Canvas
        camera={{ position: [0, 0.35, 3.4], fov: 32 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#060810"]} />
        <Environment preset="studio" environmentIntensity={0.28} />

        <hemisphereLight intensity={0.4} color="#f0e6d4" groundColor="#1a2030" />
        <directionalLight
          position={[2.5, 3.5, 2]}
          intensity={0.85}
          color="#f3e0ce"
          castShadow
        />
        <pointLight position={[0, 1.2, 2]} intensity={0.35} color="#c4b07a" />

        <HairlineCurve progress={progress} />

        <ContactShadows
          position={[0, -1.1, 0]}
          opacity={0.35}
          scale={10}
          blur={2.8}
          far={4}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.4}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.85}
          minAzimuthAngle={-Math.PI / 2.2}
          maxAzimuthAngle={Math.PI / 2.2}
          autoRotate={!dragging}
          autoRotateSpeed={0.45}
          onStart={() => setDragging(true)}
          onEnd={() => setDragging(false)}
        />
      </Canvas>
    </div>
  );
}
