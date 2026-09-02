import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pedestrians, stepLoop } from "./world";
import { CITY } from "./cityData";
import { skinColors } from "./world";
import { useGame } from "./store";

function PedestrianMesh({ color, skin }: { color: string; skin: string }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.55, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.08, 0]} castShadow>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.32, 0.4, 0.2]} />
        <meshStandardMaterial color="#22252b" />
      </mesh>
    </group>
  );
}

export function Pedestrians() {
  const groupRefs = useRef(new Map<number, THREE.Group>());

  useFrame((_, rawDt) => {
    const gs = useGame.getState();
    if (!gs.started || gs.paused) return;
    const dt = Math.min(rawDt, 0.05);
    for (const p of pedestrians) {
      if (!p.alive) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.alive = true;
          const loop = CITY.pedestrianLoops[p.loopIndex];
          p.pos.set(loop.points[0].x, 0, loop.points[0].z);
          p.loopSeg = 0;
          p.loopT = 0;
        }
        const g = groupRefs.current.get(p.id);
        if (g) g.visible = false;
        continue;
      }
      const loop = CITY.pedestrianLoops[p.loopIndex];
      if (loop) {
        const headingHolder = { v: p.heading };
        const seg = { seg: p.loopSeg, t: p.loopT };
        stepLoop(p.pos, headingHolder, loop, seg, p.speed, dt, 3.2);
        p.heading = headingHolder.v;
        p.loopSeg = seg.seg;
        p.loopT = seg.t;
      }
      p.bobT += dt * p.speed * 3.2;
      const g = groupRefs.current.get(p.id);
      if (g) {
        g.visible = true;
        g.position.set(p.pos.x, 0, p.pos.z);
        g.rotation.y = p.heading;
      }
    }
  });

  return (
    <group>
      {pedestrians.map((p) => (
        <group
          key={p.id}
          ref={(g) => {
            if (g) groupRefs.current.set(p.id, g);
          }}
        >
          <PedestrianMesh color={p.color} skin={skinColors[p.id % skinColors.length]} />
        </group>
      ))}
    </group>
  );
}

export function killNearestPedestrian(x: number, z: number, radius: number): boolean {
  for (const p of pedestrians) {
    if (!p.alive) continue;
    const d = Math.hypot(p.pos.x - x, p.pos.z - z);
    if (d < radius) {
      p.alive = false;
      p.respawnTimer = 14 + Math.random() * 10;
      return true;
    }
  }
  return false;
}


