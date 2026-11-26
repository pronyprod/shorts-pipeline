// Voice line cleaning + join checks, shared by What If (whatif-video) and Fakta (fakta-video; a copy lives
// in fakta-video/scripts/voice-clean.mjs, keep the two identical).
//
// Why (owner feedback on What If Ep010, 12 Nov 2026): Gemini line takes can end with a short loud burst
// (a pop in the last ~10 ms), single-line re-takes have a different noise floor, and lines were cut with
// hard edges. At every line join that sounded like clicks and hiss switching on and off.
//
// cleanLine(samples, sr): every line, main take or re-take, gets the same treatment:
//   1. light denoise to one shared noise floor (ffmpeg highpass + afftdn), so re-takes match the take
//   2. drop end bursts and breaths at both edges (short or quiet noisy bits separated from the words by a gap)
//   3. trim silence (keep 40 ms), then a 12 ms fade in and a 35 ms fade out (no hard edges, no clicks)
// checkLines(clips, sr): the automatic join check (mandatory before queueing). Returns problems per line.
//
// CLI:  node scripts/voice-clean.mjs check <dir-with-wavs> [--pattern line*.wav]   -> exit 1 on problems

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// ---------- WAV (mono 16-bit PCM, any sample rate) ----------
export const readMonoWav = (file) => {
  const b = readFileSync(file);
  let p = 12;
  let sr = 24000;
  let ch = 1;
  let bits = 16;
  let data = null;
  while (p + 8 <= b.length) {
    const id = b.toString("ascii", p, p + 4);
    const size = b.readUInt32LE(p + 4);
    if (id === "fmt ") {
      ch = b.readUInt16LE(p + 10);
      sr = b.readUInt32LE(p + 12);
      bits = b.readUInt16LE(p + 22);
    } else if (id === "data") {
      data = b.subarray(p + 8, Math.min(b.length, p + 8 + size));
      break;
    }
    p += 8 + size + (size % 2);
  }
  if (!data || bits !== 16) throw new Error(`${file}: need 16-bit PCM WAV`);
  const n = Math.floor(data.length / 2 / ch);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = data.readInt16LE(i * 2 * ch) / 32768;
  return { s, sr };
};
export const writeMonoWav = (file, s, sr) => {
  const b = Buffer.alloc(44 + s.length * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + s.length * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(s.length * 2, 40);
  for (let i = 0; i < s.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s[i] * 32767))), 44 + i * 2);
  writeFileSync(file, b);
};

// ---------- levels ----------
const FRAME = 0.01;
const db = (x) => (x > 0 ? 20 * Math.log10(x) : -120);
export const frames = (s, sr) => {
  const w = Math.round(FRAME * sr);
  const out = [];
  for (let a = 0; a + w <= s.length; a += w) {
    let t = 0;
    let z = 0;
    for (let i = a; i < a + w; i++) {
      t += s[i] * s[i];
      if (i > a && (s[i] >= 0) !== (s[i - 1] >= 0)) z++;
    }
    out.push({ l: db(Math.sqrt(t / w)), z: z / w });
  }
  return out;
};

// ---------- 1. one shared noise floor ----------
export const DENOISE = "highpass=f=70,afftdn=nr=12:nf=-50:tn=1";
const ffmpegBin = () => process.env.FFMPEG_BIN || "ffmpeg";
export const denoise = (s, sr, ffmpeg = ffmpegBin()) => {
  const wav = (() => {
    const b = Buffer.alloc(44 + s.length * 2);
    b.write("RIFF", 0);
    b.writeUInt32LE(36 + s.length * 2, 4);
    b.write("WAVEfmt ", 8);
    b.writeUInt32LE(16, 16);
    b.writeUInt16LE(1, 20);
    b.writeUInt16LE(1, 22);
    b.writeUInt32LE(sr, 24);
    b.writeUInt32LE(sr * 2, 28);
    b.writeUInt16LE(2, 32);
    b.writeUInt16LE(16, 34);
    b.write("data", 36);
    b.writeUInt32LE(s.length * 2, 40);
    for (let i = 0; i < s.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s[i] * 32767))), 44 + i * 2);
    return b;
  })();
  const r = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-f", "wav", "-i", "pipe:0", "-af", DENOISE, "-c:a", "pcm_s16le", "-ar", String(sr), "-ac", "1", "-f", "wav", "pipe:1"], { input: wav, maxBuffer: 2e8 });
  if (r.status !== 0) throw new Error(`ffmpeg denoise failed: ${r.stderr}`);
  const d = r.stdout.indexOf("data") + 8;
  const n = Math.floor((r.stdout.length - d) / 2);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = r.stdout.readInt16LE(d + i * 2) / 32768;
  return out;
};

// ---------- 2 + 3. edges: bursts, breaths, silence, fades ----------
const SOUND_DB = -42; // a frame louder than this is "sound"
export const cleanEdges = (s, sr) => {
  const f = frames(s, sr);
  const w = Math.round(FRAME * sr);
  const loud = f.map((x) => x.l > SOUND_DB);
  // runs of sound
  const runs = [];
  let a = -1;
  loud.forEach((v, i) => {
    if (v && a < 0) a = i;
    if ((!v || i === loud.length - 1) && a >= 0) {
      runs.push([a, v ? i + 1 : i]);
      a = -1;
    }
  });
  if (!runs.length) return new Float32Array(0);
  const all = runs.map((r) => [...r]);
  // pieces less than 50 ms apart are one sound (a burst with a tiny dropout, a word with a stop)
  for (let i = runs.length - 1; i > 0; i--) {
    if (runs[i][0] - runs[i - 1][1] < 5) {
      runs[i - 1][1] = runs[i][1];
      runs.splice(i, 1);
    }
  }
  const peak = (r) => Math.max(...f.slice(r[0], r[1]).map((x) => x.l));
  const noisy = (r) => f.slice(r[0], r[1]).reduce((t, x) => t + x.z, 0) / (r[1] - r[0]);
  const speech = Math.max(...runs.map(peak));
  // an edge run is junk when it is separated from the words by quiet and it is
  //  - short (a click, < 60 ms), or quiet and hissy (a breath), after >= 60 ms of quiet, or
  //  - a burst that runs into the very edge of the file after >= 150 ms of quiet (Gemini takes and
  //    single-line re-takes can end with ~120 ms of loud noise; Ep010 lines 5, 11, 13)
  // (whisper re-checks every line afterwards, so a real word cut by mistake is caught)
  // a burst is also flat in level (Gemini's: about 1 dB of variation); words never are
  const flat = (r) => {
    const ls = f.slice(r[0], r[1]).map((x) => x.l).filter((l) => l > SOUND_DB); // ignore a tiny dropout inside it
    if (!ls.length) return true;
    const m = ls.reduce((a, b) => a + b, 0) / ls.length;
    return Math.sqrt(ls.reduce((a, b) => a + (b - m) ** 2, 0) / ls.length) < 2.5;
  };
  const junk = (r, gap, touchesEdge) =>
    (gap >= 6 && (r[1] - r[0] < 6 || (peak(r) < speech - 14 && noisy(r) > 0.22))) || (gap >= 15 && touchesEdge && r[1] - r[0] <= 30 && flat(r));
  while (runs.length > 1 && junk(runs[runs.length - 1], runs[runs.length - 1][0] - runs[runs.length - 2][1], runs[runs.length - 1][1] >= f.length - 1)) runs.pop();
  while (runs.length > 1 && junk(runs[0], runs[1][0] - runs[0][1], runs[0][0] === 0)) runs.shift();
  const pad = Math.round(0.04 * sr);
  // never cut more than 0.5 s of sound from either edge (a safety net for real words)
  const first = Math.min(runs[0][0], all[0][0] + 50);
  const last = Math.max(runs[runs.length - 1][1], all[all.length - 1][1] - 50);
  const out = s.slice(Math.max(0, first * w - pad), Math.min(s.length, last * w + pad));
  return fades(out, sr);
};
export const FADE_IN = 0.012;
export const FADE_OUT = 0.035;
export const fades = (s, sr) => {
  const out = Float32Array.from(s);
  const fi = Math.min(out.length, Math.round(FADE_IN * sr));
  const fo = Math.min(out.length, Math.round(FADE_OUT * sr));
  for (let i = 0; i < fi; i++) out[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fi);
  for (let i = 0; i < fo; i++) out[out.length - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fo);
  return out;
};
// the whole treatment (normalise loudness afterwards with the project's own normaliser, then call fades() again).
// Uses the full ffmpeg on PATH (Remotion's bundled ffmpeg has no afftdn); FFMPEG_BIN overrides it.
// Edges first (Gemini's end burst is flat before denoising, uneven after), then denoise, then fades again.
export const cleanLine = (s, sr) => fades(denoise(cleanEdges(s, sr), sr), sr);

// Owner, 26 Nov 2026 (Fakta Ep020 looped on re-takes: all words right, but the join check found 0.18 s of
// burst/breath at line 4's edges every time). Noise reduction changes a burst's shape, so the first cleanEdges pass
// can miss what a second pass recognises. When that is the ONLY leftover, cut it here instead of recording again:
// cleanEdges + fades again (up to 3 passes) when the leftover is at most 0.4 s, never more than maxCut seconds in total. Returns { s, cut }; cut = 0
// when nothing was left. Whisper still checks every line's words afterwards (mandatory checks).
export const trimLeftoverEdges = (s, sr, maxCut = 0.6) => {
  let out = s;
  for (let pass = 0; pass < 3; pass++) {
    const c = cleanEdges(out, sr);
    if (out.length - c.length <= 0.09 * sr) break; // what the join check accepts
    if (out.length - c.length > 0.4 * sr || s.length - c.length > maxCut * sr) break; // too much: leave it for the join check
    out = fades(c, sr);
  }
  return { s: out, cut: (s.length - out.length) / sr };
};

// ---------- the automatic join check ----------
// Each clip: no click at either edge, no burst or breath left at the edges, a quiet floor like the
// other lines, and the same speech level as the other lines.
export const checkLines = (clips, sr) => {
  const stats = clips.map((s) => {
    const f = frames(s, sr);
    const ls = f.map((x) => x.l).sort((x, y) => x - y);
    const speech = ls[Math.floor(ls.length * 0.8)] ?? -120;
    // noise floor = the pauses only (frames 30+ dB under the speech); lines with almost no pause have no floor
    const pauses = f.filter((x) => x.l < speech - 30).map((x) => x.l).sort((a, b) => a - b);
    const floor = pauses.length >= 8 ? pauses[Math.floor(pauses.length / 2)] : null;
    const n5 = Math.max(1, Math.round(0.005 * sr));
    const lvl = (a, b) => {
      let t = 0;
      for (let i = a; i < b; i++) t += s[i] * s[i];
      return db(Math.sqrt(t / Math.max(1, b - a)));
    };
    let jump = 0;
    const n20 = Math.round(0.02 * sr);
    for (const [a, b] of [[1, n20], [s.length - n20, s.length]]) for (let i = Math.max(1, a); i < b; i++) jump = Math.max(jump, Math.abs(s[i] - s[i - 1]));
    return { floor, speech, head: lvl(0, n5), tail: lvl(s.length - n5, s.length), jump, cleaned: cleanEdges(s, sr).length };
  });
  const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const floors = stats.map((x) => x.floor).filter((x) => x !== null);
  const mFloor = floors.length ? med(floors) : -90;
  const mSpeech = med(stats.map((x) => x.speech));
  return stats.map((x, i) => {
    const p = [];
    if (x.head > -45) p.push(`starts loud (${x.head.toFixed(0)} dB in the first 5 ms): click`);
    if (x.tail > -45) p.push(`ends loud (${x.tail.toFixed(0)} dB in the last 5 ms): click`);
    if (x.jump > 0.08) p.push(`sample jump ${x.jump.toFixed(2)} at an edge: click`);
    if (clips[i].length - x.cleaned > 0.09 * sr) p.push(`${((clips[i].length - x.cleaned) / sr).toFixed(2)} s of burst/breath/silence still at the edges`);
    if (x.floor !== null && x.floor > -50) p.push(`noise floor ${x.floor.toFixed(0)} dB in the pauses (hiss)`);
    // a floor difference only matters when the louder one is audible under the music (above -60 dB)
    if (x.floor !== null && Math.abs(x.floor - mFloor) > 10 && Math.max(x.floor, mFloor) > -60) p.push(`noise floor ${x.floor.toFixed(0)} dB vs ${mFloor.toFixed(0)} dB on the other lines (tone change)`);
    if (Math.abs(x.speech - mSpeech) > 2) p.push(`speech level ${x.speech.toFixed(1)} dB vs ${mSpeech.toFixed(1)} dB on the other lines`);
    return { line: i + 1, ok: p.length === 0, problems: p };
  });
};

// ---------- CLI ----------
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [cmd, dir] = process.argv.slice(2);
  if (cmd !== "check" || !dir) {
    console.error("Usage: node scripts/voice-clean.mjs check <dir> [--pattern line*.wav]");
    process.exit(2);
  }
  const pi = process.argv.indexOf("--pattern");
  const pat = new RegExp("^" + (pi > 0 ? process.argv[pi + 1] : "line*.wav").replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
  const files = readdirSync(dir).filter((f) => pat.test(f)).sort();
  const loaded = files.map((f) => readMonoWav(path.join(dir, f)));
  const res = checkLines(loaded.map((x) => x.s), loaded[0]?.sr ?? 24000);
  let bad = 0;
  res.forEach((r, i) => {
    if (!r.ok) bad++;
    console.log(`${files[i]}: ${r.ok ? "OK" : "FAIL  " + r.problems.join("; ")}`);
  });
  console.log(bad ? `JOIN CHECK FAILED: ${bad} of ${res.length} lines` : `join check passed (${res.length} lines)`);
  process.exit(bad ? 1 : 0);
}
