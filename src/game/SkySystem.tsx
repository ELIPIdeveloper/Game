import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { buildingMaterials, lampMaterialRef } from "./City";
import { useGame } from "./store";

const NIGHT_COLOR = new THREE.Color("#050814");
const DUSK_COLOR = new THREE.Color("#e8825a");
const DAY_COLOR = new THREE.Color("#8fd0f2");
const scratch = new THREE.Color();

export function SkySystem() {
  const { scene } = useThree();
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.HemisphereLight>(null);
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);
  const starsRef = useRef<THREE.Group>(null);
  const t = useRef(0.32);
  const clockAccum = useRef(0);

  if (!scene.fog) scene.fog = new THREE.FogExp2("#8fd0f2", 0.0032);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const store = useGame.getState();
    if (store.started && !store.paused) {
      t.current = (t.current + dt / 300) % 1;
    }
    const angle = t.current * Math.PI * 2;
    const sunY = Math.sin(angle - Math.PI / 2);
    const sunX = Math.cos(angle - Math.PI / 2);
    const dist = 160;
    const sunPos = new THREE.Vector3(sunX * dist, sunY * dist + 30, 60);
    const moonPos = new THREE.Vector3(-sunX * dist, -sunY * dist + 30, -60);

    const daylight = THREE.MathUtils.clamp(sunY * 1.4 + 0.25, 0, 1);
    const duskFactor = THREE.MathUtils.clamp(1 - Math.abs(sunY) * 2.4, 0, 1);
    const nightFactor = 1 - daylight;

    if (dirRef.current) {
      dirRef.current.position.copy(sunPos);
      dirRef.current.target.position.set(0, 0, 0);
      dirRef.current.target.updateMatrixWorld();
      dirRef.current.intensity = 0.15 + daylight * 2.0;
      scratch.copy(DAY_COLOR).lerp(DUSK_COLOR, duskFactor).lerp(NIGHT_COLOR, nightFactor * 0.6);
      dirRef.current.color.set(daylight > 0.05 ? (duskFactor > 0.4 ? "#ffb37a" : "#ffffff") : "#6f86ff");
    }
    if (ambRef.current) {
      ambRef.current.intensity = 0.25 + daylight * 0.6;
    }
    if (sunMeshRef.current) {
      sunMeshRef.current.position.copy(sunPos);
      sunMeshRef.current.visible = sunY > -0.15;
    }
    if (moonMeshRef.current) {
      moonMeshRef.current.position.copy(moonPos);
      moonMeshRef.current.visible = sunY < 0.15;
    }
    if (starsRef.current) {
      starsRef.current.visible = nightFactor > 0.35;
    }

    const skyColor = scratch.copy(NIGHT_COLOR).lerp(DUSK_COLOR, duskFactor * 0.8).lerp(DAY_COLOR, daylight);
    scene.background = skyColor.clone();
    if (scene.fog && (scene.fog as THREE.FogExp2).color) {
      (scene.fog as THREE.FogExp2).color.copy(skyColor);
      (scene.fog as THREE.FogExp2).density = 0.0022 + nightFactor * 0.0012;
    }

    for (const m of buildingMaterials) m.emissiveIntensity = nightFactor * 1.3;
    if (lampMaterialRef.current) lampMaterialRef.current.emissiveIntensity = nightFactor * 2.4;

    clockAccum.current += rawDt;
    if (clockAccum.current > 1.5) {
      clockAccum.current = 0;
      const totalMinutes = Math.floor(t.current * 24 * 60);
      const hh = Math.floor(totalMinutes / 60) % 24;
      const mm = totalMinutes % 60;
      store.setClock(`${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`);
    }
  });

  return (
    <group>
      <hemisphereLight ref={ambRef} args={["#bcd7f5", "#2b2f22", 0.6]} />
      <directionalLight ref={dirRef} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-90} shadow-camera-right={90} shadow-camera-top={90} shadow-camera-bottom={-90} shadow-camera-far={400}>
        <primitive object={new THREE.Object3D()} attach="target" />
      </directionalLight>
      <mesh ref={sunMeshRef}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color="#fff3c2" />
      </mesh>
      <mesh ref={moonMeshRef}>
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial color="#dfe6f5" />
      </mesh>
      <group ref={starsRef}>
        <Stars radius={280} depth={60} count={3000} factor={4} saturation={0} fade speed={0.4} />
      </group>
    </group>
  );
}
