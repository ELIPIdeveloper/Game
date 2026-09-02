import { mulberry32, pick } from "./rng";

export const GRID = 7;
export const BLOCK = 34;
export const ROAD = 15;
export const CELL = BLOCK + ROAD;
export const CITY_SPAN = GRID * CELL;
export const CENTER_INDEX = (GRID - 1) / 2;

export function cellCenter(i: number) {
  return (i - CENTER_INDEX) * CELL;
}
export function roadLine(k: number) {
  return CELL * (k - GRID / 2);
}

export interface Building {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  kind: "tower" | "midrise" | "house" | "warehouse";
  roofColor?: string;
  seed: number;
}
export interface BlockInfo {
  i: number;
  j: number;
  cx: number;
  cz: number;
  type: "downtown" | "commercial" | "residential" | "industrial" | "park" | "plaza";
}
export interface Prop {
  x: number;
  z: number;
  scale: number;
  ry: number;
}
export interface ParkedCar {
  x: number;
  z: number;
  ry: number;
  color: string;
  kind: "sedan" | "sport" | "truck";
}
export interface LoopPath {
  points: { x: number; z: number }[];
  dir: 1 | -1;
}

const TOWER_COLORS = ["#3d4658", "#57708a", "#2e3a4f", "#6b7f95", "#40506b", "#8a97a8"];
const MIDRISE_COLORS = ["#b5764f", "#a3532f", "#7a8a6b", "#c9a35a", "#6b7f9a", "#9a5c4a"];
const HOUSE_COLORS = ["#c97b63", "#d9b26a", "#8fa88a", "#c4c9a8", "#a86d6d", "#7f9bb0"];
const ROOF_COLORS = ["#5c3a2e", "#3b3b3b", "#6b4a3a", "#2f2f2f"];
const WAREHOUSE_COLORS = ["#8a8f8f", "#7a6a5a", "#93765f", "#6f7570"];
const CAR_COLORS = ["#d13b3b", "#2f6fdb", "#e8c93b", "#2f9e50", "#e0e0e0", "#232323", "#ff8c1a", "#7a3bd1"];

export interface CityData {
  blocks: BlockInfo[];
  buildings: Building[];
  trees: Prop[];
  streetlights: { x: number; z: number }[];
  trafficLights: { x: number; z: number; ry: number }[];
  parkedCars: ParkedCar[];
  vehicleLoops: LoopPath[];
  pedestrianLoops: LoopPath[];
  spawn: { x: number; z: number };
  vehicleSpawns: ParkedCar[];
  missionSpots: { x: number; z: number }[];
}

export function generateCity(seed = 1337): CityData {
  const rand = mulberry32(seed);
  const blocks: BlockInfo[] = [];
  const buildings: Building[] = [];
  const trees: Prop[] = [];
  const streetlights: { x: number; z: number }[] = [];
  const trafficLights: { x: number; z: number; ry: number }[] = [];
  const parkedCars: ParkedCar[] = [];
  const missionSpots: { x: number; z: number }[] = [];

  const centerI = Math.floor(GRID / 2);
  const centerJ = Math.floor(GRID / 2);

  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const ring = Math.max(Math.abs(i - CENTER_INDEX), Math.abs(j - CENTER_INDEX));
      const cx = cellCenter(i);
      const cz = cellCenter(j);
      let type: BlockInfo["type"];
      if (i === centerI && j === centerJ) type = "plaza";
      else if (ring <= 1.5) type = "downtown";
      else if (ring <= 2.5) type = rand() < 0.15 ? "park" : "commercial";
      else type = rand() < 0.12 ? "park" : rand() < 0.5 ? "residential" : "industrial";

      blocks.push({ i, j, cx, cz, type });

      const half = BLOCK / 2;
      const seedForBlock = Math.floor(rand() * 1e6);

      if (type === "plaza") {
        // open plaza with fountain, spawn point
        trees.push({ x: cx - 10, z: cz - 10, scale: 1, ry: rand() * Math.PI });
        trees.push({ x: cx + 10, z: cz - 10, scale: 1, ry: rand() * Math.PI });
        trees.push({ x: cx - 10, z: cz + 10, scale: 1, ry: rand() * Math.PI });
        trees.push({ x: cx + 10, z: cz + 10, scale: 1, ry: rand() * Math.PI });
      } else if (type === "downtown") {
        const twoTowers = rand() < 0.4;
        if (twoTowers) {
          const w = half * 0.75;
          for (const side of [-1, 1]) {
            const h = 45 + rand() * 75;
            buildings.push({
              position: [cx + side * (half * 0.5), h / 2, cz],
              size: [w, h, half * 1.4],
              color: pick(rand, TOWER_COLORS),
              kind: "tower",
              seed: seedForBlock + side,
            });
          }
        } else {
          const h = 55 + rand() * 90;
          buildings.push({
            position: [cx, h / 2, cz],
            size: [half * 1.5, h, half * 1.5],
            color: pick(rand, TOWER_COLORS),
            kind: "tower",
            seed: seedForBlock,
          });
        }
      } else if (type === "commercial") {
        const n = 2;
        const sub = (half * 2) / n;
        for (let a = 0; a < n; a++) {
          for (let b = 0; b < n; b++) {
            if (rand() < 0.15) continue;
            const h = 14 + rand() * 22;
            const bx = cx - half + sub * a + sub / 2;
            const bz = cz - half + sub * b + sub / 2;
            buildings.push({
              position: [bx, h / 2, bz],
              size: [sub * 0.8, h, sub * 0.8],
              color: pick(rand, MIDRISE_COLORS),
              kind: "midrise",
              seed: seedForBlock + a * 3 + b,
            });
          }
        }
      } else if (type === "residential") {
        const n = 3;
        const sub = (half * 2) / n;
        for (let a = 0; a < n; a++) {
          for (let b = 0; b < n; b++) {
            if (rand() < 0.2) continue;
            const h = 5 + rand() * 4;
            const bx = cx - half + sub * a + sub / 2;
            const bz = cz - half + sub * b + sub / 2;
            buildings.push({
              position: [bx, h / 2, bz],
              size: [sub * 0.7, h, sub * 0.7],
              color: pick(rand, HOUSE_COLORS),
              kind: "house",
              roofColor: pick(rand, ROOF_COLORS),
              seed: seedForBlock + a * 5 + b,
            });
            if (rand() < 0.5) trees.push({ x: bx + sub * 0.45, z: bz - sub * 0.45, scale: 0.7 + rand() * 0.5, ry: rand() * Math.PI });
          }
        }
      } else if (type === "industrial") {
        const twoSheds = rand() < 0.5;
        if (twoSheds) {
          for (const side of [-1, 1]) {
            const h = 9 + rand() * 6;
            buildings.push({
              position: [cx + side * half * 0.45, h / 2, cz],
              size: [half * 0.8, h, half * 1.5],
              color: pick(rand, WAREHOUSE_COLORS),
              kind: "warehouse",
              seed: seedForBlock + side,
            });
          }
        } else {
          const h = 10 + rand() * 8;
          buildings.push({
            position: [cx, h / 2, cz],
            size: [half * 1.6, h, half * 1.6],
            color: pick(rand, WAREHOUSE_COLORS),
            kind: "warehouse",
            seed: seedForBlock,
          });
        }
      } else if (type === "park") {
        const count = 6 + Math.floor(rand() * 6);
        for (let t = 0; t < count; t++) {
          const ang = rand() * Math.PI * 2;
          const rad = rand() * half * 0.8;
          trees.push({ x: cx + Math.cos(ang) * rad, z: cz + Math.sin(ang) * rad, scale: 0.8 + rand() * 0.6, ry: rand() * Math.PI });
        }
      }

      // occasional parked cars along the block edge for detail (not on plaza)
      if (type !== "plaza" && rand() < 0.6) {
        const edge = Math.floor(rand() * 4);
        const off = (rand() - 0.5) * BLOCK * 0.6;
        const gap = half + 3.2;
        let x = cx,
          z = cz,
          ry = 0;
        if (edge === 0) {
          x = cx + off;
          z = cz - gap;
          ry = 0;
        } else if (edge === 1) {
          x = cx + off;
          z = cz + gap;
          ry = Math.PI;
        } else if (edge === 2) {
          x = cx - gap;
          z = cz + off;
          ry = Math.PI / 2;
        } else {
          x = cx + gap;
          z = cz + off;
          ry = -Math.PI / 2;
        }
        parkedCars.push({ x, z, ry, color: pick(rand, CAR_COLORS), kind: rand() < 0.2 ? "truck" : rand() < 0.5 ? "sport" : "sedan" });
      }

      if ((type === "commercial" || type === "downtown") && rand() < 0.5) {
        missionSpots.push({ x: cx, z: cz });
      }
    }
  }

  // streetlights + traffic lights at every road intersection
  for (let k = 0; k <= GRID; k++) {
    for (let m = 0; m <= GRID; m++) {
      const x = roadLine(k);
      const z = roadLine(m);
      streetlights.push({ x: x + 4, z: z + 4 });
      streetlights.push({ x: x - 4, z: z - 4 });
      if (k > 0 && k < GRID && m > 0 && m < GRID) {
        trafficLights.push({ x: x + 3.5, z: z + 3.5, ry: 0 });
        trafficLights.push({ x: x - 3.5, z: z - 3.5, ry: Math.PI });
      }
    }
  }

  // concentric square vehicle loops (two directions = two lanes of "traffic")
  const vehicleLoops: LoopPath[] = [];
  const maxRing = Math.floor(GRID / 2) - 1;
  for (let k = 0; k <= maxRing; k++) {
    const min = roadLine(k);
    const max = roadLine(GRID - k);
    if (max - min < 20) continue;
    const insetIn = 3.2;
    const insetOut = -3.2;
    for (const [inset, dir] of [
      [insetIn, 1],
      [insetOut, -1],
    ] as [number, 1 | -1][]) {
      const a = min + inset;
      const b = max - inset;
      const pts =
        dir === 1
          ? [
              { x: a, z: a },
              { x: b, z: a },
              { x: b, z: b },
              { x: a, z: b },
            ]
          : [
              { x: a, z: a },
              { x: a, z: b },
              { x: b, z: b },
              { x: b, z: a },
            ];
      vehicleLoops.push({ points: pts, dir });
    }
  }

  // pedestrian loops around each block's sidewalk perimeter
  const pedestrianLoops: LoopPath[] = [];
  for (const b of blocks) {
    if (b.type === "plaza") continue;
    const half = BLOCK / 2 - 2.5;
    const a = -half,
      c = half;
    pedestrianLoops.push({
      points: [
        { x: b.cx + a, z: b.cz + a },
        { x: b.cx + c, z: b.cz + a },
        { x: b.cx + c, z: b.cz + c },
        { x: b.cx + a, z: b.cz + c },
      ],
      dir: 1,
    });
  }

  const spawn = { x: cellCenter(centerI), z: cellCenter(centerJ) + 6 };
  const vehicleSpawns: ParkedCar[] = [
    { x: spawn.x - 8, z: spawn.z + 10, ry: 0, color: "#e0e0e0", kind: "sport" },
    { x: spawn.x + 8, z: spawn.z + 10, ry: 0, color: "#2f6fdb", kind: "sedan" },
    { x: spawn.x, z: spawn.z + 16, ry: Math.PI, color: "#c0392b", kind: "truck" },
  ];

  return {
    blocks,
    buildings,
    trees,
    streetlights,
    trafficLights,
    parkedCars,
    vehicleLoops,
    pedestrianLoops,
    spawn,
    vehicleSpawns,
    missionSpots,
  };
}

export const CITY = generateCity(1337);
