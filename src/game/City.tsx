import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CITY, GRID, roadLine, CITY_SPAN, BLOCK } from "./cityData";
import { asphaltTexture, sidewalkTexture, grassTexture, buildingFacadeTexture } from "./textures";
import { CarModel } from "./CarModel";

export const buildingMaterials: THREE.MeshStandardMaterial[] = [];
export const lampMaterialRef: { current: THREE.MeshStandardMaterial | null } = { current: null };
export const windowMatCache = new Map<number, THREE.Texture>();

function getFacadeTex(seed: number) {
  const key = seed % 9;
  if (!windowMatCache.has(key)) {
    windowMatCache.set(key, buildingFacadeTexture(key * 971 + 13, 0.42));
  }
  return windowMatCache.get(key)!;
}

function Buildings() {
  return (
    <group>
      {CITY.buildings.map((b, i) => {
        const tex = getFacadeTex(b.seed);
        return (
          <group key={i}>
            <mesh position={b.position} castShadow receiveShadow>
              <boxGeometry args={b.size} />
              <meshStandardMaterial
                ref={(m) => {
                  if (m && !buildingMaterials.includes(m)) buildingMaterials.push(m);
                }}
                color={b.color}
                emissive="#ffdb8c"
                emissiveMap={tex}
                emissiveIntensity={0}
                roughness={0.75}
                metalness={b.kind === "tower" ? 0.35 : 0.05}
              />
            </mesh>
            {b.kind === "house" && (
              <mesh position={[b.position[0], b.position[1] + b.size[1] / 2 + b.size[1] * 0.18, b.position[2]]} castShadow>
                <coneGeometry args={[Math.max(b.size[0], b.size[2]) * 0.75, b.size[1] * 0.4, 4]} />
                <meshStandardMaterial color={b.roofColor ?? "#3b3b3b"} roughness={0.9} />
              </mesh>
            )}
            {b.kind === "tower" && (
              <mesh position={[b.position[0], b.position[1] + b.size[1] / 2 + 0.6, b.position[2]]}>
                <boxGeometry args={[0.4, 1.2, 0.4]} />
                <meshStandardMaterial color="#222" emissive="#ff3333" emissiveIntensity={1.4} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function BlockPads() {
  return (
    <group>
      {CITY.blocks.map((b, i) => {
        const isPark = b.type === "park" || b.type === "plaza";
        return (
          <mesh key={i} position={[b.cx, 0.08, b.cz]} receiveShadow>
            <boxGeometry args={[BLOCK - 1.5, 0.16, BLOCK - 1.5]} />
            <meshStandardMaterial map={isPark ? grassTexture : sidewalkTexture} color={isPark ? "#ffffff" : "#ffffff"} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function Roads() {
  const dashTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 16;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, 16, 64);
    ctx.fillStyle = "#e8c93b";
    ctx.fillRect(4, 6, 8, 30);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, CITY_SPAN / 16);
    return t;
  }, []);

  const lines = [];
  for (let k = 0; k <= GRID; k++) {
    const coord = roadLine(k);
    lines.push(
      <mesh key={`h${k}`} position={[0, 0.03, coord]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[0.5, CITY_SPAN]} />
        <meshStandardMaterial map={dashTex} transparent roughness={0.8} />
      </mesh>
    );
    lines.push(
      <mesh key={`v${k}`} position={[coord, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.5, CITY_SPAN]} />
        <meshStandardMaterial map={dashTex} transparent roughness={0.8} />
      </mesh>
    );
  }
  return <group>{lines}</group>;
}

function InstancedProp({
  count,
  geometry,
  material,
  matrices,
}: {
  count: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);
  return <instancedMesh ref={ref} args={[geometry, material, count]} castShadow receiveShadow />;
}

function Trees() {
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.18, 0.24, 1.6, 6), []);
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a3d24", roughness: 1 }), []);
  const leafGeo = useMemo(() => new THREE.IcosahedronGeometry(1.5, 0), []);
  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2f6b32", roughness: 0.9, flatShading: true }), []);

  const trunkMatrices = useMemo(
    () =>
      CITY.trees.map((t) => {
        const m = new THREE.Matrix4();
        m.compose(
          new THREE.Vector3(t.x, 0.8 * t.scale, t.z),
          new THREE.Quaternion(),
          new THREE.Vector3(t.scale, t.scale, t.scale)
        );
        return m;
      }),
    []
  );
  const leafMatrices = useMemo(
    () =>
      CITY.trees.map((t) => {
        const m = new THREE.Matrix4();
        m.compose(
          new THREE.Vector3(t.x, 2.1 * t.scale, t.z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, t.ry, 0)),
          new THREE.Vector3(t.scale, t.scale * 1.1, t.scale)
        );
        return m;
      }),
    []
  );

  return (
    <group>
      <InstancedProp count={CITY.trees.length} geometry={trunkGeo} material={trunkMat} matrices={trunkMatrices} />
      <InstancedProp count={CITY.trees.length} geometry={leafGeo} material={leafMat} matrices={leafMatrices} />
    </group>
  );
}

function Streetlights() {
  const poleGeo = useMemo(() => new THREE.CylinderGeometry(0.09, 0.12, 5.4, 6), []);
  const poleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a3a3a", roughness: 0.6, metalness: 0.4 }), []);
  const lampGeo = useMemo(() => new THREE.SphereGeometry(0.28, 8, 8), []);
  const lampMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: "#fff3c4", emissive: "#ffdb7a", emissiveIntensity: 0 });
    lampMaterialRef.current = m;
    return m;
  }, []);

  const poleMatrices = useMemo(
    () =>
      CITY.streetlights.map((s) => {
        const m = new THREE.Matrix4();
        m.setPosition(s.x, 2.7, s.z);
        return m;
      }),
    []
  );
  const lampMatrices = useMemo(
    () =>
      CITY.streetlights.map((s) => {
        const m = new THREE.Matrix4();
        m.setPosition(s.x, 5.3, s.z);
        return m;
      }),
    []
  );

  return (
    <group>
      <InstancedProp count={CITY.streetlights.length} geometry={poleGeo} material={poleMat} matrices={poleMatrices} />
      <InstancedProp count={CITY.streetlights.length} geometry={lampGeo} material={lampMat} matrices={lampMatrices} />
    </group>
  );
}

function TrafficSignals() {
  const poleGeo = useMemo(() => new THREE.CylinderGeometry(0.1, 0.12, 3.6, 6), []);
  const poleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2a2a" }), []);
  const boxGeo = useMemo(() => new THREE.BoxGeometry(0.32, 0.7, 0.32), []);
  const boxMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#161616", emissive: "#1ecb4f", emissiveIntensity: 1.2 }), []);

  const poleMatrices = useMemo(
    () =>
      CITY.trafficLights.map((s) => {
        const m = new THREE.Matrix4();
        m.setPosition(s.x, 1.8, s.z);
        return m;
      }),
    []
  );
  const boxMatrices = useMemo(
    () =>
      CITY.trafficLights.map((s) => {
        const m = new THREE.Matrix4();
        m.setPosition(s.x, 3.7, s.z);
        return m;
      }),
    []
  );

  return (
    <group>
      <InstancedProp count={CITY.trafficLights.length} geometry={poleGeo} material={poleMat} matrices={poleMatrices} />
      <InstancedProp count={CITY.trafficLights.length} geometry={boxGeo} material={boxMat} matrices={boxMatrices} />
    </group>
  );
}

function ParkedCars() {
  return (
    <group>
      {CITY.parkedCars.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.ry, 0]}>
          <CarModel kind={c.kind} color={c.color} />
        </group>
      ))}
    </group>
  );
}

export function City() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[CITY_SPAN + 60, CITY_SPAN + 60]} />
        <meshStandardMaterial map={asphaltTexture} roughness={1} />
      </mesh>
      <Roads />
      <BlockPads />
      <Buildings />
      <Trees />
      <Streetlights />
      <TrafficSignals />
      <ParkedCars />
    </group>
  );
}
