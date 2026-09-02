import { useRef } from "react";
import * as THREE from "three";

export type CarKind = "sedan" | "sport" | "truck" | "police";

const DIMENSIONS: Record<CarKind, { body: [number, number, number]; cabin: [number, number, number]; cabinY: number; wheelR: number }> = {
  sedan: { body: [2, 0.8, 4.4], cabin: [1.7, 0.6, 2.2], cabinY: 0.75, wheelR: 0.42 },
  sport: { body: [1.95, 0.6, 4.3], cabin: [1.6, 0.45, 1.8], cabinY: 0.55, wheelR: 0.4 },
  truck: { body: [2.3, 1.1, 5.4], cabin: [2.1, 0.9, 1.8], cabinY: 1.1, wheelR: 0.52 },
  police: { body: [2, 0.8, 4.4], cabin: [1.7, 0.6, 2.2], cabinY: 0.75, wheelR: 0.42 },
};

export function CarModel({
  kind = "sedan",
  color = "#d13b3b",
  wheelRefs,
  headlightsOn = false,
  brakeOn = false,
}: {
  kind?: CarKind;
  color?: string;
  wheelRefs?: React.MutableRefObject<THREE.Object3D[]>;
  headlightsOn?: boolean;
  brakeOn?: boolean;
}) {
  const dim = DIMENSIONS[kind];
  const wheelPositions: [number, number, number][] = [
    [dim.body[0] / 2 + 0.05, dim.wheelR, dim.body[2] / 2 - dim.wheelR * 1.3],
    [-dim.body[0] / 2 - 0.05, dim.wheelR, dim.body[2] / 2 - dim.wheelR * 1.3],
    [dim.body[0] / 2 + 0.05, dim.wheelR, -dim.body[2] / 2 + dim.wheelR * 1.3],
    [-dim.body[0] / 2 - 0.05, dim.wheelR, -dim.body[2] / 2 + dim.wheelR * 1.3],
  ];
  const localWheelRefs = useRef<THREE.Object3D[]>([]);

  return (
    <group>
      {/* body */}
      <mesh position={[0, dim.body[1] / 2 + dim.wheelR * 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={dim.body} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, dim.body[1] + dim.cabinY / 2 + dim.wheelR * 0.7 - 0.05, kind === "truck" ? dim.body[2] / 2 - dim.cabin[2] / 2 - 0.3 : -0.1]} castShadow>
        <boxGeometry args={dim.cabin} />
        <meshStandardMaterial color="#0e1116" metalness={0.2} roughness={0.15} />
      </mesh>
      {kind === "police" && (
        <mesh position={[0, dim.body[1] + dim.cabinY + dim.wheelR * 0.7 + 0.1, -0.1]}>
          <boxGeometry args={[0.9, 0.18, 0.4]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      )}
      {kind === "police" && (
        <>
          <pointLight position={[-0.25, dim.body[1] + dim.cabinY + dim.wheelR * 0.7 + 0.25, -0.1]} color="#3355ff" intensity={2} distance={6} />
          <pointLight position={[0.25, dim.body[1] + dim.cabinY + dim.wheelR * 0.7 + 0.25, -0.1]} color="#ff2222" intensity={2} distance={6} />
        </>
      )}
      {/* headlights */}
      <mesh position={[dim.body[0] / 2 - 0.3, dim.body[1] / 2 + dim.wheelR * 0.7, dim.body[2] / 2 - 0.02]}>
        <boxGeometry args={[0.35, 0.18, 0.05]} />
        <meshStandardMaterial color="#fff7d6" emissive={headlightsOn ? "#fff2b0" : "#332f22"} emissiveIntensity={headlightsOn ? 3 : 0.2} />
      </mesh>
      <mesh position={[-dim.body[0] / 2 + 0.3, dim.body[1] / 2 + dim.wheelR * 0.7, dim.body[2] / 2 - 0.02]}>
        <boxGeometry args={[0.35, 0.18, 0.05]} />
        <meshStandardMaterial color="#fff7d6" emissive={headlightsOn ? "#fff2b0" : "#332f22"} emissiveIntensity={headlightsOn ? 3 : 0.2} />
      </mesh>
      {headlightsOn && (
        <>
          <spotLight position={[0.5, 0.6, dim.body[2] / 2]} target-position={[0.5, 0, dim.body[2] / 2 + 12]} angle={0.5} penumbra={0.6} intensity={6} distance={22} color="#fff6d8" />
          <spotLight position={[-0.5, 0.6, dim.body[2] / 2]} target-position={[-0.5, 0, dim.body[2] / 2 + 12]} angle={0.5} penumbra={0.6} intensity={6} distance={22} color="#fff6d8" />
        </>
      )}
      {/* taillights */}
      <mesh position={[dim.body[0] / 2 - 0.3, dim.body[1] / 2 + dim.wheelR * 0.7, -dim.body[2] / 2 + 0.02]}>
        <boxGeometry args={[0.3, 0.15, 0.05]} />
        <meshStandardMaterial color="#440000" emissive={brakeOn ? "#ff1414" : "#550000"} emissiveIntensity={brakeOn ? 3 : 0.6} />
      </mesh>
      <mesh position={[-dim.body[0] / 2 + 0.3, dim.body[1] / 2 + dim.wheelR * 0.7, -dim.body[2] / 2 + 0.02]}>
        <boxGeometry args={[0.3, 0.15, 0.05]} />
        <meshStandardMaterial color="#440000" emissive={brakeOn ? "#ff1414" : "#550000"} emissiveIntensity={brakeOn ? 3 : 0.6} />
      </mesh>
      {/* wheels */}
      {wheelPositions.map((p, i) => (
        <group
          key={i}
          position={p}
          ref={(o: THREE.Object3D | null) => {
            if (!o) return;
            const arr = wheelRefs?.current ?? localWheelRefs.current;
            arr[i] = o;
          }}
        >
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[dim.wheelR, dim.wheelR, 0.32, 16]} />
            <meshStandardMaterial color="#141414" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
