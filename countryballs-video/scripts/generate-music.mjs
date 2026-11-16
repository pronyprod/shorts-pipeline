// Generates an original, seamlessly looping, playful background track from code
// (no samples, no third-party audio). Output: public/music/flag-family-loop.wav
// Usage: node scripts/generate-music.mjs
//
// 120 bpm, C major, 8 bars (16 s): marimba melody, plucked offbeat chords,
// bass, soft kick, finger snaps and shaker. Normalised to -18 dBFS RMS,
// the same level as the voices; the video turns it down with MUSIC_VOLUME.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SR = 44100;
const BPM = 120;
const BEAT = 60 / BPM;
const BARS = 8;
const LOOP = Math.round(BARS * 4 * BEAT * SR);
const TAIL = 2 * SR;
const out = new Float32Array(LOOP + TAIL);

// deterministic random numbers so the file is the same every run
let seed = 12345;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296 - 0.5;
};

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const freq = (name) => {
  const n = NOTE[name[0]] + 12 * (Number(name.slice(1)) + 1);
  return 440 * 2 ** ((n - 69) / 12);
};

const add = (start, samples, gain) => {
  const s0 = Math.round(start * SR);
  for (let i = 0; i < samples.length && s0 + i < out.length; i++) out[s0 + i] += samples[i] * gain;
};

const marimba = (f, len = 0.6) => {
  const n = Math.round(len * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const attack = Math.min(1, t / 0.003);
    buf[i] =
      attack *
      Math.exp(-t * 7) *
      (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.exp(-t * 30) * Math.sin(2 * Math.PI * 3.95 * f * t));
  }
  return buf;
};

// Karplus-Strong plucked string
const pluck = (f, len = 0.7) => {
  const n = Math.round(len * SR);
  const period = Math.round(SR / f);
  const ring = Float32Array.from({ length: period }, () => rand());
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = ring[i % period];
    const b = ring[(i + 1) % period];
    ring[i % period] = 0.996 * 0.5 * (a + b);
    buf[i] = a;
  }
  return buf;
};

const bass = (f, len = 0.45) => {
  const n = Math.round(len * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.005) * Math.exp(-t * 5);
    buf[i] = env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t));
  }
  return buf;
};

const kick = () => {
  const n = Math.round(0.25 * SR);
  const buf = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    phase += (2 * Math.PI * (50 + 70 * Math.exp(-t * 30))) / SR;
    buf[i] = Math.exp(-t * 16) * Math.sin(phase);
  }
  return buf;
};

const noiseHit = (decay, len, brightness) => {
  const n = Math.round(len * SR);
  const buf = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const x = rand();
    buf[i] = Math.exp((-i / SR) * decay) * (x - brightness * prev); // crude high-pass
    prev = x;
  }
  return buf;
};

const CHORDS = [
  ["C4", "E4", "G4"],
  ["B3", "D4", "G4"],
  ["C4", "E4", "A4"],
  ["C4", "F4", "A4"],
  ["C4", "E4", "G4"],
  ["B3", "D4", "G4"],
  ["C4", "F4", "A4"],
  ["B3", "D4", "G4"],
];
const ROOTS = ["C2", "G2", "A2", "F2", "C2", "G2", "F2", "G2"];
const FIFTHS = ["G2", "D3", "E3", "C3", "G2", "D3", "C3", "D3"];
const MELODY = [
  ["E5", "G5", null, "C6", null, "G5", "E5", null],
  ["D5", "G5", null, "B5", null, "G5", "D5", null],
  ["C5", "E5", null, "A5", null, "E5", "C5", "E5"],
  ["F5", "A5", null, "C6", "A5", null, "G5", null],
  ["E5", "G5", "C6", null, "D6", "C6", "G5", null],
  ["B4", "D5", "G5", null, "A5", "G5", "D5", null],
  ["A5", null, "F5", "A5", "C6", null, "A5", null],
  ["G5", null, "B5", null, "D6", null, "B5", "G5"],
];

const snap = noiseHit(35, 0.15, 0.95);
const shaker = noiseHit(70, 0.08, 0.98);
const kickBuf = kick();

for (let bar = 0; bar < BARS; bar++) {
  const t0 = bar * 4 * BEAT;
  // melody on eighth notes
  MELODY[bar].forEach((note, i) => {
    if (note) add(t0 + (i * BEAT) / 2, marimba(freq(note)), 0.32);
  });
  // plucked chord on every offbeat, lightly strummed
  for (let beat = 0; beat < 4; beat++) {
    CHORDS[bar].forEach((note, j) => add(t0 + beat * BEAT + BEAT / 2 + j * 0.012, pluck(freq(note)), 0.16));
  }
  // bass: root on 1, fifth on 2-and, root an octave up on 3
  add(t0, bass(freq(ROOTS[bar])), 0.5);
  add(t0 + 1.5 * BEAT, bass(freq(FIFTHS[bar]), 0.3), 0.4);
  add(t0 + 2 * BEAT, bass(2 * freq(ROOTS[bar])), 0.35);
  // drums
  for (let beat = 0; beat < 4; beat++) {
    const tb = t0 + beat * BEAT;
    if (beat % 2 === 0) add(tb, kickBuf, 0.55);
    else add(tb, snap, 0.22);
    add(tb, shaker, 0.05);
    add(tb + BEAT / 2, shaker, 0.08);
  }
}

// wrap the tail (notes ringing past the end) onto the start so the loop is seamless
const loop = out.slice(0, LOOP);
for (let i = 0; i < TAIL; i++) loop[i] += out[LOOP + i];

// normalise to -18 dBFS RMS with a soft limiter
let sum = 0;
for (const v of loop) sum += v * v;
const gain = 10 ** (-18 / 20) / Math.sqrt(sum / loop.length);
const final = loop.map((v) => Math.tanh(v * gain * 1.1) / 1.1);

const data = Buffer.alloc(final.length * 2);
final.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

const root = path.resolve(import.meta.dirname, "..");
const file = path.join(root, "public", "music", "flag-family-loop.wav");
mkdirSync(path.dirname(file), { recursive: true });
writeFileSync(file, Buffer.concat([header, data]));
console.log(`Wrote ${file} (${(LOOP / SR).toFixed(1)}s loop)`);
