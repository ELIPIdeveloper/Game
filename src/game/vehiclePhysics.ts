import { input } from "./input";
import { CITY } from "./cityData";
import { VehicleState, resolveCollisions, turnTowards, clamp, stepLoop, playerState } from "./world";

const SPECS: Record<string, { maxSpeed: number; accel: number; brake: number; drag: number; turn: number }> = {
  sedan: { maxSpeed: 30, accel: 11, brake: 20, drag: 4.5, turn: 2.0 },
  sport: { maxSpeed: 42, accel: 16, brake: 22, drag: 4, turn: 2.4 },
  truck: { maxSpeed: 22, accel: 6.5, brake: 16, drag: 5, turn: 1.4 },
  police: { maxSpeed: 34, accel: 13, brake: 20, drag: 4.2, turn: 2.1 },
};

export function updatePlayerVehicle(v: VehicleState, dt: number): number {
  const spec = SPECS[v.kind] ?? SPECS.sedan;
  const forward = (input.isDown("KeyW") || input.isDown("ArrowUp") ? 1 : 0) - (input.isDown("KeyS") || input.isDown("ArrowDown") ? 1 : 0);
  const steer = (input.isDown("KeyA") || input.isDown("ArrowLeft") ? 1 : 0) - (input.isDown("KeyD") || input.isDown("ArrowRight") ? 1 : 0);
  const handbrake = input.isDown("Space");

  if (forward > 0) v.speed += spec.accel * dt;
  else if (forward < 0) {
    if (v.speed > 0.2) v.speed -= spec.brake * dt;
    else v.speed -= spec.accel * 0.6 * dt;
  } else {
    v.speed -= Math.sign(v.speed) * spec.drag * dt;
  }
  if (handbrake) v.speed -= Math.sign(v.speed) * spec.brake * 1.4 * dt;
  v.speed = clamp(v.speed, -spec.maxSpeed * 0.45, spec.maxSpeed);
  if (Math.abs(v.speed) < 0.06) v.speed = 0;

  const speedFactor = Math.min(1, Math.abs(v.speed) / 9);
  const turnRate = spec.turn * speedFactor + 0.25;
  if (Math.abs(v.speed) > 0.05) {
    v.heading += steer * turnRate * dt * Math.sign(v.speed);
  }
  v.steerVisual = steer * 0.45;

  const fwd = { x: Math.sin(v.heading), z: Math.cos(v.heading) };
  const preImpactSpeed = Math.abs(v.speed);
  const nx = v.pos.x + fwd.x * v.speed * dt;
  const nz = v.pos.z + fwd.z * v.speed * dt;
  const resolved = resolveCollisions(nx, nz, 2.3);
  const pen = Math.abs(resolved.x - nx) + Math.abs(resolved.z - nz);
  let crashImpact = 0;
  if (pen > 0.03) {
    v.speed *= 0.55;
    if (preImpactSpeed > 11) crashImpact = preImpactSpeed - 11;
  }
  v.pos.x = resolved.x;
  v.pos.z = resolved.z;
  return crashImpact;
}

export function updateAiLoopVehicle(v: VehicleState, dt: number) {
  const loop = CITY.vehicleLoops[v.loopIndex];
  if (!loop) return;
  const headingHolder = { v: v.heading };
  const seg = { seg: v.loopSeg, t: v.loopT };
  stepLoop(v.pos, headingHolder, loop, seg, v.speed, dt, 2.2);
  v.heading = headingHolder.v;
  v.loopSeg = seg.seg;
  v.loopT = seg.t;
  v.steerVisual = 0;
}

export function updateAiChaseVehicle(v: VehicleState, dt: number, targetX: number, targetZ: number) {
  const spec = SPECS.police;
  const dx = targetX - v.pos.x;
  const dz = targetZ - v.pos.z;
  const dist = Math.hypot(dx, dz);
  const desiredHeading = Math.atan2(dx, dz);
  const speedFactor = Math.min(1, Math.abs(v.speed) / 9);
  const turnRate = spec.turn * speedFactor + 0.6;
  v.heading = turnTowards(v.heading, desiredHeading, turnRate * dt);

  if (dist > 6) v.speed += spec.accel * dt;
  else v.speed -= spec.brake * 0.5 * dt;
  v.speed = clamp(v.speed, 0, spec.maxSpeed);

  const fwd = { x: Math.sin(v.heading), z: Math.cos(v.heading) };
  const nx = v.pos.x + fwd.x * v.speed * dt;
  const nz = v.pos.z + fwd.z * v.speed * dt;
  const resolved = resolveCollisions(nx, nz, 2.3);
  const pen = Math.abs(resolved.x - nx) + Math.abs(resolved.z - nz);
  if (pen > 0.03) v.speed *= 0.5;
  v.pos.x = resolved.x;
  v.pos.z = resolved.z;
  v.siren = true;
  return dist;
}

export function updatePlayerWalk(dt: number, cameraYaw: number) {
  const forward = (input.isDown("KeyW") || input.isDown("ArrowUp") ? 1 : 0) - (input.isDown("KeyS") || input.isDown("ArrowDown") ? 1 : 0);
  const strafe = (input.isDown("KeyD") || input.isDown("ArrowRight") ? 1 : 0) - (input.isDown("KeyA") || input.isDown("ArrowLeft") ? 1 : 0);
  const running = input.isDown("ShiftLeft") || input.isDown("ShiftRight");

  let mx = 0,
    mz = 0;
  if (forward !== 0 || strafe !== 0) {
    const len = Math.hypot(forward, strafe) || 1;
    const fN = forward / len;
    const sN = strafe / len;
    mx = Math.sin(cameraYaw) * fN + Math.cos(cameraYaw) * sN;
    mz = Math.cos(cameraYaw) * fN - Math.sin(cameraYaw) * sN;
  }
  const moving = mx !== 0 || mz !== 0;
  const speed = running ? 6.6 : 3.3;

  if (moving) {
    const desired = Math.atan2(mx, mz);
    playerState.heading = turnTowards(playerState.heading, desired, 14 * dt);
    const nx = playerState.pos.x + mx * speed * dt;
    const nz = playerState.pos.z + mz * speed * dt;
    const resolved = resolveCollisions(nx, nz, 0.45);
    playerState.pos.x = resolved.x;
    playerState.pos.z = resolved.z;
  }
  playerState.moving = moving;
  playerState.running = running && moving;

  // simple jump / gravity (visual only, ground is flat)
  if (input.isDown("Space") && playerState.grounded) {
    playerState.vSpeed = 5.4;
    playerState.grounded = false;
  }
  playerState.vSpeed -= 18 * dt;
  playerState.pos.y += playerState.vSpeed * dt;
  if (playerState.pos.y <= 0) {
    playerState.pos.y = 0;
    playerState.vSpeed = 0;
    playerState.grounded = true;
  }
}
