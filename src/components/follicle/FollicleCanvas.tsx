"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { FollicleModel } from "@/components/follicle/FollicleModel";

export function FollicleCanvas({ autoRotate = true }: { autoRotate?: boolean }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="aspect-[16/10] w-full bg-[#0c1018] md:aspect-[21/9]">
      <Canvas
        shadows
        camera={{ position: [0.35, 0.55, 3.4], fov: 32 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#0c1018"]} />

        <ambientLight intensity={0.4} color="#dcdfe6" />
        <directionalLight
          castShadow
          position={[3.2, 5, 2.4]}
          intensity={1.35}
          color="#f7f1e4"
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[-2.8, 1.2, -1.8]}
          intensity={0.5}
          color="#96a4c9"
        />
        {/* Rim / highlights do bulbo */}
        <pointLight position={[0.6, 0.2, 1.4]} intensity={0.55} color="#b6a46e" />
        <pointLight position={[-1.2, -0.4, -1]} intensity={0.3} color="#c7ccdb" />

        <FollicleModel autoRotate={autoRotate} userDragging={dragging} />

        <ContactShadows
          position={[0, -0.95, 0]}
          opacity={0.48}
          scale={8}
          blur={2.8}
          far={3}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.55}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.65}
          minAzimuthAngle={-Math.PI / 1.4}
          maxAzimuthAngle={Math.PI / 1.4}
          onStart={() => setDragging(true)}
          onEnd={() => setDragging(false)}
        />
      </Canvas>
    </div>
  );
}
