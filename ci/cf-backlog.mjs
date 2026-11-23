// Country Flux backlog Reels (owner, 23 Nov 2026). No Claude: Kokoro voices are made again locally (free) and each
// older episode gets a Reels version with CC BY music, IF the voices match what was published.
//
//   node ci/cf-backlog.mjs test                      Ep011 (its voice files are in git): new take vs committed, line by line
//   node ci/cf-backlog.mjs build [--only Ep003,Ep004] every live Country Flux episode without a Reels version
//
// Per episode:
//   1. scripts/generate-voices.mjs makes every line again (speed 1). A line whose length differs from the committed
//      epNNN.voices.json by more than 15 ms is also made at the two retry speeds (--attempt 1 = 0.92, 2 = 1.08) and the
//      closest one is kept: that is how a retried line was made back then.
//   2. The committed voices.json is restored, so the video timing is exactly the published one.
//      Accepted only when every line is within 40 ms (about one video frame) of its committed length.
//   3. ci/reels-audio.mjs renders the Reels audio (CC BY track) and muxes it with the published picture.
//   4. The result must sound like the published episode: loudness-envelope correlation with the published audio
//      >= 0.95 (voice and SFX dominate both; only the music differs). Otherwise the episode is skipped.
// Accepted files go to the release "countryballs-reels-backlog" and into ci/meta/reels-extra.json, which
// ci/meta.mjs reads (backlog drip-feed, best performers first).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compareAudio, makeReels } from "./reels-audio.mjs";
import { CHANNELS, sheetGet } from "./sheet.mjs";

const repo = path.resolve(import.meta.dirname, "..");
const project = path.join(repo, "countryballs-video");
const EXTRA = path.join(repo, "ci", "meta", "reels-extra.json");
const TAG = "countryballs-reels-backlog";
const args = process.argv.slice(2);
const cmd = args[0];
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const out = path.join(repo, "ci-out", "cf-backlog");
mkdirSync(out, { recursive: true });
const report = [];
const say = (t) => {
  console.log(t);
  report.push(t);
};
const run = (c, a, o = {}) => spawnSync(c, a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...o });

const pcm = (file) => {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", "24000", "-f", "s16le", "-"], { maxBuffer: 1e9 });
  return new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 2);
};
const corr = (a, b) => {
  const n = Math.min(a.length, b.length);
  let s = 0, sa = 0, sb = 0;
  for (let i = 0; i < n; i++) {
    s += a[i] * b[i];
    sa += a[i] * a[i];
    sb += b[i] * b[i];
  }
  return s / Math.sqrt(sa * sb || 1);
};
const lines = (j) => [["mom", j.mom], ["dad", j.dad], ["me", j.me], ...j.punchlines.map((d, i) => [`punch${i + 1}`, d]), ...(j.intros ?? []).map((d, i) => (d == null ? null : [`intro${i + 1}`, d])).filter(Boolean)];
const gen = (id, extra = []) => {
  const r = run(process.execPath, ["scripts/generate-voices.mjs", id, ...extra], { cwd: project });
  if (r.status !== 0) throw new Error(`generate-voices ${id} ${extra.join(" ")}: ${(r.stderr || r.stdout).slice(-300)}`);
};

// Make the voices of one episode again; returns { ok, worstMs, detail }.
const remakeVoices = (id) => {
  const jf = path.join(project, "src", "countryballs", "episodes", `${id}.voices.json`);
  const committed = readFileSync(jf, "utf8");
  const target = JSON.parse(committed);
  gen(id);
  const fresh = JSON.parse(readFileSync(jf, "utf8"));
  const vdir = path.join(project, "public", "voices", id);
  const worst = [];
  for (const [name, want] of lines(target)) {
    const got0 = Object.fromEntries(lines(fresh))[name];
    let best = { attempt: 0, d: got0 };
    if (Math.abs(got0 - want) > 0.015) {
      const wav = path.join(vdir, `${name}.wav`);
      const takes = { 0: readFileSync(wav) }; // the speed-1 take
      for (const attempt of [1, 2]) {
        gen(id, ["--line", name, "--attempt", String(attempt)]);
        takes[attempt] = readFileSync(wav);
        const d = Object.fromEntries(lines(JSON.parse(readFileSync(jf, "utf8"))))[name];
        if (Math.abs(d - want) < Math.abs(best.d - want)) best = { attempt, d };
      }
      writeFileSync(wav, takes[best.attempt]); // the closest take stays on disk
    }
    worst.push([name, Math.round(Math.abs(best.d - want) * 1000), best.attempt]);
  }
  writeFileSync(jf, committed); // timing stays exactly as published
  const max = Math.max(...worst.map((w) => w[1]));
  return { ok: max <= 40, worstMs: max, detail: worst.filter((w) => w[1] > 5 || w[2]).map((w) => `${w[0]} ${w[1]} ms${w[2] ? ` (attempt ${w[2]})` : ""}`).join(", ") || "all lines within 5 ms" };
};

const download = async (url, file) => {
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new Error(`download HTTP ${r.status}`);
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
};

if (cmd === "test") {
  const id = "ep011";
  const dir = path.join(project, "public", "voices", id);
  const keep = path.join(out, "committed");
  mkdirSync(keep, { recursive: true });
  for (const f of readdirSync(dir)) writeFileSync(path.join(keep, f), readFileSync(path.join(dir, f)));
  const v = remakeVoices(id);
  say(`Ep011 durations: worst ${v.worstMs} ms (${v.detail}) -> ${v.ok ? "OK" : "TOO FAR"}`);
  for (const f of readdirSync(keep)) {
    const a = pcm(path.join(keep, f)), b = pcm(path.join(dir, f));
    // best waveform match within +/- 20 ms (a few ms of trim or resampler delay make a plain correlation meaningless)
    let bestLag = 0, best = -1;
    for (let lag = -480; lag <= 480; lag += 4) {
      const c = lag >= 0 ? corr(a.subarray(lag), b) : corr(a, b.subarray(-lag));
      if (c > best) (best = c), (bestLag = lag);
    }
    const env = (x) => Array.from({ length: Math.floor(x.length / 240) }, (_, i) => Math.sqrt(x.subarray(i * 240, i * 240 + 240).reduce((s, v) => s + v * v, 0) / 240));
    const ea = env(a), eb = env(b);
    const n = Math.min(ea.length, eb.length), ma = ea.slice(0, n).reduce((s, v) => s + v, 0) / n, mb = eb.slice(0, n).reduce((s, v) => s + v, 0) / n;
    let sxy = 0, sx = 0, sy = 0;
    for (let i = 0; i < n; i++) (sxy += (ea[i] - ma) * (eb[i] - mb)), (sx += (ea[i] - ma) ** 2), (sy += (eb[i] - mb) ** 2);
    say(`  ${f}: committed ${(a.length / 24000).toFixed(3)} s, new ${(b.length / 24000).toFixed(3)} s, waveform ${corr(a, b).toFixed(3)}, best within 20 ms ${best.toFixed(3)} (shift ${(bestLag / 24).toFixed(1)} ms), envelope ${(sxy / Math.sqrt(sx * sy)).toFixed(3)}`);
  }
} else if (cmd === "build") {
  const uploads = await sheetGet("'Uploads'!A1:Z");
  const head = uploads[0];
  const iCh = head.indexOf("Channel"), iEp = head.indexOf("Episode"), iSt = head.indexOf("Status"), iFile = head.indexOf("Video file");
  const queue = (await sheetGet(`'${CHANNELS.countryballs.queueTab}'!A3:E`)).filter((r) => /^Ep\d{3}$/.test(r[0] ?? "") && /^https:/.test(r[3] ?? ""));
  const extra = existsSync(EXTRA) ? JSON.parse(readFileSync(EXTRA, "utf8")) : {};
  const done = [];
  for (const [ep, , , url] of queue) {
    if (only && !only.includes(ep)) continue;
    if (extra[`countryballs/${ep}`]) continue;
    const reelsUrl = url.replace(/\.mp4$/i, "-reels.mp4");
    if (/github\.com/.test(url) && (await fetch(reelsUrl, { method: "HEAD", redirect: "follow" })).ok) continue; // made by its own run
    const row = uploads.find((r) => r[iCh] === CHANNELS.countryballs.sheetName && r[iEp] === ep && !/^Removed/i.test(r[iSt] ?? ""));
    const comp = path.basename(row?.[iFile] ?? `${ep}.mp4`, ".mp4"); // e.g. Ep001V2
    const id = comp.toLowerCase();
    try {
      if (!existsSync(path.join(project, "src", "countryballs", "episodes", `${id}.voices.json`))) throw new Error(`no ${id}.voices.json`);
      const v = remakeVoices(id);
      if (!v.ok) throw new Error(`voices differ from the published ones (worst line ${v.worstMs} ms: ${v.detail})`);
      const src = path.join(out, `${comp}.mp4`);
      await download(url, src);
      const r = await makeReels({ channel: "countryballs", episode: ep, mp4: src, composition: comp, outDir: out });
      const c = compareAudio(src, r.out);
      if (c.envelope < 0.95) throw new Error(`does not sound like the published episode (envelope correlation ${c.envelope.toFixed(3)})`);
      const up = run("gh", ["release", "upload", TAG, r.out, "--clobber"]);
      if (up.status !== 0) throw new Error(`release upload: ${up.stderr.slice(0, 160)}`);
      extra[`countryballs/${ep}`] = `https://github.com/${process.env.GITHUB_REPOSITORY}/releases/download/${TAG}/${path.basename(r.out)}`;
      writeFileSync(EXTRA, `${JSON.stringify(extra, null, 2)}\n`);
      done.push(ep);
      say(`${ep} (${comp}): OK, voices worst ${v.worstMs} ms, "${r.track.title}", ${r.seconds.toFixed(1)} s, ${r.lufs} LUFS, envelope ${c.envelope.toFixed(3)} / waveform ${c.waveform.toFixed(3)}`);
    } catch (e) {
      say(`${ep} (${comp}): SKIPPED: ${String(e.message ?? e).slice(0, 300)}`);
    }
  }
  say(`built ${done.length}: ${done.join(", ") || "none"}`);
} else {
  console.error("usage: node ci/cf-backlog.mjs test | build [--only Ep003,Ep004]");
  process.exit(1);
}
if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${report.map((l) => `- ${l}`).join("\n")}\n`, { flag: "a" });
