// Makes the Indonesian voiceover track, one file per script line, joined with short gaps.
// Output: public/voice/<ep>.wav and src/episodes/<ep>-timing.json (start/end of each line in seconds)
//
// Placeholder voice (edge-tts):  node scripts/make-voice.mts --ep=ep001v2
//   Needs: python -m pip install --user edge-tts   (and ffmpeg on PATH)
//
// Owner's own voice:             node scripts/make-voice.mts --ep=ep001v2 --own
//   Put one recording per line in recordings/<ep>/, named by line number: 01.m4a, 02.m4a ... 12.m4a
//   (any name that starts with the number works, e.g. "01 hook.m4a"; wav/m4a/mp3/aac/ogg/opus/flac).
//   Each take is cleaned up (rumble filter, light noise reduction, even loudness, silence trimmed).
//   See VOICEOVER_SCRIPT.md.
//
// Gemini TTS clips:              node scripts/make-voice.mts --ep=ep001v3 --own --tts --from=data/tts/ep001v3/lines
//   (made by scripts/gemini-voice.mts). Each clip is trimmed, then all lines are sped up by the same factor to reach
//   ~TARGET_WPM, at most MAX_TEMPO = 1.05x (owner rule 12 Nov 2026: never faster; if the voice is longer than
//   MAX_VOICE seconds, STOP (exit 4), cut words from the script and re-take). Then every line, main take or re-take,
//   is cleaned the same way (scripts/voice-clean.mjs: one shared noise floor, end bursts and breaths removed,
//   short fades), matched to the same speech level, and the join check must pass (exit 1 if not).
//   --out-dir=<dir>: write everything there instead of public/voice and src/episodes (tests).

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEpisode } from "./episode.mts";
import { VOICE_LUFS } from "../src/music.ts";
import { checkLines, cleanLine, fades, frames, readMonoWav, trimLeftoverEdges, writeMonoWav } from "./voice-clean.mjs";

const root = path.resolve(import.meta.dirname, "..");
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const id = arg("ep") ?? "ep001";
const { segments: SEGMENTS, edge: EP } = await loadEpisode(id);
const own = process.argv.includes("--own");
const recDir = path.resolve(root, arg("from") ?? `recordings/${id}`);
const outDir = arg("out-dir") ? path.resolve(root, arg("out-dir")!) : null;
const dir = outDir ? path.join(outDir, id) : path.join(root, "public/voice", id);
mkdirSync(dir, { recursive: true });
const GAP = 0.3; // seconds of silence between lines (owner 12 Nov: clear and unhurried, not dense)
const tts = process.argv.includes("--tts");
const TARGET_WPM = 138; // about 2.3 words per second
const MAX_TEMPO = 1.05;
const MAX_VOICE = 58; // seconds of voice, so the video stays within 40-60 s

const duration = (file: string) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

const TRIM = "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse";
// phone recordings: cut rumble and hiss, even out the level, then trim (a softer threshold: rooms are never silent)
const CLEAN =
  "highpass=f=80,afftdn=nf=-30,loudnorm=I=-18:TP=-2:LRA=9," +
  "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.08,areverse," +
  "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.08,areverse";

const findRecording = (n: number) => {
  if (!existsSync(recDir)) throw new Error(`folder not found: ${recDir}`);
  const num = String(n).padStart(2, "0");
  const hit = readdirSync(recDir).find((f) => new RegExp(`^0?${n}(?![0-9])`).test(f) && /\.(wav|m4a|mp3|aac|ogg|opus|flac)$/i.test(f));
  if (!hit) throw new Error(`missing recording for line ${num} in ${recDir}`);
  return path.join(recDir, hit);
};

// TTS clips: trim first, then pick one speed-up factor for the whole episode
const TTS_TRIM = TRIM.replace(/-50dB/g, "-45dB");
let tempo = 1;
if (own && tts) {
  let speech = 0;
  SEGMENTS.forEach((seg, i) => {
    const tmp = path.join(dir, `_trim_${seg.id}.wav`);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", findRecording(i + 1), "-af", TTS_TRIM, "-ar", "48000", "-ac", "1", tmp]);
    speech += duration(tmp);
  });
  const words = SEGMENTS.reduce((a, s) => a + s.say.split(/\s+/).length, 0);
  const gaps = GAP * (SEGMENTS.length - 1);
  const need = speech / ((words / TARGET_WPM) * 60 - gaps); // speed-up that would hit TARGET_WPM
  tempo = Number(Number(arg("tempo") ?? Math.min(MAX_TEMPO, Math.max(1, need))).toFixed(3));
  console.log(`TTS clips: ${speech.toFixed(1)} s of speech, ${words} words = ${Math.round((words / (speech + gaps)) * 60)} wpm; tempo x${tempo}` + (need > MAX_TEMPO ? ` (capped; ${TARGET_WPM} wpm would need x${need.toFixed(2)})` : ""));
}

const timing: { id: string; start: number; end: number; words: number }[] = [];
const cleaned: Float32Array[] = [];
let cleanedSr = 48000;
let t = 0;
const list: string[] = [];
const silence = path.join(dir, "_gap.wav");
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", String(GAP), silence]);

SEGMENTS.forEach((seg, i) => {
  const wav = path.join(dir, `${seg.id}.wav`);
  if (own && tts) {
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", path.join(dir, `_trim_${seg.id}.wav`), "-af", `atempo=${tempo}`, "-ar", "48000", "-ac", "1", wav]);
    // same cleaning for every line, then the same speech level (80th percentile frame level -> -20 dB), then fades
    const { s, sr } = readMonoWav(wav);
    const c = cleanLine(s, sr);
    const lv = frames(c, sr).map((x) => x.l).sort((a, b) => a - b);
    const g = 10 ** ((-20 - (lv[Math.floor(lv.length * 0.8)] ?? -20)) / 20);
    const lvl = fades(c.map((v) => Math.max(-0.98, Math.min(0.98, v * g))), sr);
    // a short burst/breath left at the edges is cut here (no new recording); timing is measured after this
    const tr = trimLeftoverEdges(lvl, sr);
    if (tr.cut > 0) console.log(`AUTO-TRIM line ${i + 1} (${seg.id}): ${tr.cut.toFixed(2)} s of burst/breath cut at the edges (no re-take)`);
    const out = tr.s;
    writeMonoWav(wav, out, sr);
    cleaned.push(out);
    cleanedSr = sr;
  } else if (own) {
    const src = findRecording(i + 1);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", src, "-af", CLEAN, "-ar", "48000", "-ac", "1", wav]);
    console.log(`line ${i + 1} (${seg.id}): ${path.basename(src)}`);
  } else {
    const mp3 = path.join(dir, `${seg.id}.mp3`);
    execFileSync("python", ["-m", "edge_tts", "--voice", EP.voice, `--rate=${EP.rate}`, "--text", seg.say, "--write-media", mp3]);
    // trim leading/trailing silence so the lines butt up tightly
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", mp3, "-af", TRIM, "-ar", "48000", "-ac", "1", wav]);
  }
  const d = duration(wav);
  timing.push({ id: seg.id, start: +t.toFixed(3), end: +(t + d).toFixed(3), words: seg.say.split(/\s+/).length });
  list.push(`file '${wav.replace(/\\/g, "/")}'`, `file '${silence.replace(/\\/g, "/")}'`);
  t += d + GAP;
});

if (own && tts) {
  const bad = checkLines(cleaned, cleanedSr).filter((r) => !r.ok);
  if (bad.length) {
    bad.forEach((r) => console.log(`JOIN CHECK line ${r.line}: ${r.problems.join("; ")}`));
    console.log("JOIN CHECK FAILED: re-take the whole block (one request) instead of splicing single lines, then run this again.");
    process.exit(1);
  }
  console.log(`join check passed (${cleaned.length} lines)`);
  if (t - GAP > MAX_VOICE) {
    console.log(`TOO LONG: ${(t - GAP).toFixed(1)} s of voice at tempo x${tempo} (max ${MAX_VOICE} s at x${MAX_TEMPO}). Cut words from the script and re-take; never speed up more.`);
    process.exit(4);
  }
}
const listFile = path.join(dir, "_list.txt");
writeFileSync(listFile, list.join("\n"));
const out = outDir ? path.join(outDir, `${id}.wav`) : path.join(root, "public/voice", `${id}.wav`);
const joined = path.join(dir, "_joined.wav");
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", listFile, "-ar", "48000", "-ac", "1", joined]);
// bring the whole voice track to VOICE_LUFS (the music levels in src/music.ts assume it), two-pass linear loudnorm
const ln = `loudnorm=I=${VOICE_LUFS}:TP=-2:LRA=11`;
const m = JSON.parse(spawnSync("ffmpeg", ["-hide_banner", "-i", joined, "-af", `${ln}:print_format=json`, "-f", "null", "-"]).stderr.toString().match(/\{[\s\S]*?\}/)![0]);
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", joined, "-af",
  `${ln}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
  "-ar", "48000", "-ac", "1", out]);

writeFileSync(outDir ? path.join(outDir, `${id}-timing.json`) : path.join(root, "src/episodes", `${id}-timing.json`), JSON.stringify(timing, null, 2));
const words = timing.reduce((a, s) => a + s.words, 0);
console.log(`voice: ${out}`);
console.log(`${words} words in ${t.toFixed(1)} s = ${Math.round((words / t) * 60)} words per minute`);
