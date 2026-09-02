import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { input } from "./input";
import { playerState, vehicles, cameraState } from "./world";
import { updatePlayerWalk } from "./vehiclePhysics";
import { useGame } from "./store";
import { killNearestPedestrian } from "./Pedestrians";
import { audioEngine } from "./audio";

function PlayerMesh() {
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    const moving = playerState.moving;
    const speedMul = playerState.running ? 2.1 : 1;
    if (moving) t.current += dt * 8 * speedMul;
    const s = moving ? Math.sin(t.current) * 0.7 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = s;
    if (rightLeg.current) rightLeg.current.rotation.x = -s;
    if (leftArm.current) leftArm.current.rotation.x = -s;
    if (rightArm.current) rightArm.current.rotation.x = s;
  });

  return (
    <group>
      <mesh position={[0, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#e0b089" />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.44, 0.55, 0.26]} />
        <meshStandardMaterial color="#3355aa" />
      </mesh>
      <group ref={leftArm} position={[0.3, 1.12, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.42, 4, 8]} />
          <meshStandardMaterial color="#3355aa" />
        </mesh>
      </group>
      <group ref={rightArm} position={[-0.3, 1.12, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.42, 4, 8]} />
          <meshStandardMaterial color="#3355aa" />
        </mesh>
      </group>
      <group ref={leftLeg} position={[0.13, 0.62, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
          <meshStandardMaterial color="#22252b" />
        </mesh>
      </group>
      <group ref={rightLeg} position={[-0.13, 0.62, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
          <meshStandardMaterial color="#22252b" />
        </mesh>
      </group>
    </group>
  );
}

export function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const prevE = useRef(false);
  const prevH = useRef(false);
  const fireCooldown = useRef(0);
  const { camera } = useThree();

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const store = useGame.getState();
    if (store.paused || !store.started || store.wasted) {
      input.fireRequested = false;
      return;
    }

    if (playerState.mode === "walk") {
      updatePlayerWalk(dt, cameraState.yaw);
    }

    // enter / exit vehicles
    const eDown = input.isDown("KeyE");
    const eJustPressed = eDown && !prevE.current;
    prevE.current = eDown;
    if (eJustPressed) {
      if (playerState.mode === "walk") {
        let nearest: (typeof vehicles)[number] | null = null;
        let bestD = 4.6;
        for (const v of vehicles) {
          if (v.mode !== "idle" && v.mode !== "ai-loop") continue;
          const d = Math.hypot(v.pos.x - playerState.pos.x, v.pos.z - playerState.pos.z);
          if (d < bestD) {
            bestD = d;
            nearest = v;
          }
        }
        if (nearest) {
          nearest.mode = "player";
          nearest.speed = 0;
          playerState.mode = "drive";
          playerState.activeVehicleId = nearest.id;
          store.setInVehicle(true, nearest.kind);
          store.pushToast(`Entered ${nearest.kind}`, "Press E to exit");
        }
      } else {
        const veh = vehicles.find((v) => v.id === playerState.activeVehicleId);
        if (veh) {
          veh.mode = "idle";
          veh.speed = 0;
          const perp = veh.heading + Math.PI / 2;
          playerState.pos.set(veh.pos.x + Math.sin(perp) * 2.6, 0, veh.pos.z + Math.cos(perp) * 2.6);
          playerState.heading = veh.heading;
        }
        playerState.mode = "walk";
        playerState.activeVehicleId = null;
        store.setInVehicle(false);
      }
    }

    // weapon equip
    if (input.isDown("Digit1")) store.setWeapon("fist");
    if (input.isDown("Digit2")) {
      if (store.weapon !== "pistol") store.setAmmo(120);
      store.setWeapon("pistol");
    }

    fireCooldown.current -= dt;
    if (playerState.mode === "walk" && store.weapon === "pistol" && input.fireRequested && fireCooldown.current <= 0 && store.ammo > 0) {
      fireCooldown.current = 0.22;
      store.setAmmo(store.ammo - 1);
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const from = playerState.pos.clone();
      from.y = 1.1;
      const hitX = from.x + dir.x * 18;
      const hitZ = from.z + dir.z * 18;
      const killed = killNearestPedestrian(hitX, hitZ, 3.2);
      audioEngine.playGunshot();
      if (killed) {
        store.bumpWanted(1);
        store.pushToast("Witnesses called the cops!");
      }
    }
    input.fireRequested = false;

    const hDown = input.isDown("KeyH");
    if (hDown && !prevH.current && playerState.mode === "drive") {
      audioEngine.playHonk();
    }
    prevH.current = hDown;

    if (groupRef.current) {
      groupRef.current.visible = playerState.mode === "walk";
      groupRef.current.position.set(playerState.pos.x, playerState.pos.y, playerState.pos.z);
      groupRef.current.rotation.y = playerState.heading;
    }
  });

  return (
    <group ref={groupRef}>
      <PlayerMesh />
    </group>
  );
}
