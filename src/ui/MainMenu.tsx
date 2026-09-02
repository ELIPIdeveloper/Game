import { useGame } from "../game/store";
import { audioEngine } from "../game/audio";

export function MainMenu() {
  const started = useGame((s) => s.started);
  const start = useGame((s) => s.start);
  if (started) return null;

  function handleStart() {
    audioEngine.init();
    start();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black">
      <img src="/images/menu-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/70" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6 text-center">
        <div className="mb-2 text-xs font-bold tracking-[0.6em] text-cyan-300">OPEN WORLD CITY</div>
        <h1 className="mb-4 bg-gradient-to-r from-pink-500 via-fuchsia-400 to-cyan-300 bg-clip-text text-6xl font-black italic tracking-tight text-transparent drop-shadow-[0_2px_20px_rgba(255,0,180,0.35)] sm:text-7xl">
          VICE POINT
        </h1>
        <p dir="rtl" className="mb-8 max-w-md text-sm leading-relaxed text-white/70">
          یک شهر باز سه‌بعدی کامل: رانندگی کن، پیاده قدم بزن، ماشین بدزد، ماموریت انجام بده و از دست پلیس فرار کن.
          ساخته‌شده با Three.js — همه‌چیز کاملاً تعاملی و زنده است.
        </p>

        <button
          onClick={handleStart}
          className="group relative mb-8 overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 px-12 py-4 text-lg font-black uppercase tracking-widest text-black shadow-[0_0_40px_rgba(255,0,180,0.45)] transition-transform hover:scale-105 active:scale-95"
        >
          شروع بازی
        </button>

        <div dir="rtl" className="grid w-full grid-cols-2 gap-x-8 gap-y-2 rounded-xl border border-white/10 bg-black/40 p-5 text-right text-xs text-white/80 backdrop-blur-sm sm:grid-cols-4">
          <div><span className="font-bold text-cyan-300">WASD</span> حرکت</div>
          <div><span className="font-bold text-cyan-300">Shift</span> دویدن</div>
          <div><span className="font-bold text-cyan-300">Space</span> پرش/ترمز دستی</div>
          <div><span className="font-bold text-cyan-300">E</span> سوار/پیاده شدن</div>
          <div><span className="font-bold text-cyan-300">موس</span> چرخش دوربین</div>
          <div><span className="font-bold text-cyan-300">اسکرول</span> زوم</div>
          <div><span className="font-bold text-cyan-300">1 / 2</span> انتخاب سلاح</div>
          <div><span className="font-bold text-cyan-300">کلیک چپ</span> شلیک</div>
        </div>
      </div>
    </div>
  );
}
