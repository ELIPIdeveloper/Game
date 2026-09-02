import * as THREE from "three";
import { CITY, LoopPath } from "./cityData";
import { CarKind } from "./CarModel";

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const buildingColliders: AABB[] = CITY.buildings.map((b) => ({
  minX: b.position[0] - b.size[0] / 2,
  maxX: b.position[0] + b.size[0] / 2,
  minZ: b.position[2] - b.size[2] / 2,
  maxZ: b.position[2] + b.size[2] / 2,
}));

export function resolveCollisions(x: number, z: number, radius: number) {
  let px = x;
  let pz = z;
  for (const b of buildingColliders) {
    if (px > b.minX - radius && px < b.maxX + radius && pz > b.minZ - radius && pz < b.maxZ + radius) {
      const closestX = Math.max(b.minX, Math.min(px, b.maxX));
      const closestZ = Math.max(b.minZ, Math.min(pz, b.maxZ));
      const dx = px - closestX;
      const dz = pz - closestZ;
      const distSq = dx * dx + dz * dz;
      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq) || 0.0001;
        const push = radius - dist;
        px += (dx / dist) * push;
        pz += (dz / dist) * push;
      }
    }
  }
  return { x: px, z: pz };
}

export function turnTowards(current: number, target: number, maxDelta: number) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const clamped = Math.max(-maxDelta, Math.min(maxDelta, diff));
  return current + clamped;
}

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export type VehicleMode = "idle" | "ai-loop" | "ai-chase" | "player" | "inactive";

export interface VehicleState {
  id: number;
  kind: CarKind;
  color: string;
  pos: THREE.Vector3;
  heading: number;
  speed: number;
  steerVisual: number;
  mode: VehicleMode;
  loopIndex: number;
  loopSeg: number;
  loopT: number;
  health: number;
  wheelSpin: number;
  siren: boolean;
}

const CAR_COLORS = ["#d13b3b", "#2f6fdb", "#e8c93b", "#2f9e50", "#dedede", "#232323", "#ff8c1a", "#7a3bd1"];

function buildInitialVehicles(): VehicleState[] {
  const list: VehicleState[] = [];
  let id = 0;
  for (const v of CITY.vehicleSpawns) {
    list.push({
      id: id++,
      kind: v.kind,
      color: v.color,
      pos: new THREE.Vector3(v.x, 0, v.z),
      heading: v.ry,
      speed: 0,
      steerVisual: 0,
      mode: "idle",
      loopIndex: -1,
      loopSeg: 0,
      loopT: 0,
      health: 100,
      wheelSpin: 0,
      siren: false,
    });
  }
  const loopCount = CITY.vehicleLoops.length;
  const trafficCount = 22;
  for (let i = 0; i < trafficCount; i++) {
    const li = i % loopCount;
    const loop = CITY.vehicleLoops[li];
    const seg = Math.floor(Math.random() * loop.points.length);
    const kindRoll = Math.random();
    list.push({
      id: id++,
      kind: kindRoll < 0.15 ? "truck" : kindRoll < 0.45 ? "sport" : "sedan",
      color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
      pos: new THREE.Vector3(loop.points[seg].x, 0, loop.points[seg].z),
      heading: 0,
      speed: 7 + Math.random() * 5,
      steerVisual: 0,
      mode: "ai-loop",
      loopIndex: li,
      loopSeg: seg,
      loopT: Math.random(),
      health: 100,
      wheelSpin: 0,
      siren: false,
    });
  }
  for (let i = 0; i < 4; i++) {
    list.push({
      id: id++,
      kind: "police",
      color: "#111827",
      pos: new THREE.Vector3(0, -80, 0),
      heading: 0,
      speed: 0,
      steerVisual: 0,
      mode: "inactive",
      loopIndex: -1,
      loopSeg: 0,
      loopT: 0,
      health: 100,
      wheelSpin: 0,
      siren: false,
    });
  }
  return list;
}

export const vehicles: VehicleState[] = buildInitialVehicles();

export interface PedestrianState {
  id: number;
  pos: THREE.Vector3;
  heading: number;
  loopIndex: number;
  loopSeg: number;
  loopT: number;
  speed: number;
  color: string;
  alive: boolean;
  bobT: number;
  respawnTimer: number;
}

const PED_COLORS = ["#e0b089", "#8a5a3a", "#3a2a1a", "#c9915a", "#7a5540", "#f0c9a0"];
const SHIRT_COLORS = ["#2f6fdb", "#d13b3b", "#2f9e50", "#e8c93b", "#7a3bd1", "#333333", "#ff8c1a", "#eeeeee"];

function buildInitialPedestrians(): PedestrianState[] {
  const list: PedestrianState[] = [];
  const loops = CITY.pedestrianLoops;
  if (!loops.length) return list;
  for (let i = 0; i < 55; i++) {
    const li = Math.floor(Math.random() * loops.length);
    const loop = loops[li];
    const seg = Math.floor(Math.random() * loop.points.length);
    list.push({
      id: i,
      pos: new THREE.Vector3(loop.points[seg].x, 0, loop.points[seg].z),
      heading: 0,
      loopIndex: li,
      loopSeg: seg,
      loopT: Math.random(),
      speed: 1.1 + Math.random() * 1.1,
      color: SHIRT_COLORS[i % SHIRT_COLORS.length],
      alive: true,
      bobT: Math.random() * 10,
      respawnTimer: 0,
    });
  }
  return list;
}

export const pedestrians: PedestrianState[] = buildInitialPedestrians();
export const skinColors = PED_COLORS;

export function stepLoop(pos: THREE.Vector3, headingHolder: { v: number }, loop: LoopPath, seg: { seg: number; t: number }, speed: number, dt: number, turnRate: number) {
  const pts = loop.points;
  const from = pts[seg.seg % pts.length];
  const to = pts[(seg.seg + 1) % pts.length];
  const segLen = Math.hypot(to.x - from.x, to.z - from.z) || 1;
  seg.t += (speed * dt) / segLen;
  if (seg.t >= 1) {
    seg.t = 0;
    seg.seg = (seg.seg + 1) % pts.length;
  }
  const nx = from.x + (to.x - from.x) * seg.t;
  const nz = from.z + (to.z - from.z) * seg.t;
  pos.x = nx;
  pos.z = nz;
  const desired = Math.atan2(to.x - from.x, to.z - from.z);
  headingHolder.v = turnTowards(headingHolder.v, desired, turnRate * dt);
}

export const playerState = {
  pos: new THREE.Vector3(CITY.spawn.x, 0, CITY.spawn.z),
  heading: 0,
  vSpeed: 0,
  grounded: true,
  moving: false,
  running: false,
  mode: "walk" as "walk" | "drive",
  activeVehicleId: null as number | null,
};

export const cameraState = {
  yaw: 0,
};

export const missionTarget = {
  x: CITY.missionSpots[0]?.x ?? 0,
  z: CITY.missionSpots[0]?.z ?? 0,
};
