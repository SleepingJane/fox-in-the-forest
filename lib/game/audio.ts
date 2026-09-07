type Beep = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
};

let ctx: AudioContext | null = null;
let unlocked = false;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  unlocked = true;
}

function tone(spec: Beep, delay = 0) {
  if (!ctx || !unlocked) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = spec.type ?? "triangle";
  osc.frequency.setValueAtTime(spec.freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(spec.gain ?? 0.07, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + spec.dur + 0.02);
}

export const sfx = {
  collect() {
    tone({ freq: 740, dur: 0.09, type: "sine", gain: 0.06 });
    tone({ freq: 980, dur: 0.12, type: "sine", gain: 0.05 }, 0.05);
  },
  stomp() {
    tone({ freq: 180, dur: 0.1, type: "square", gain: 0.05 });
    tone({ freq: 320, dur: 0.08, type: "triangle", gain: 0.04 }, 0.04);
  },
  hurt() {
    tone({ freq: 220, dur: 0.18, type: "sawtooth", gain: 0.05 });
    tone({ freq: 160, dur: 0.22, type: "square", gain: 0.04 }, 0.05);
  },
  jump() {
    tone({ freq: 420, dur: 0.07, type: "triangle", gain: 0.03 });
  },
  lantern() {
    tone({ freq: 392, dur: 0.25, type: "sine", gain: 0.06 });
    tone({ freq: 523, dur: 0.28, type: "sine", gain: 0.05 }, 0.12);
    tone({ freq: 659, dur: 0.4, type: "sine", gain: 0.05 }, 0.24);
  },
  win() {
    tone({ freq: 523, dur: 0.18, type: "sine", gain: 0.05 });
    tone({ freq: 659, dur: 0.18, type: "sine", gain: 0.05 }, 0.14);
    tone({ freq: 784, dur: 0.32, type: "sine", gain: 0.06 }, 0.28);
  },
};
