import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CarModel } from "./CarModel";
import { vehicles, playerState } from "./world";
import { updateAiChaseVehicle, updateAiLoopVehicle, updatePlayerVehicle } from "./vehiclePhysics";
import { useGame } from "./store";
import { audioEngine } from "./audio";

export function VehiclesLayer() {
  const groupRefs = useRef(new Map<number, THREE.Group>());
  const wheelRefs = useRef(new Map<number, THREE.Object3D[]>());
  const wanted = useRef(0);
  const crashCooldown = useRef(0);

  useFrame((_, rawDt) => {
    const gs = useGame.getState();
    if (!gs.started || gs.paused || gs.wasted) return;
    const dt = Math.min(rawDt, 0.05);
    wanted.current = gs.wanted;
    let closestChaseDist = Infinity;
    crashCooldown.current -= dt;

    for (const v of vehicles) {
      if (v.mode === "player") {
        const impact = updatePlayerVehicle(v, dt);
        if (impact > 0 && crashCooldown.current <= 0) {
          crashCooldown.current = 0.7;
          useGame.getState().damage(Math.min(45, impact * 2.2));
        }
      } else if (v.mode === "ai-loop") {
        updateAiLoopVehicle(v, dt);
      } else if (v.mode === "ai-chase") {
        const targetPos = playerState.mode === "drive" ? vehicles.find((x) => x.id === playerState.activeVehicleId)?.pos : playerState.pos;
        const tp = targetPos ?? playerState.pos;
        const d = updateAiChaseVehicle(v, dt, tp.x, tp.z);
        if (d < closestChaseDist) closestChaseDist = d;
      }

      const wheels = wheelRefs.current.get(v.id);
      if (wheels && wheels.length) {
        const spin = (v.speed * dt) / 0.42;
        wheels.forEach((w, i) => {
          w.rotation.x += spin;
          if (i < 2) w.rotation.y = v.steerVisual;
        });
      }
      const grp = groupRefs.current.get(v.id);
      if (grp) {
        grp.position.set(v.pos.x, 0, v.pos.z);
        grp.rotation.y = v.heading;
      }
    }

    if (wanted.current > 0 && closestChaseDist < 2.8) {
      useGame.getState().pushToast("BUSTED!", "Police caught up with you");
      useGame.getState().setWanted(0);
      for (const v of vehicles) if (v.mode === "ai-chase") v.mode = "inactive";
    } else if (wanted.current > 0 && closestChaseDist < 4.8) {
      useGame.getState().damage(9 * dt);
    }

    const playerVeh = vehicles.find((v) => v.mode === "player");
    audioEngine.updateEngine(playerVeh ? Math.min(1, Math.abs(playerVeh.speed) / 30) : 0, !!playerVeh);
    audioEngine.updateSiren(wanted.current > 0);
  });

  return (
    <group>
      {vehicles.map((v) => (
        <group
          key={v.id}
          ref={(g) => {
            if (g) groupRefs.current.set(v.id, g);
          }}
          visible={v.mode !== "inactive"}
        >
          <CarModel
            kind={v.kind}
            color={v.color}
            headlightsOn={true}
            wheelRefs={{
              get current() {
                let arr = wheelRefs.current.get(v.id);
                if (!arr) {
                  arr = [];
                  wheelRefs.current.set(v.id, arr);
                }
                return arr;
              },
              set current(arr: THREE.Object3D[]) {
                wheelRefs.current.set(v.id, arr);
              },
            }}
          />
          {v.kind === "police" && (
            <group>
              <pointLight position={[0, 3, 0]} color="#3355ff" intensity={0} />
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
