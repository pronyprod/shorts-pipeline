// Reels version of an episode: same picture, same voice and SFX and the same music volume curve, but a CC BY 4.0
// track (ci/reels-music.json) instead of the YouTube Audio Library one (owner, 23 Nov 2026). YouTube is untouched.
//
//   node ci/reels-audio.mjs --from-result     (workflow, after Verify) uses CHANNEL, PROJECT, ci-out/result.json
//   node ci/reels-audio.mjs --channel X --episode EpNNN --mp4 <file> [--composition C]
//   node ci/reels-audio.mjs --pick --channel X --episode EpNNN [--seconds S]   prints the track (no rendering)
//
// How: the project's Remotion composition is rendered AUDIO ONLY with the input prop reelsMusic (every music <Audio>
// then plays the CC BY file from its start point with the same fades and ducking: src/reelsMusic.ts), the result is
// brought to -14 LUFS (two-pass loudnorm, true peak -1.5 dBTP) and muxed with the original video stream (copied).
// Checked: the length matches the video within 0.15 s, -14 +/- 1 LUFS, true peak <= -1.0 dBTP.
// Output: ci-out/reels/<file without .mp4>-reels.mp4 (ci/deliver.mjs uploads it next to the YouTube file).
// Never blocks the YouTube delivery: the workflow step is continue-on-error and a failure only means no Reels file.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(import.meta.dirname, "..");
export const MUSIC = JSON.parse(readFileSync(path.join(repo, "ci", "reels-music.json"), "utf8"));
const PROJECT = { countryballs: "countryballs-video", whatif: "whatif-video", fakta: "fakta-video" };
const FILE = { countryballs: (ep) => `${ep}.mp4`, whatif: (ep) => `WhatIf_${ep}.mp4`, fakta: (ep) => `Fakta_${ep}.mp4` };
const COMP = { countryballs: (ep) => ep, fakta: (ep) => `Fakta-${ep}` };

// The track for an episode: list[number % length], skipping tracks too short for the video (seconds known).
export const pickTrack = (channel, episode, seconds = 0) => {
  const list = MUSIC.channels[channel];
  if (!list?.length) throw new Error(`no Reels music for channel ${channel}`);
  const n = Number(/(\d+)/.exec(episode)?.[1] ?? 0);
  for (let i = 0; i < list.length; i++) {
    const t = list[(n + i) % list.length];
    if (!seconds || t.seconds - t.start >= seconds + 1) return t;
  }
  return list[n % list.length];
};
export const creditFor = (t) => MUSIC.credit.replace("{title}", t.title);
// How alike two files sound: correlation of their 50 ms loudness envelopes, and of the waveforms (8 kHz mono).
export const compareAudio = (a, b) => {
  const pcm = (f) => {
    const r = spawnSync("ffmpeg", ["-v", "error", "-i", f, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], { maxBuffer: 1e9 });
    return new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 2);
  };
  const env = (x) => {
    const w = 400, o = [];
    for (let i = 0; i + w <= x.length; i += w) {
      let s = 0;
      for (let j = i; j < i + w; j++) s += x[j] * x[j];
      o.push(Math.sqrt(s / w));
    }
    return o;
  };
  const pearson = (x, y) => {
    const n = Math.min(x.length, y.length);
    let mx = 0, my = 0;
    for (let i = 0; i < n; i++) (mx += x[i]), (my += y[i]);
    mx /= n;
    my /= n;
    let sxy = 0, sx = 0, sy = 0;
    for (let i = 0; i < n; i++) (sxy += (x[i] - mx) * (y[i] - my)), (sx += (x[i] - mx) ** 2), (sy += (y[i] - my) ** 2);
    return sxy / Math.sqrt(sx * sy || 1);
  };
  const A = pcm(a), B = pcm(b);
  return { envelope: pearson(env(A), env(B)), waveform: pearson(A, B) };
};
export const reelsFileName = (mp4Name) => mp4Name.replace(/\.mp4$/i, "-reels.mp4");

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(" ")} failed (${r.status}): ${(r.stderr || r.stdout || "").slice(-400)}`);
  return r;
};
const duration = (f) => Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).stdout.trim());
const loudness = (f) => {
  const e = run("ffmpeg", ["-hide_banner", "-nostats", "-i", f, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr;
  const I = Number(/I:\s+(-?[\d.]+) LUFS/.exec(e.slice(e.lastIndexOf("Summary")))?.[1]);
  const tp = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(e.slice(e.lastIndexOf("True peak")))?.[1]);
  return { I, tp };
};

const fetchTrack = async (t) => {
  const dir = path.join(repo, ".cache", "reels-music");
  mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `${t.sha256}.mp3`);
  const ok = () => existsSync(f) && createHash("sha256").update(readFileSync(f)).digest("hex") === t.sha256;
  if (!ok()) {
    const r = await fetch(MUSIC.base + encodeURIComponent(t.file).replace(/%2F/g, "/"));
    if (!r.ok) throw new Error(`download of "${t.title}" failed: HTTP ${r.status}`);
    writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    if (!ok()) throw new Error(`"${t.title}" does not match its sha256 (the file changed upstream?)`);
  }
  return f;
};

export const makeReels = async ({ channel, episode, mp4, composition, outDir = path.join(repo, "ci-out", "reels") }) => {
  const project = path.join(repo, PROJECT[channel]);
  const comp = composition || COMP[channel]?.(episode);
  if (!comp) throw new Error(`no composition name for ${channel} ${episode}`);
  const secs = duration(mp4);
  const t = pickTrack(channel, episode, secs);
  const src = await fetchTrack(t);
  // the CC BY copy at the project's music loudness, where staticFile() finds it
  const rel = `music/reels/${t.id}.m4a`;
  const norm = path.join(project, "public", rel);
  mkdirSync(path.dirname(norm), { recursive: true });
  const gain = MUSIC.musicLufs[channel] - loudness(src).I;
  run("ffmpeg", ["-v", "error", "-y", "-i", src, "-af", `volume=${gain.toFixed(2)}dB,alimiter=limit=0.95:level=false`, "-c:a", "aac", "-b:a", "192k", norm]);
  mkdirSync(outDir, { recursive: true });
  const tmp = path.join(outDir, `${episode}-reels-tmp`);
  mkdirSync(tmp, { recursive: true });
  const props = path.join(tmp, "props.json");
  writeFileSync(props, JSON.stringify({ reelsMusic: { file: rel, start: t.start } }));
  const wav = path.join(tmp, "mix.wav");
  const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : []; // laptop tests
  // the project's own Remotion CLI through node (no shell: paths with spaces are safe on every OS)
  const cli = path.join(project, "node_modules", "@remotion", "cli", "remotion-cli.js");
  run(process.execPath, [cli, "render", "src/index.ts", comp, wav, "--codec=wav", `--props=${props}`, "--log=error", ...browser], { cwd: project });
  // -14 LUFS, two passes
  const m = run("ffmpeg", ["-hide_banner", "-nostats", "-i", wav, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"]).stderr;
  const j = JSON.parse(m.slice(m.lastIndexOf("{"), m.lastIndexOf("}") + 1));
  const ln = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  const out = path.join(outDir, reelsFileName(path.basename(mp4)));
  run("ffmpeg", ["-v", "error", "-y", "-i", mp4, "-i", wav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af", `${ln},aresample=48000,alimiter=limit=0.79:level=false`, "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-t", secs.toFixed(3), "-metadata", `comment=${creditFor(t)}`, "-movflags", "+faststart", out]);
  // checks
  const d = duration(out), L = loudness(out);
  const problems = [];
  if (Math.abs(d - secs) > 0.15) problems.push(`length ${d.toFixed(2)} s vs video ${secs.toFixed(2)} s`);
  if (!(Math.abs(L.I + 14) <= 1)) problems.push(`loudness ${L.I} LUFS (want -14 +/- 1)`);
  if (!(L.tp <= -1.0)) problems.push(`true peak ${L.tp} dBTP (want <= -1.0)`);
  const v = run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height", "-of", "csv=p=0", out]).stdout.trim();
  if (!/^h264,1080,1920/.test(v)) problems.push(`video stream ${v}`);
  if (problems.length) throw new Error(`Reels file failed its checks: ${problems.join("; ")}`);
  return { out, track: t, credit: creditFor(t), seconds: d, lufs: L.I, truePeak: L.tp };
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (n) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
  const summary = (t) => {
    console.log(t);
    if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${t}\n\n`, { flag: "a" });
  };
  try {
    if (args.includes("--pick")) {
      const t = pickTrack(opt("channel"), opt("episode"), Number(opt("seconds") || 0));
      console.log(`${t.title} (start ${t.start} s) -> ${creditFor(t)}`);
    } else if (args.includes("--from-result")) {
      const channel = process.env.CHANNEL;
      const result = JSON.parse(readFileSync(path.join(repo, "ci-out", "result.json"), "utf8"));
      if (result.status !== "ready") {
        console.log(`reels: result is "${result.status}", no Reels version`);
        process.exit(0);
      }
      const mp4 = path.join(repo, PROJECT[channel], "renders", FILE[channel](result.episode));
      const comp = channel === "whatif" ? result.composition : undefined;
      if (channel === "whatif" && !comp) throw new Error("result.json has no composition for PomProds");
      const r = await makeReels({ channel, episode: result.episode, mp4, composition: comp });
      summary(`Reels version: ${path.relative(repo, r.out)} with "${r.track.title}" (CC BY 4.0), ${r.seconds.toFixed(1)} s, ${r.lufs} LUFS, true peak ${r.truePeak} dBTP`);
    } else {
      const r = await makeReels({ channel: opt("channel"), episode: opt("episode"), mp4: opt("mp4"), composition: opt("composition") });
      summary(`Reels version: ${r.out} with "${r.track.title}", ${r.seconds.toFixed(1)} s, ${r.lufs} LUFS, TP ${r.truePeak}`);
    }
  } catch (e) {
    summary(`**Reels version NOT made** (the YouTube delivery is not affected): ${String(e.message ?? e).slice(0, 400)}`);
    process.exit(1);
  }
}
