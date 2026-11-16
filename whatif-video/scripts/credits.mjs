// Writes credits/<Composition>.md for one episode: narration, music (the exact track and
// section the video uses), font, fact sources and software.
// Usage: node scripts/credits.mjs <episodeId> <CompositionId>
//   e.g. node scripts/credits.mjs ep001v3 WhatIfEp001V3

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [episodeId, compId] = process.argv.slice(2);
if (!episodeId || !compId) {
  console.error("Usage: node scripts/credits.mjs <episodeId> <CompositionId>");
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, "..");
const src = (f) => pathToFileURL(path.join(root, "src", "whatif", f)).href;
const { [episodeId]: ep } = await import(src(`episodes/${episodeId}.ts`));
const { buildSchedule } = await import(src("timing.ts"));
const { planMusic, DUCK_UNDER_VOICE_DB } = await import(src("music.ts"));
const { templateOf } = await import(src("theme.ts"));
// facts come from the episode's base file (ep001v3 -> ep001.ts)
const baseId = episodeId.replace(/v\d+$/, "");
const { FACTS } = await import(src(`episodes/${baseId}.ts`));
const voices = JSON.parse(readFileSync(path.join(root, "src", "whatif", "episodes", `${episodeId}.voices.json`), "utf8"));

const fps = 30;
const schedule = buildSchedule(ep, voices.durations, fps);
const videoSec = schedule.durationInFrames / fps;
const tpl = templateOf(ep);
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const narration = voices.narrator
  ? [
      `- Generated with the **Google Gemini API**, model ${voices.narrator.models.map((m) => `\`${m}\``).join(" + ")}, prebuilt voice **${voices.narrator.voice}**.`,
      `  ${voices.narrator.requests} API request(s); tempo ${voices.narrator.tempo}x (pitch kept), pauses inside lines capped at ${voices.narrator.innerPauseCap}s.`,
      "  AI-generated voice. Use is subject to the Gemini API Terms of Service. Script and direction: this channel.",
      "  Checked line by line with whisper.cpp (MIT licence, run locally).",
    ]
  : ["- Generated locally with **kokoro-js** (Apache 2.0), Kokoro-82M model (Apache 2.0), voice `af_heart`."];

let music;
if (tpl.libraryMusic) {
  const p = planMusic(ep, schedule.lines, videoSec);
  music = [
    `- **"${p.track.title}" by ${p.track.artist}**, from the **YouTube Audio Library**.`,
    `  Original: \`${p.track.source}\`; loudness-normalised copy \`public/${p.track.file}\`.`,
    p.mode === "early build"
      ? `  Sections used: ${mmss(p.introOffset)}-${mmss(p.introOffset + p.switchSec)} of the track for the opening, then 0:00-${mmss(videoSec - p.switchSec)} from ${p.switchSec.toFixed(1)}s into the video (cross-faded); ${p.track.duration.toFixed(0)}s long, ducked about ${-DUCK_UNDER_VOICE_DB} dB under the voice.`
      : `  Section used: ${mmss(p.offset)}-${mmss(p.offset + videoSec)} of the track (${p.track.duration.toFixed(0)}s long), ducked about ${-DUCK_UNDER_VOICE_DB} dB under the voice.`,
    p.mode === "track build"
      ? `  Its build at ${mmss(p.build.t)} lands on the climax (${p.climaxSec.toFixed(1)}s into the video).`
      : p.mode === "early build"
        ? `  Its rise at ${mmss(p.build.t)} (from the track's quiet start) lands on the climax (${p.climaxSec.toFixed(1)}s into the video).`
        : "  The track has no usable build, so the mix lifts the music at the climax instead.",
    "  Licence: YouTube Audio Library. Before publishing, check this track's licence note in YouTube Studio > Audio Library",
    "  (some tracks require an attribution line in the description). Off YouTube, if a platform mutes it, swap to that platform's library.",
  ];
} else {
  music = ['- **"What If Curious Loop"**: original, generated from code by `scripts/generate-music.mjs`, released as CC0 1.0.'];
}

const facts = Object.values(FACTS).map((f) => `- ${f.note} (${f.source})`);
const out = `# Credits: ${compId} ("${ep.title}")

Render: \`renders/WhatIf_${compId.replace(/^WhatIf/, "")}.mp4\` (${videoSec.toFixed(1)} s). Template ${ep.template ?? "latest"}.

## Narration
${narration.join("\n")}

## Music
${music.join("\n")}

## Visuals
- Episodes up to Ep009: original flat SVG shapes made for this channel (\`src/whatif/components/\`). From Ep010: the
  channel's own style kit (\`src/kit/\`): original low-poly 3D scenes, the channel character Pom, built in code with
  three.js (MIT) via @remotion/three.
- Font: **Montserrat** (Julieta Ulanovsky and contributors), SIL Open Font License 1.1, via \`@remotion/google-fonts\`.
  Pixel look: **Silkscreen** (Jason Kottke) and **Pixelify Sans** (Stefie Justprince), SIL Open Font License 1.1.

## Sound effects
- Kit episodes: all sound effects (whoosh, impact, tick, pop, ding, splash, crowd, sizzle, heartbeat, clock, shake, wind, rumble, waves, hum) are generated in code by
  \`scripts/make-sfx.mjs\` for this channel. No third-party audio; nothing to attribute.

## Facts and sources
${facts.join("\n")}

## Software
- **Remotion** (free for individuals and teams of up to 3; https://www.remotion.dev/license).
`;
mkdirSync(path.join(root, "credits"), { recursive: true });
const file = path.join(root, "credits", `${compId}.md`);
writeFileSync(file, out);
console.log(`wrote ${path.relative(root, file)}`);
