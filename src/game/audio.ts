class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  engineOsc: OscillatorNode | null = null;
  engineGain: GainNode | null = null;
  sirenOsc: OscillatorNode | null = null;
  sirenGain: GainNode | null = null;
  sirenLfo: number | null = null;
  windGain: GainNode | null = null;
  ready = false;

  init() {
    if (this.ready) {
      if (this.ctx?.state === "suspended") this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(ctx.destination);

    // engine hum
    const eOsc = ctx.createOscillator();
    eOsc.type = "sawtooth";
    eOsc.frequency.value = 60;
    const eGain = ctx.createGain();
    eGain.gain.value = 0;
    const eFilter = ctx.createBiquadFilter();
    eFilter.type = "lowpass";
    eFilter.frequency.value = 400;
    eOsc.connect(eFilter);
    eFilter.connect(eGain);
    eGain.connect(this.master);
    eOsc.start();
    this.engineOsc = eOsc;
    this.engineGain = eGain;

    // siren
    const sOsc = ctx.createOscillator();
    sOsc.type = "sine";
    sOsc.frequency.value = 700;
    const sGain = ctx.createGain();
    sGain.gain.value = 0;
    sOsc.connect(sGain);
    sGain.connect(this.master);
    sOsc.start();
    this.sirenOsc = sOsc;
    this.sirenGain = sGain;

    this.ready = true;
  }

  updateEngine(speedRatio: number, active: boolean) {
    if (!this.ctx || !this.engineGain || !this.engineOsc) return;
    const t = this.ctx.currentTime;
    if (active) {
      this.engineGain.gain.linearRampToValueAtTime(0.16 + speedRatio * 0.12, t + 0.08);
      this.engineOsc.frequency.linearRampToValueAtTime(55 + speedRatio * 220, t + 0.08);
    } else {
      this.engineGain.gain.linearRampToValueAtTime(0, t + 0.15);
    }
  }

  updateSiren(active: boolean) {
    if (!this.ctx || !this.sirenGain || !this.sirenOsc) return;
    const t = this.ctx.currentTime;
    if (active) {
      this.sirenGain.gain.linearRampToValueAtTime(0.05, t + 0.1);
      const cycle = 0.5;
      const phase = (t % cycle) / cycle;
      this.sirenOsc.frequency.setValueAtTime(phase < 0.5 ? 880 : 660, t);
    } else {
      this.sirenGain.gain.linearRampToValueAtTime(0, t + 0.2);
    }
  }

  playGunshot() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 800;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();
  }

  playHonk() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 320;
    const gain = ctx.createGain();
    gain.gain.value = 0.001;
    osc.connect(gain);
    gain.connect(this.master);
    const t = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.start();
    osc.stop(t + 0.5);
  }
}

export const audioEngine = new AudioEngine();
