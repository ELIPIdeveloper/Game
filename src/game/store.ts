import { create } from "zustand";

export type WeaponType = "fist" | "pistol" | "smg";

interface Toast {
  id: number;
  text: string;
  sub?: string;
}

interface GameState {
  started: boolean;
  paused: boolean;
  health: number;
  armor: number;
  money: number;
  wanted: number;
  inVehicle: boolean;
  vehicleKind: string | null;
  speedKmh: number;
  weapon: WeaponType;
  ammo: number;
  clock: string;
  missionActive: boolean;
  missionLabel: string;
  missionDistance: number;
  toasts: Toast[];
  wasted: boolean;

  start: () => void;
  togglePause: () => void;
  setHealth: (v: number) => void;
  damage: (v: number) => void;
  addMoney: (v: number) => void;
  setWanted: (v: number) => void;
  bumpWanted: (v: number) => void;
  setInVehicle: (v: boolean, kind?: string | null) => void;
  setSpeed: (v: number) => void;
  setWeapon: (w: WeaponType) => void;
  setAmmo: (v: number) => void;
  setClock: (v: string) => void;
  setMission: (label: string, distance: number) => void;
  clearMission: () => void;
  setMissionDistance: (d: number) => void;
  pushToast: (text: string, sub?: string) => void;
  respawn: () => void;
}

let toastId = 0;

export const useGame = create<GameState>((set) => ({
  started: false,
  paused: false,
  health: 100,
  armor: 0,
  money: 2500,
  wanted: 0,
  inVehicle: false,
  vehicleKind: null,
  speedKmh: 0,
  weapon: "fist",
  ammo: 0,
  clock: "12:00",
  missionActive: false,
  missionLabel: "",
  missionDistance: 0,
  toasts: [],
  wasted: false,

  start: () => set({ started: true }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setHealth: (v) => set({ health: Math.max(0, Math.min(100, v)) }),
  damage: (v) =>
    set((s) => {
      const nh = Math.max(0, s.health - v);
      if (nh <= 0 && !s.wasted) {
        return { health: 0, wasted: true };
      }
      return { health: nh };
    }),
  addMoney: (v) => set((s) => ({ money: Math.max(0, s.money + v) })),
  setWanted: (v) => set({ wanted: Math.max(0, Math.min(5, v)) }),
  bumpWanted: (v) =>
    set((s) => ({ wanted: Math.max(0, Math.min(5, s.wanted + v)) })),
  setInVehicle: (v, kind = null) => set({ inVehicle: v, vehicleKind: kind }),
  setSpeed: (v) => set({ speedKmh: v }),
  setWeapon: (w) => set({ weapon: w }),
  setAmmo: (v) => set({ ammo: Math.max(0, v) }),
  setClock: (v) => set({ clock: v }),
  setMission: (label, distance) => set({ missionActive: true, missionLabel: label, missionDistance: distance }),
  clearMission: () => set({ missionActive: false, missionLabel: "", missionDistance: 0 }),
  setMissionDistance: (d) => set({ missionDistance: d }),
  pushToast: (text, sub) =>
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id: ++toastId, text, sub }] })),
  respawn: () =>
    set({ health: 100, armor: 0, wanted: 0, wasted: false, inVehicle: false, vehicleKind: null }),
}));
