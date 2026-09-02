import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";
import { input } from "./input";
import { playerState, vehicles, cameraState, turnTowards } from "./world";
import { useGame } from "./store";

const tmpPos = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

export function CameraRig() {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(playerState.pos.x, 3, playerState.pos.z + 8));
  const smoothLook = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const store = useGame.getState();
    if (!store.started || store.paused) return;

    const driving = playerState.mode === "drive";
    const veh = driving ? vehicles.find((v) => v.id === playerState.activeVehicleId) : null;
    const targetPos = veh ? veh.pos : playerState.pos;
    const targetHeading = veh ? veh.heading : playerState.heading;
    const targetSpeed = veh ? Math.abs(veh.speed) : playerState.moving ? (playerState.running ? 6.6 : 3.3) : 0;

    if (!input.dragging) {
      let autoTarget = input.orbitYaw;
      if (targetSpeed > 0.6) autoTarget = targetHeading;
      input.orbitYaw = turnTowards(input.orbitYaw, autoTarget, 1.35 * dt);
    }
    cameraState.yaw = input.orbitYaw;

    const dist = (veh ? 8.5 : 5.4) * input.zoom;
    const pitch = input.orbitPitch;
    const height = Math.sin(pitch) * dist + (veh ? 1.6 : 1.3);
    const horiz = Math.cos(pitch) * dist;
    const theta = input.orbitYaw;
    const fwd = { x: Math.sin(theta), z: Math.cos(theta) };

    tmpPos.set(targetPos.x - fwd.x * horiz, targetPos.y + height, targetPos.z - fwd.z * horiz);
    tmpLook.set(targetPos.x, targetPos.y + (veh ? 1.4 : 1.5), targetPos.z);

    if (!initialized.current) {
      smoothPos.current.copy(tmpPos);
      smoothLook.current.copy(tmpLook);
      initialized.current = true;
    } else {
      const k = 1 - Math.pow(0.001, dt);
      smoothPos.current.lerp(tmpPos, Math.min(1, k * 6));
      smoothLook.current.lerp(tmpLook, Math.min(1, k * 8));
    }

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLook.current);
  });

  return null;
}
