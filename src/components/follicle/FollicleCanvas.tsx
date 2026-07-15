"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { FollicleModel } from "@/components/follicle/FollicleModel";

export function FollicleCanvas({ autoRotate = true }: { autoRotate?: boolean }) {
  return (
    <div className="aspect-[16/10] w-full bg-[#0c1018] md:aspect-[21/9]">
      <Canvas
        camera={{ position: [0, 0.4, 3.2], fov: 35 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#0c1018"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 2]} intensity={1.1} color="#f5f2ea" />
        <directionalLight position={[-2, 1, -2]} intensity={0.35} color="#96a4c9" />
        <FollicleModel autoRotate={autoRotate} />
        <ContactShadows
          position={[0, -0.7, 0]}
          opacity={0.35}
          scale={6}
          blur={2.5}
          far={2}
        />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          dampingFactor={0.08}
          enableDamping
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Canvas>
    </div>
  );
}
