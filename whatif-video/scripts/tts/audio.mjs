// Audio helpers for the TTS pipeline (24 kHz mono float samples).
import { readFileSync, writeFileSync } from "node:fs";
import { integratedLoudness } from "../loudness.mjs";

export const SR = 24000;

export const readWav = (file) => {
  const b = readFileSync(file);
  if (b.readUInt32LE(24) !== SR || b.readUInt16LE(22) !== 1) throw new Error(`${file}: expected ${SR} Hz mono`);
  const d = b.indexOf("data") + 8;
  const s = new Float32Array(Math.floor((b.length - d) / 2));
  for (let i = 0; i < s.length; i++) s[i] = b.readInt16LE(d + i * 2) / 32768;
  return s;
};

export const pcm16ToFloat = (buf) => {
  if (buf.subarray(0, 4).toString() === "RIFF") {
    if (buf.readUInt32LE(24) !== SR) throw new Error(`unexpected sample rate ${buf.readUInt32LE(24)}`);
    buf = buf.subarray(buf.indexOf("data") + 8);
  }
  const s = new Float32Array(Math.floor(buf.length / 2));
  for (let i = 0; i < s.length; i++) s[i] = buf.readInt16LE(i * 2) / 32768;
  return s;
};

export const wavBuffer = (s) => {
  const data = Buffer.alloc(s.length * 2);
  s.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
};
export const writeWav = (file, s) => writeFileSync(file, wavBuffer(s));

// Level of each 10 ms frame in dBFS
export const FRAME = 0.01;
export const frameLevels = (s) => {
  const win = Math.round(FRAME * SR);
  const out = [];
  for (let i = 0; i + win <= s.length; i += win) {
    let e = 0;
    for (let j = i; j < i + win; j++) e += s[j] * s[j];
    out.push(10 * Math.log10(e / win + 1e-12));
  }
  return out;
};

export const SILENCE_DB = -45;

// Cut a clip out of the take and remove silence at both ends (keeping 40 ms)
export const trim = (s) => {
  const lv = frameLevels(s);
  const win = Math.round(FRAME * SR);
  let a = lv.findIndex((v) => v > SILENCE_DB);
  if (a === -1) return s.slice(0, 0);
  let b = lv.length - 1;
  while (b > a && lv[b] <= SILENCE_DB) b--;
  const pad = Math.round(0.04 * SR);
  return s.slice(Math.max(0, a * win - pad), Math.min(s.length, (b + 1) * win + pad));
};

// Silent stretches (seconds) inside [from, to], longest first: the candidate cut points
// between two lines. Which one is the real gap is decided by listening (see tts-episode).
export const silentRuns = (levels, from, to, minSec = 0.08, db = SILENCE_DB) => {
  const a = Math.max(0, Math.floor(from / FRAME));
  const b = Math.min(levels.length - 1, Math.ceil(to / FRAME));
  const runs = [];
  let run = null;
  for (let i = a; i <= b + 1; i++) {
    if (i <= b && levels[i] <= db) run ??= i;
    else if (run !== null) {
      if ((i - run) * FRAME >= minSec) runs.push({ mid: ((run + i) / 2) * FRAME, len: (i - run) * FRAME });
      run = null;
    }
  }
  return runs.sort((x, y) => y.len - x.len);
};

// Best cut point (seconds) between two lines: the middle of the longest silent
// stretch inside [from, to]; if there is none, the quietest frame.
export const cutPoint = (levels, from, to) => {
  const a = Math.max(0, Math.floor(from / FRAME));
  const b = Math.min(levels.length - 1, Math.ceil(to / FRAME));
  if (b <= a) return (from + to) / 2;
  let best = null;
  let run = null;
  for (let i = a; i <= b + 1; i++) {
    if (i <= b && levels[i] <= SILENCE_DB) run ??= i;
    else if (run !== null) {
      if (!best || i - run > best[1] - best[0]) best = [run, i];
      run = null;
    }
  }
  if (best) return ((best[0] + best[1]) / 2) * FRAME;
  let q = a;
  for (let i = a; i <= b; i++) if (levels[i] < levels[q]) q = i;
  return (q + 0.5) * FRAME;
};

const PEAK_CEILING_DB = -5.5;
const limit = (s) => {
  const c = 10 ** (PEAK_CEILING_DB / 20);
  const look = Math.round(0.005 * SR);
  const rel = Math.exp(-1 / (0.06 * SR));
  const need = s.map((v) => Math.min(1, c / Math.max(1e-9, Math.abs(v))));
  const out = new Float32Array(s.length);
  let env = 1;
  for (let i = 0; i < s.length; i++) {
    let m = 1;
    for (let j = i; j < Math.min(s.length, i + look); j++) m = Math.min(m, need[j]);
    env = m < env ? m : m + (env - m) * rel;
    out[i] = Math.max(-c, Math.min(c, s[i] * env));
  }
  return out;
};

// Same per-line level as the Kokoro voices (see scripts/generate-voices.mjs)
export const VOICE_LUFS = -16.8;
export const normalise = (s) => {
  let out = s;
  for (let p = 0; p < 4; p++) {
    const gain = 10 ** ((VOICE_LUFS - integratedLoudness([out], SR)) / 20);
    out = limit(out.map((v) => v * gain));
  }
  return out;
};

export const concat = (parts) => {
  const out = new Float32Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
export const silence = (sec) => new Float32Array(Math.round(sec * SR));
