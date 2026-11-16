// Generates the kit's sound effects in code (no third-party audio, nothing to credit but this script).
//   node scripts/make-sfx.mjs   -> public/sfx/kit/*.wav (same generator as whatif-video, identical sounds) (48 kHz mono, peaks about -6 dBFS)
// One-shots: whoosh, impact, tick, pop, ding. Loops (seamless): wind, rumble, waves, hum.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { writeMonoWav } from "./voice-clean.mjs";

const SR = 48000;
const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public", "sfx", "kit"); // fakta: kept apart from the hand-placed public/sfx/*.wav of published episodes
mkdirSync(out, { recursive: true });

// seeded noise, so the files are the same every run
let seed = 12345;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const white = () => rnd() * 2 - 1;
const buf = (sec) => new Float32Array(Math.round(sec * SR));
const peakTo = (s, db = -6) => {
  let m = 0;
  for (const v of s) m = Math.max(m, Math.abs(v));
  const g = m > 0 ? 10 ** (db / 20) / m : 1;
  return s.map((v) => v * g);
};
// state-variable band-pass (cutoff can change per sample)
const svf = () => {
  let low = 0;
  let band = 0;
  return (x, fc, q = 0.7) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
    low += f * band;
    const high = x - low - q * band;
    band += f * high;
    return { low, band, high };
  };
};
const fadeEnds = (s, a = 0.005, b = 0.02) => {
  const fa = Math.round(a * SR);
  const fb = Math.round(b * SR);
  for (let i = 0; i < fa; i++) s[i] *= i / fa;
  for (let i = 0; i < fb; i++) s[s.length - 1 - i] *= i / fb;
  return s;
};
// make a loop seamless: cross-fade the last `x` seconds into the start
const loopify = (s, x = 0.5) => {
  const n = Math.round(x * SR);
  const outS = s.slice(0, s.length - n);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    outS[i] = outS[i] * k + s[s.length - n + i] * (1 - k);
  }
  return outS;
};

const write = (name, s) => {
  writeMonoWav(path.join(out, `${name}.wav`), s, SR);
  console.log(`${name}.wav  ${(s.length / SR).toFixed(2)} s`);
};

// whoosh: noise through a band-pass that sweeps up then down, swelling and fading
{
  const s = buf(0.7);
  const f = svf();
  for (let i = 0; i < s.length; i++) {
    const t = i / s.length;
    const fc = 250 + 2600 * Math.sin(Math.PI * Math.min(1, t * 1.15));
    const env = t < 0.45 ? (t / 0.45) ** 2 : Math.exp(-(t - 0.45) * 9);
    s[i] = f(white(), fc, 0.5).band * env;
  }
  write("whoosh", fadeEnds(peakTo(s, -6)));
}
// impact: a falling low thump plus a short dull noise hit
{
  const s = buf(0.9);
  const f = svf();
  let ph = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    const fr = 40 + 45 * Math.exp(-t * 8);
    ph += (2 * Math.PI * fr) / SR;
    const thump = Math.sin(ph) * Math.exp(-t * 6);
    const hit = f(white(), 700, 0.9).low * Math.exp(-t * 22);
    s[i] = thump * 0.9 + hit * 0.8;
  }
  write("impact", fadeEnds(peakTo(s, -5), 0.002, 0.05));
}
// tick: a short bright blip (the counter changing)
{
  const s = buf(0.06);
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    s[i] = (Math.sin(2 * Math.PI * 2300 * t) * 0.8 + Math.sin(2 * Math.PI * 4600 * t) * 0.2) * Math.exp(-t * 90);
  }
  write("tick", fadeEnds(peakTo(s, -8), 0.001, 0.01));
}
// pop: a quick downward bubble
{
  const s = buf(0.16);
  let ph = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (300 + 700 * Math.exp(-t * 30))) / SR;
    s[i] = Math.sin(ph) * Math.exp(-t * 28);
  }
  write("pop", fadeEnds(peakTo(s, -6), 0.001, 0.02));
}
// ding: a bell-like reveal
{
  const s = buf(1.4);
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    s[i] = (Math.sin(2 * Math.PI * 1320 * t) + 0.35 * Math.sin(2 * Math.PI * 2640 * t) * Math.exp(-t * 3) + 0.18 * Math.sin(2 * Math.PI * 3960 * t) * Math.exp(-t * 5)) * Math.exp(-t * 3.2);
  }
  write("ding", fadeEnds(peakTo(s, -8), 0.002, 0.05));
}
// wind (loop): band noise whose centre and level drift slowly
{
  const s = buf(8.5);
  const f = svf();
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    const fc = 520 + 260 * Math.sin(2 * Math.PI * t * 0.23) + 120 * Math.sin(2 * Math.PI * t * 0.61);
    const env = 0.6 + 0.4 * Math.sin(2 * Math.PI * t * 0.17 + 1);
    s[i] = f(white(), fc, 0.35).band * env;
  }
  write("wind", loopify(peakTo(s, -6)));
}
// rumble (loop): deep brown noise with a slow swell
{
  const s = buf(6.5);
  const f = svf();
  let brown = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    brown = brown * 0.995 + white() * 0.05;
    s[i] = f(brown, 110, 0.8).low * (0.7 + 0.3 * Math.sin(2 * Math.PI * t * 0.3));
  }
  write("rumble", loopify(peakTo(s, -6)));
}
// waves (loop): surf that rises and falls every ~4 s
{
  const s = buf(8.5);
  const f = svf();
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    const cyc = (t % 4.25) / 4.25;
    const env = cyc < 0.35 ? (cyc / 0.35) ** 1.5 : Math.exp(-(cyc - 0.35) * 3.2);
    s[i] = f(white(), 900 + 900 * env, 0.6).low * (0.15 + env);
  }
  write("waves", loopify(peakTo(s, -6)));
}
// hum (loop): a quiet machine room (lab, station)
{
  const s = buf(4.5);
  const f = svf();
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    s[i] = Math.sin(2 * Math.PI * 60 * t) * 0.6 + Math.sin(2 * Math.PI * 120 * t) * 0.25 + Math.sin(2 * Math.PI * 180 * t) * 0.08 + f(white(), 2500, 0.9).band * 0.05;
  }
  write("hum", loopify(peakTo(s, -6)));
}

// ---------- 12 Nov 2026: sounds that match what is on screen ----------
// splash: a short watery burst (noise through a falling band-pass, plus small bubbles)
{
  const s = buf(1.0);
  const f = svf();
  let ph = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    const env = t < 0.03 ? t / 0.03 : Math.exp(-(t - 0.03) * 6);
    const n = f(white(), 2600 - 1800 * Math.min(1, t * 2), 0.6).band * env;
    ph += (2 * Math.PI * (500 + 900 * Math.exp(-((t * 7) % 1) * 4))) / SR;
    const bubble = t > 0.15 ? Math.sin(ph) * 0.15 * Math.exp(-((t * 7) % 1) * 9) * Math.exp(-t * 3) : 0;
    s[i] = n + bubble;
  }
  write("splash", fadeEnds(peakTo(s, -6), 0.002, 0.08));
}
// crowd: a swell of many voices (band noise with fast random loudness, like murmur and cheer)
{
  const s = buf(2.6);
  const f = svf();
  const g = svf();
  let wob = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    wob = wob * 0.999 + white() * 0.03;
    const env = Math.sin(Math.PI * Math.min(1, t / 2.6)) ** 0.8;
    s[i] = (f(white(), 700 + 300 * Math.sin(t * 9), 0.5).band + 0.6 * g(white(), 1600, 0.6).band) * (0.6 + Math.abs(wob) * 4) * env;
  }
  write("crowd", fadeEnds(peakTo(s, -8), 0.05, 0.2));
}
// sizzle: hot crackle (bright noise with random crackles)
{
  const s = buf(1.8);
  const f = svf();
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.08) * Math.exp(-Math.max(0, t - 1.2) * 4);
    const crackle = rnd() < 0.0015 ? white() * 3 : 0;
    s[i] = (f(white(), 5200, 0.4).high * 0.5 + crackle) * env;
  }
  write("sizzle", fadeEnds(peakTo(s, -10), 0.01, 0.1));
}
// heartbeat: two "lub-dub" beats
{
  const s = buf(1.7);
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    let v = 0;
    for (const b of [0, 0.85]) {
      for (const [d, a] of [[0, 1], [0.22, 0.7]]) {
        const u = t - b - d;
        if (u >= 0) v += Math.sin(2 * Math.PI * 52 * u) * a * Math.exp(-u * 26);
      }
    }
    s[i] = v;
  }
  write("heartbeat", fadeEnds(peakTo(s, -5), 0.002, 0.05));
}
// clock: four tick-tocks (time pressure)
{
  const s = buf(2.1);
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    let v = 0;
    for (let k = 0; k < 4; k++) {
      const u = t - k * 0.5;
      if (u >= 0) v += Math.sin(2 * Math.PI * (k % 2 ? 1500 : 2100) * u) * Math.exp(-u * 160) + (u < 0.002 ? white() * 0.6 : 0);
    }
    s[i] = v;
  }
  write("clock", fadeEnds(peakTo(s, -8), 0.001, 0.05));
}
// shake: a short heavy rumble (things shaking, collapsing)
{
  const s = buf(1.5);
  const f = svf();
  let brown = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    brown = brown * 0.995 + white() * 0.06;
    const env = Math.min(1, t / 0.05) * Math.exp(-t * 2.4) * (0.75 + 0.25 * Math.sin(t * 40));
    s[i] = f(brown, 160, 0.8).low * env;
  }
  write("shake", fadeEnds(peakTo(s, -5), 0.005, 0.1));
}

// ---------- 12 Nov 2026 evening: sounds for on-screen ACTIONS ----------
// hit: a soft punch (key phrase landing, camera punch-in)
{
  const s = buf(0.35);
  const f = svf();
  let ph = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (70 + 90 * Math.exp(-t * 30))) / SR;
    s[i] = Math.sin(ph) * Math.exp(-t * 14) + f(white(), 1800, 0.8).band * Math.exp(-t * 60) * 0.6;
  }
  write("hit", fadeEnds(peakTo(s, -6), 0.001, 0.04));
}
// thud: something heavy landing
{
  const s = buf(0.6);
  const f = svf();
  let ph = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (48 + 40 * Math.exp(-t * 18))) / SR;
    s[i] = Math.sin(ph) * Math.exp(-t * 9) + f(white(), 400, 0.9).low * Math.exp(-t * 30) * 0.8;
  }
  write("thud", fadeEnds(peakTo(s, -5), 0.001, 0.05));
}
// rustle: paper / cash fluttering
{
  const s = buf(0.9);
  const f = svf();
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    const flick = (Math.sin(t * 2 * Math.PI * 23) > 0.6 ? 1 : 0.35) * (rnd() < 0.002 ? 2 : 1);
    s[i] = f(white(), 3800, 0.5).band * flick * Math.sin(Math.PI * Math.min(1, t / 0.9));
  }
  write("rustle", fadeEnds(peakTo(s, -9), 0.01, 0.08));
}
// crack: something breaking (a sharp snap and a short crackle)
{
  const s = buf(0.5);
  const f = svf();
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    const snap = t < 0.006 ? white() * 1.5 : 0;
    const crackle = rnd() < 0.01 * Math.exp(-t * 8) ? white() * 1.2 : 0;
    s[i] = snap + f(white() * Math.exp(-t * 25) + crackle, 2400, 0.6).band;
  }
  write("crack", fadeEnds(peakTo(s, -6), 0.0005, 0.05));
}
// gasp: a short breath in (Pom shocked)
{
  const s = buf(0.45);
  const f = svf();
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.12) * Math.exp(-Math.max(0, t - 0.18) * 14);
    s[i] = f(white(), 1300 + 900 * Math.min(1, t / 0.2), 0.7).band * env;
  }
  write("gasp", fadeEnds(peakTo(s, -10), 0.01, 0.06));
}
// gulp: a nervous swallow (Pom scared)
{
  const s = buf(0.3);
  let ph = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (380 - 240 * Math.min(1, t / 0.12))) / SR;
    s[i] = Math.sin(ph) * Math.exp(-t * 16) * (t < 0.12 ? 1 : 0.6);
  }
  write("gulp", fadeEnds(peakTo(s, -8), 0.002, 0.04));
}
// boing: a springy bounce (Pom happy / arms up)
{
  const s = buf(0.55);
  let ph = 0;
  for (let i = 0; i < s.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (300 + 220 * Math.sin(t * 2 * Math.PI * 11) * Math.exp(-t * 5) + 200 * t)) / SR;
    s[i] = Math.sin(ph) * Math.exp(-t * 6);
  }
  write("boing", fadeEnds(peakTo(s, -8), 0.002, 0.05));
}
