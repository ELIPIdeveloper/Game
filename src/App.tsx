import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { City } from "./game/City";
import { VehiclesLayer } from "./game/VehiclesLayer";
import { Pedestrians } from "./game/Pedestrians";
import { Player } from "./game/Player";
import { CameraRig } from "./game/CameraRig";
import { SkySystem } from "./game/SkySystem";
import { MissionMarker, WantedSystem, RespawnHandler } from "./game/GameSystems";
import { HUD } from "./ui/HUD";
import { MainMenu } from "./ui/MainMenu";
import { initInput } from "./game/input";

export default function App() {
  useEffect(() => {
    initInput();
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Canvas
        shadows
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 62, near: 0.1, far: 700, position: [0, 4, 10] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Suspense fallback={null}>
          <SkySystem />
          <City />
          <VehiclesLayer />
          <Pedestrians />
          <Player />
          <MissionMarker />
          <WantedSystem />
          <RespawnHandler />
          <CameraRig />
        </Suspense>
      </Canvas>

      <HUD />
      <MainMenu />
    </div>
  );
}
