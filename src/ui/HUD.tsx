import { useEffect, useState } from "react";
import { useGame } from "../game/store";
import { Minimap } from "./Minimap";

function WantedStars({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-lg leading-none ${i < level ? "text-yellow-400" : "text-white/20"}`} style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}>
          ★
        </span>
      ))}
    </div>
  );
}

function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed left-1/2 top-6 z-40 flex -translate-x-1/2 flex-col items-center gap-1">
      {toasts.map((t) => (
        <div key={t.id} className="animate-[fadeSlide_3.5s_ease-out] rounded bg-black/60 px-4 py-1.5 text-center backdrop-blur-sm">
          <div className="text-sm font-bold tracking-wide text-white">{t.text}</div>
          {t.sub && <div className="text-xs text-yellow-300">{t.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function ControlsHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setVisible(false), 9000);
    return () => clearTimeout(id);
  }, []);
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-black/55 px-5 py-3 text-center text-xs text-white/90 backdrop-blur-sm">
      <div className="mb-1 font-bold tracking-widest text-yellow-400">CONTROLS</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-left">
        <span>WASD — move / drive</span>
        <span>Shift — sprint</span>
        <span>Space — jump / handbrake</span>
        <span>E — enter / exit vehicle</span>
        <span>Mouse drag — look around</span>
        <span>Scroll — zoom camera</span>
        <span>1 / 2 — fists / pistol</span>
        <span>Left click — fire weapon</span>
        <span>H — car horn</span>
        <span>ESC — pause</span>
      </div>
    </div>
  );
}

function Speedometer() {
  const speed = useGame((s) => s.speedKmh);
  const inVehicle = useGame((s) => s.inVehicle);
  const kind = useGame((s) => s.vehicleKind);
  if (!inVehicle) return null;
  return (
    <div className="fixed bottom-8 right-8 z-30 flex flex-col items-end">
      <div className="rounded-xl border border-white/10 bg-black/55 px-5 py-3 text-right backdrop-blur-sm">
        <div className="text-4xl font-black italic text-white tabular-nums">{speed}</div>
        <div className="-mt-1 text-[10px] font-semibold tracking-widest text-white/60">KM/H</div>
        <div className="mt-1 text-xs font-bold uppercase tracking-wide text-yellow-400">{kind}</div>
      </div>
    </div>
  );
}

function Bars() {
  const health = useGame((s) => s.health);
  const armor = useGame((s) => s.armor);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="w-5 text-center text-sm">❤</span>
        <div className="h-2.5 w-40 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/20">
          <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all" style={{ width: `${health}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-5 text-center text-sm">🛡</span>
        <div className="h-2.5 w-40 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/20">
          <div className="h-full bg-gradient-to-r from-sky-500 to-sky-300 transition-all" style={{ width: `${armor}%` }} />
        </div>
      </div>
    </div>
  );
}

function Crosshair() {
  const weapon = useGame((s) => s.weapon);
  const inVehicle = useGame((s) => s.inVehicle);
  if (weapon !== "pistol" || inVehicle) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
      <div className="relative h-6 w-6">
        <div className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 bg-white/90" />
        <div className="absolute left-1/2 bottom-0 h-2 w-0.5 -translate-x-1/2 bg-white/90" />
        <div className="absolute top-1/2 left-0 h-0.5 w-2 -translate-y-1/2 bg-white/90" />
        <div className="absolute top-1/2 right-0 h-0.5 w-2 -translate-y-1/2 bg-white/90" />
      </div>
    </div>
  );
}

function WastedOverlay() {
  const wasted = useGame((s) => s.wasted);
  if (!wasted) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/40 backdrop-blur-[2px]">
      <div className="text-7xl font-black italic tracking-widest text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">WASTED</div>
    </div>
  );
}

function PauseOverlay() {
  const paused = useGame((s) => s.paused);
  const togglePause = useGame((s) => s.togglePause);
  if (!paused) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-80 rounded-xl border border-white/10 bg-neutral-900/90 p-6 text-center shadow-2xl">
        <div className="mb-4 text-2xl font-black italic tracking-wide text-yellow-400">PAUSED</div>
        <button onClick={togglePause} className="mb-2 w-full rounded-lg bg-yellow-500 py-2.5 font-bold text-black transition hover:bg-yellow-400">
          Resume
        </button>
        <p className="mt-3 text-xs text-white/50">Press ESC to resume anytime</p>
      </div>
    </div>
  );
}

export function HUD() {
  const money = useGame((s) => s.money);
  const wanted = useGame((s) => s.wanted);
  const clock = useGame((s) => s.clock);
  const weapon = useGame((s) => s.weapon);
  const ammo = useGame((s) => s.ammo);
  const missionActive = useGame((s) => s.missionActive);
  const missionLabel = useGame((s) => s.missionLabel);
  const missionDistance = useGame((s) => s.missionDistance);
  const togglePause = useGame((s) => s.togglePause);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Escape") togglePause();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePause]);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none font-sans">
      <style>{`@keyframes fadeSlide{0%{opacity:0;transform:translateY(-8px)}10%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0}}`}</style>

      <div className="absolute left-5 top-5 flex flex-col items-start gap-2">
        <Minimap />
        <div className="rounded-lg bg-black/55 px-3 py-1.5 backdrop-blur-sm">
          <WantedStars level={wanted} />
        </div>
        <Bars />
      </div>

      <div className="absolute right-5 top-5 flex flex-col items-end gap-2 text-right">
        <div className="rounded-lg bg-black/55 px-4 py-2 backdrop-blur-sm">
          <div className="text-lg font-black tracking-wide text-green-400">${money.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-black/55 px-4 py-1.5 backdrop-blur-sm">
          <div className="text-sm font-bold tabular-nums text-white/90">{clock}</div>
        </div>
        {weapon === "pistol" && (
          <div className="rounded-lg bg-black/55 px-4 py-1.5 backdrop-blur-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-white/70">Pistol</div>
            <div className="text-right text-lg font-black text-yellow-400">{ammo}</div>
          </div>
        )}
        <button onClick={togglePause} className="pointer-events-auto rounded-lg bg-black/55 px-3 py-1.5 text-xs font-bold text-white/80 backdrop-blur-sm hover:bg-black/70">
          ESC ⏸
        </button>
      </div>

      {missionActive && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-black/55 px-5 py-2 text-center backdrop-blur-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-yellow-400">{missionLabel}</div>
          <div className="text-sm text-white/85">{missionDistance}m to marker</div>
        </div>
      )}

      <Crosshair />
      <Speedometer />
      <Toasts />
      <ControlsHint />
      <WastedOverlay />
      <PauseOverlay />
    </div>
  );
}
