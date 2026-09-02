import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CITY } from "./cityData";
import { playerState, vehicles, missionTarget } from "./world";
import { useGame } from "./store";

function getPlayerWorldPos(): THREE.Vector3 {
  if (playerState.mode === "drive") {
    const veh = vehicles.find((v) => v.id === playerState.activeVehicleId);
    if (veh) return veh.pos;
  }
  return playerState.pos;
}

export function MissionMarker() {
  const ref = useRef<THREE.Group>(null);
  const distAccum = useRef(0);
  const initialized = useRef(false);

  useFrame((state, dt) => {
    const store = useGame.getState();
    if (!store.started || store.paused) return;
    if (!initialized.current) {
      pickNewSpot();
      store.setMission("Delivery run", 0);
      initialized.current = true;
    }
    const pos = getPlayerWorldPos();
    const d = Math.hypot(pos.x - missionTarget.x, pos.z - missionTarget.z);
    distAccum.current += dt;
    if (distAccum.current > 0.25) {
      distAccum.current = 0;
      store.setMissionDistance(Math.round(d));
    }
    if (d < 6) {
      const reward = 250 + Math.floor(Math.random() * 400);
      store.addMoney(reward);
      store.pushToast("Delivery complete!", `+$${reward}`);
      pickNewSpot();
    }
    if (ref.current) {
      ref.current.position.set(missionTarget.x, 0, missionTarget.z);
      ref.current.rotation.y += dt * 1.2;
      const bob = Math.sin(state.clock.elapsedTime * 2) * 0.3;
      ref.current.children[0].position.y = 1.4 + bob;
    }
  });

  function pickNewSpot() {
    const spots = CITY.missionSpots;
    if (!spots.length) return;
    let next = spots[Math.floor(Math.random() * spots.length)];
    let guard = 0;
    while (Math.hypot(next.x - missionTarget.x, next.z - missionTarget.z) < 30 && guard < 10) {
      next = spots[Math.floor(Math.random() * spots.length)];
      guard++;
    }
    missionTarget.x = next.x;
    missionTarget.z = next.z;
  }

  return (
    <group ref={ref}>
      <mesh position={[0, 1.4, 0]}>
        <coneGeometry args={[0.6, 1.2, 4]} />
        <meshStandardMaterial color="#ffd83d" emissive="#ffd83d" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.6, 32]} />
        <meshBasicMaterial color="#ffd83d" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 2, 0]} color="#ffd83d" intensity={2} distance={10} />
    </group>
  );
}

export function WantedSystem() {
  const decayAccum = useRef(0);
  const spawnCooldown = useRef(0);
  const speedAccum = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const store = useGame.getState();
    if (!store.started || store.paused) return;

    // speed HUD sync
    speedAccum.current += dt;
    if (speedAccum.current > 0.1) {
      speedAccum.current = 0;
      if (playerState.mode === "drive") {
        const veh = vehicles.find((v) => v.id === playerState.activeVehicleId);
        store.setSpeed(veh ? Math.round(Math.abs(veh.speed) * 3.6) : 0);
      } else if (store.speedKmh !== 0) {
        store.setSpeed(0);
      }
    }

    // wanted decay
    if (store.wanted > 0) {
      decayAccum.current += dt;
      if (decayAccum.current > 9) {
        decayAccum.current = 0;
        store.setWanted(store.wanted - 1);
      }
    } else {
      decayAccum.current = 0;
    }

    // police spawn / despawn management
    const desiredActive = store.wanted;
    const active = vehicles.filter((v) => v.kind === "police" && v.mode === "ai-chase");
    if (active.length < desiredActive) {
      spawnCooldown.current -= dt;
      if (spawnCooldown.current <= 0) {
        spawnCooldown.current = 2.2;
        const spare = vehicles.find((v) => v.kind === "police" && v.mode === "inactive");
        if (spare) {
          const pos = getPlayerWorldPos();
          const ang = Math.random() * Math.PI * 2;
          spare.pos.set(pos.x + Math.sin(ang) * 40, 0, pos.z + Math.cos(ang) * 40);
          spare.speed = 0;
          spare.mode = "ai-chase";
        }
      }
    } else if (active.length > desiredActive) {
      const extra = active[0];
      extra.mode = "inactive";
      extra.pos.set(0, -80, 0);
    }

    if (store.wanted === 0) {
      for (const v of vehicles) {
        if (v.kind === "police" && v.mode === "ai-chase") {
          v.mode = "inactive";
          v.pos.set(0, -80, 0);
        }
      }
    }

    if (store.health <= 0 && !store.wasted) {
      store.pushToast("WASTED", "Respawning...");
    }
  });

  return null;
}

export function RespawnHandler() {
  const timer = useRef(0);
  useFrame((_, dt) => {
    const store = useGame.getState();
    if (!store.started || store.paused) return;
    if (store.wasted) {
      timer.current += dt;
      if (timer.current > 2.5) {
        timer.current = 0;
        playerState.pos.set(CITY.spawn.x, 0, CITY.spawn.z);
        playerState.mode = "walk";
        playerState.activeVehicleId = null;
        for (const v of vehicles) {
          if (v.mode === "player") v.mode = "idle";
        }
        store.respawn();
      }
    }
  });
  return null;
}
