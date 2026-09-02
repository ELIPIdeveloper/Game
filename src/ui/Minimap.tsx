import { useEffect, useRef } from "react";
import { playerState, vehicles, missionTarget } from "../game/world";
import { CITY } from "../game/cityData";

const SIZE = 200;
const RANGE = 90;

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const scale = (SIZE / 2 - 6) / RANGE;

    function project(dx: number, dz: number, h: number) {
      const localX = dx * Math.cos(h) - dz * Math.sin(h);
      const localY = dx * Math.sin(h) + dz * Math.cos(h);
      return { x: SIZE / 2 + localX * scale, y: SIZE / 2 - localY * scale };
    }

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      const driving = playerState.mode === "drive";
      const veh = driving ? vehicles.find((v) => v.id === playerState.activeVehicleId) : null;
      const px = veh ? veh.pos.x : playerState.pos.x;
      const pz = veh ? veh.pos.z : playerState.pos.z;
      const heading = veh ? veh.heading : playerState.heading;

      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 3, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "rgba(10,14,22,0.72)";
      ctx.fillRect(0, 0, SIZE, SIZE);

      for (const b of CITY.blocks) {
        const dx = b.cx - px;
        const dz = b.cz - pz;
        if (Math.abs(dx) > RANGE + 20 || Math.abs(dz) > RANGE + 20) continue;
        const p = project(dx, dz, heading);
        ctx.fillStyle = b.type === "park" || b.type === "plaza" ? "rgba(60,130,70,0.55)" : b.type === "downtown" ? "rgba(140,150,170,0.5)" : "rgba(90,90,95,0.4)";
        ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
      }

      // mission blip
      {
        const dx = missionTarget.x - px;
        const dz = missionTarget.z - pz;
        const p = project(dx, dz, heading);
        ctx.fillStyle = "#ffd83d";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // police blips
      for (const v of vehicles) {
        if (v.kind !== "police" || v.mode !== "ai-chase") continue;
        const dx = v.pos.x - px;
        const dz = v.pos.z - pz;
        const d = Math.hypot(dx, dz);
        const clampedScale = d > RANGE ? RANGE / d : 1;
        const p = project(dx * clampedScale, dz * clampedScale, heading);
        ctx.fillStyle = Math.floor(performance.now() / 250) % 2 === 0 ? "#ff3030" : "#3050ff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // border ring
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 3, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // north indicator
      const n = project(0, RANGE * 0.92, heading);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("N", n.x, n.y);

      // player arrow (always centered, pointing up)
      ctx.save();
      ctx.translate(SIZE / 2, SIZE / 2);
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(7, 8);
      ctx.lineTo(0, 4);
      ctx.lineTo(-7, 8);
      ctx.closePath();
      ctx.fillStyle = "#3ad1ff";
      ctx.fill();
      ctx.strokeStyle = "#04202b";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="relative h-[200px] w-[200px] drop-shadow-lg">
      <canvas ref={canvasRef} width={SIZE} height={SIZE} className="h-full w-full" />
    </div>
  );
}
