// Brings a rendered episode to the channel loudness (-14 LUFS integrated, true peak <= -1.5 dBTP)
// with ffmpeg's two-pass loudnorm.
// Without --target-mb the video stream is copied untouched (V1).
// With --target-mb=N the video is re-encoded with two-pass x264 (preset slow) to land near N MB,
// and the result is compared with the raw render (SSIM; 0.98+ = no visible difference).
// Usage: node scripts/finalize.mjs renders/_Fakta_Ep001V2_raw.mp4 renders/Fakta_Ep001V2.mp4 --target-mb=26

import { spawnSync } from "node:child_process";
import { statSync, rmSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const [input, output] = args.filter((a) => !a.startsWith("--"));
const targetMb = Number(args.find((a) => a.startsWith("--target-mb="))?.split("=")[1] ?? 0);
if (!input || !output) {
  console.error("Usage: node scripts/finalize.mjs <raw.mp4> <final.mp4> [--target-mb=N]");
  process.exit(1);
}
const TARGET = { I: -14, TP: -1.5, LRA: 11 };
const AUDIO_KBPS = 160;

const run = (argv) => {
  const r = spawnSync("ffmpeg", argv);
  if (r.status !== 0) throw new Error(r.stderr.toString());
  return r.stderr.toString();
};
const measure = (file, filter) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-vn", "-af", filter, "-f", "null", "-"]);
  const json = r.stderr.toString().match(/\{[\s\S]*?\}/);
  if (!json) throw new Error(r.stderr.toString());
  return JSON.parse(json[0]);
};
const duration = (file) =>
  Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).stdout.toString().trim());

const first = measure(input, `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:print_format=json`);
const audioFilter =
  `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:measured_I=${first.input_i}:measured_TP=${first.input_tp}` +
  `:measured_LRA=${first.input_lra}:measured_thresh=${first.input_thresh}:offset=${first.target_offset}:linear=true`;

if (!targetMb) {
  run(["-y", "-hide_banner", "-v", "error", "-i", input, "-c:v", "copy", "-af", audioFilter, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", output]);
} else {
  // video bitrate that, with the audio, fills the size budget (2% kept for the container)
  const dur = duration(input);
  const videoKbps = Math.floor((targetMb * 8e6 * 0.98) / dur / 1000 - AUDIO_KBPS);
  const log = path.join(path.dirname(output), "_x264pass");
  const v = ["-c:v", "libx264", "-preset", "slow", "-b:v", `${videoKbps}k`, "-maxrate", `${videoKbps * 2}k`, "-bufsize", `${videoKbps * 4}k`,
    "-pix_fmt", "yuv420p", "-profile:v", "high", "-g", "60", "-passlogfile", log];
  run(["-y", "-hide_banner", "-v", "error", "-i", input, ...v, "-pass", "1", "-an", "-f", "null", "-"]);
  run(["-y", "-hide_banner", "-v", "error", "-i", input, ...v, "-pass", "2", "-af", audioFilter, "-ar", "48000", "-c:a", "aac", "-b:a", `${AUDIO_KBPS}k`, "-movflags", "+faststart", output]);
  for (const f of [`${log}-0.log`, `${log}-0.log.mbtree`]) rmSync(f, { force: true });
  const ssim = run(["-hide_banner", "-i", output, "-i", input, "-lavfi", "[0:v][1:v]ssim", "-f", "null", "-"]).match(/All:([\d.]+)/)?.[1];
  console.log(`video:  x264 2-pass ${videoKbps} kb/s, SSIM vs raw render ${ssim} (1 = identical)`);
}

const after = measure(output, "loudnorm=print_format=json");
console.log(`before: ${first.input_i} LUFS, true peak ${first.input_tp} dBTP`);
console.log(`after:  ${after.input_i} LUFS, true peak ${after.input_tp} dBTP, LRA ${after.input_lra} LU`);
console.log(`length: ${duration(output).toFixed(2)} s, size ${(statSync(output).size / 1e6).toFixed(1)} MB -> ${output}`);
