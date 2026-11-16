// Original music bed + sound effects, generated from code (no samples, no third-party audio).
// Output: public/music/peta-pulse.wav (stereo, ~80 s, 96 bpm, D minor)
//         public/sfx/{whoosh,pop,stamp,tick,rise}.wav
// Usage: node scripts/make-audio-assets.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const SR = 48000;

let seed = 2026;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296 - 0.5;
};

const writeWav = (file, channels) => {
  const n = channels[0].length;
  const buf = Buffer.alloc(44 + n * channels.length * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * channels.length * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(channels.length, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * channels.length * 2, 28); buf.writeUInt16LE(channels.length * 2, 32);
  buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * channels.length * 2, 40);
  for (let i = 0; i < n; i++)
    channels.forEach((c, ch) => buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(c[i] * 32767))), 44 + (i * channels.length + ch) * 2));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, buf);
};

const normalise = (chs, peakDb) => {
  let p = 0;
  for (const c of chs) for (const v of c) p = Math.max(p, Math.abs(v));
  const g = 10 ** (peakDb / 20) / (p || 1);
  for (const c of chs) for (let i = 0; i < c.length; i++) c[i] *= g;
};

const midi = (m) => 440 * 2 ** ((m - 69) / 12);

// ---------------- music ----------------
const BPM = 96;
const BEAT = 60 / BPM;
const BARS = 32; // 32 bars x 2.5 s = 80 s
const LEN = Math.round((BARS * 4 * BEAT + 3) * SR);
const L = new Float32Array(LEN);
const R = new Float32Array(LEN);
const add = (t, samples, gain, pan = 0) => {
  const s0 = Math.round(t * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < samples.length && s0 + i < LEN; i++) { L[s0 + i] += samples[i] * gl; R[s0 + i] += samples[i] * gr; }
};

const pad = (freqs, len) => {
  const n = Math.round(len * SR);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.6) * Math.min(1, (len - t) / 0.6);
    let v = 0;
    for (const f of freqs) for (const det of [-0.12, 0.12]) {
      const ph = (f * (1 + det / 100) * t) % 1;
      v += (2 * ph - 1) * 0.5 + Math.sin(2 * Math.PI * f * t);
    }
    b[i] = env * v;
  }
  // gentle one-pole low-pass for warmth
  let y = 0;
  for (let i = 0; i < n; i++) { y += 0.06 * (b[i] - y); b[i] = y; }
  return b;
};
const pluck = (f, len = 0.5) => {
  const n = Math.round(len * SR);
  const period = Math.round(SR / f);
  const ring = Float32Array.from({ length: period }, () => rand());
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = ring[i % period], c = ring[(i + 1) % period];
    ring[i % period] = 0.993 * 0.5 * (a + c);
    b[i] = a;
  }
  return b;
};
const kick = () => {
  const n = Math.round(0.3 * SR);
  const b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (45 + 110 * Math.exp(-t * 30))) / SR;
    b[i] = Math.sin(ph) * Math.exp(-t * 9);
  }
  return b;
};
const hat = () => {
  const n = Math.round(0.05 * SR);
  const b = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) { const w = rand(); b[i] = (w - prev) * Math.exp((-i / SR) * 90); prev = w; }
  return b;
};
const sub = (f, len) => {
  const n = Math.round(len * SR);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    b[i] = Math.min(1, t / 0.01) * Math.exp(-t * 2.2) * (Math.sin(2 * Math.PI * f * t) + 0.2 * Math.sin(4 * Math.PI * f * t));
  }
  return b;
};

// D minor: Dm - Bb - F - C (i - VI - III - VII), one chord per bar
const CHORDS = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]];
const ARP = [0, 1, 2, 1, 2, 0, 2, 1];
for (let bar = 0; bar < BARS; bar++) {
  const t0 = bar * 4 * BEAT;
  const ch = CHORDS[bar % 4];
  const section = Math.floor(bar / 8); // 0 intro, 1-2 full, 3 lift
  add(t0, pad(ch.map((m) => midi(m + 12)), 4 * BEAT + 0.4), 0.05, 0);
  add(t0, sub(midi(ch[0] - 12), 4 * BEAT), 0.35);
  for (let s = 0; s < 8; s++) {
    const m = ch[ARP[s]] + 24 + (section === 3 && s % 4 === 3 ? 12 : 0);
    add(t0 + s * (BEAT / 2), pluck(midi(m), 0.45), 0.2, s % 2 ? 0.35 : -0.35);
  }
  for (let b = 0; b < 4; b++) {
    if (section > 0 || b % 2 === 0) add(t0 + b * BEAT, kick(), 0.55);
    for (let h = 0; h < 4; h++) if (section > 0) add(t0 + b * BEAT + h * (BEAT / 4), hat(), h === 2 ? 0.14 : 0.06, 0.2);
  }
}
// fade in/out
for (let i = 0; i < LEN; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 0.3) * Math.min(1, (LEN / SR - t) / 2.5);
  L[i] *= g; R[i] *= g;
}
normalise([L, R], -3);
writeWav(path.join(root, "public/music/peta-pulse.wav"), [L, R]);

// ---------------- sound effects ----------------
const fx = (len, fn) => {
  const n = Math.round(len * SR);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = fn(i / SR, i);
  normalise([b], -3);
  return [b, Float32Array.from(b)];
};

// whoosh: noise through a sweeping resonant band-pass
{
  let lp = 0, bp = 0;
  writeWav(path.join(root, "public/sfx/whoosh.wav"), fx(0.7, (t) => {
    const f = 300 + 2600 * Math.sin((Math.PI * t) / 0.7) ** 2;
    const k = 2 * Math.sin((Math.PI * f) / SR);
    const x = rand();
    lp += k * bp; const hp = x - lp - 0.5 * bp; bp += k * hp;
    return bp * Math.sin((Math.PI * t) / 0.7) ** 1.5;
  }));
}
// pop: quick upward sine chirp
{
  let ph = 0;
  writeWav(path.join(root, "public/sfx/pop.wav"), fx(0.12, (t) => {
    ph += (2 * Math.PI * (500 + 1400 * t * 8)) / SR;
    return Math.sin(ph) * Math.exp(-t * 35);
  }));
}
// stamp: low thump + short noise slap
{
  let ph = 0;
  writeWav(path.join(root, "public/sfx/stamp.wav"), fx(0.35, (t) => {
    ph += (2 * Math.PI * (60 + 140 * Math.exp(-t * 40))) / SR;
    return Math.sin(ph) * Math.exp(-t * 12) + 0.5 * rand() * Math.exp(-t * 60);
  }));
}
// tick: tiny click for counters
writeWav(path.join(root, "public/sfx/tick.wav"), fx(0.03, (t) => Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 250)));
// rise: filtered noise swell into a reveal
{
  let y = 0;
  writeWav(path.join(root, "public/sfx/rise.wav"), fx(1.2, (t) => {
    y += (0.01 + 0.2 * (t / 1.2) ** 2) * (rand() - y);
    return y * (t / 1.2) ** 2;
  }));
}
console.log("music: public/music/peta-pulse.wav | sfx: whoosh, pop, stamp, tick, rise");
