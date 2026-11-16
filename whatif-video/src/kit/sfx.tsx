// KIT sound effects (12 Nov 2026, owner: effects throughout, matched to the picture, about one every 2-4 s,
// never stacked, always under the voice). All sounds are generated in code by scripts/make-sfx.mjs (public/sfx/).
//  - automatic cues from the episode's data: whoosh on every cut/move, tick on a new rung, ding when a "???" is
//    revealed, impact on the climax line, pop on the twist
//  - content cues from the words being said (on the word): splash (water), crowd (people), sizzle (heat),
//    heartbeat (the body), clock (time pressure), shake (shaking/collapsing), impact (hits)
//  - per-beat extras (`sfx` on a beat) and a quiet ambience per place that dips while the narrator talks
//  - spacing: cues closer than 1.5 s are thinned by priority; gaps over 4 s get a soft cue that fits the place
// Measured: the effects alone sit about 12 dB under the mix; the loudness rules are unchanged.
import { Audio } from "@remotion/media";
import React from "react";
import { Sequence, staticFile } from "remotion";
import type { LineTiming } from "../whatif/timing";
import type { Episode } from "../whatif/types";
import type { PlaceId } from "./places";

export type SfxName = "whoosh" | "impact" | "tick" | "pop" | "ding" | "splash" | "crowd" | "sizzle" | "heartbeat" | "clock" | "shake" | "hit" | "thud" | "rustle" | "crack" | "gasp" | "gulp" | "boing";
export type AmbName = "wind" | "rumble" | "waves" | "hum";
export type SfxCue = SfxName | { name: SfxName; at?: number; vol?: number }; // `at`: seconds into the beat

// +3 dB on 12 Nov evening (owner: effects a bit louder; the voice still sits 8+ dB above music + effects, measured)
// hit softened 0.75 -> 0.42 on 14 Nov: the key-phrase hit sat on the word and took the voice to 2.8 dB over the bed
const GAIN: Record<SfxName, number> = { whoosh: 0.9, impact: 1.3, tick: 0.5, pop: 0.95, ding: 0.8, splash: 0.85, crowd: 0.64, sizzle: 0.7, heartbeat: 1.15, clock: 0.64, shake: 1.1, hit: 0.42, thud: 0.9, rustle: 0.6, crack: 0.8, gasp: 0.6, gulp: 0.6, boing: 0.6 };
const LEN: Record<SfxName, number> = { whoosh: 0.7, impact: 0.9, tick: 0.06, pop: 0.16, ding: 1.4, splash: 1.0, crowd: 2.6, sizzle: 1.8, heartbeat: 1.7, clock: 2.1, shake: 1.5, hit: 0.35, thud: 0.6, rustle: 0.9, crack: 0.5, gasp: 0.45, gulp: 0.3, boing: 0.55 };
// higher wins when two cues are too close
const PRIORITY: Record<SfxName, number> = { impact: 9, ding: 8, shake: 7, pop: 6, splash: 6, sizzle: 5, heartbeat: 5, crowd: 5, clock: 4, whoosh: 3, tick: 2, hit: 6, thud: 6, crack: 6, rustle: 3, gasp: 5, gulp: 5, boing: 5 };
// small action sounds: may sit closer to other cues (0.35 s; counter ticks 0.1 s) and play quieter
const SMALL = new Set<SfxName>(["tick", "pop", "hit", "thud", "rustle", "crack", "gasp", "gulp", "boing"]);
const SMALL_GAP = 0.35;
// heavy, low effects mask words most: under speech they duck about 16 dB instead of 9 (measured 14 Nov)
const HEAVY = new Set<SfxName>(["impact", "shake", "thud", "crack", "crowd", "rumble" as SfxName]);
const AMB_BOOST = 1.5;
const MIN_GAP = 1.5; // seconds between two cues (measured 12 Nov: 0.7 gave an effect every 1.9 s, busier than asked)
const MAX_GAP = 4; // fill longer silences with a soft cue

export const AMBIENCE: Record<PlaceId, { name: AmbName; vol: number } | null> = {
  street: { name: "wind", vol: 0.09 },
  forest: { name: "wind", vol: 0.1 },
  desert: { name: "wind", vol: 0.13 },
  nightTown: { name: "wind", vol: 0.06 },
  ocean: { name: "waves", vol: 0.16 },
  city: { name: "rumble", vol: 0.16 },
  space: { name: "rumble", vol: 0.11 },
  body: { name: "rumble", vol: 0.13 },
  lab: { name: "hum", vol: 0.035 },
};
// the soft cue that fills a long gap, per place
const FILL: Record<PlaceId, SfxName> = { street: "whoosh", forest: "whoosh", desert: "whoosh", nightTown: "whoosh", ocean: "splash", city: "crowd", space: "whoosh", body: "heartbeat", lab: "tick" };

// words in the narration -> the effect that matches them (English and Indonesian)
const CONTENT: [RegExp, SfxName][] = [
  [/^(water|sea|seas|ocean|oceans|wave|waves|splash\w*|swim\w*|sink\w*|sank|drown\w*|tide|tides|river|rain|laut|air|ombak|tenggelam|hujan)$/i, "splash"],
  [/^(crowd|crowds|everyone|people|humans?|fans|stadium|audience|cheer\w*|orang|semua|penonton)$/i, "crowd"],
  [/^(heat|hot|hotter|burn\w*|melt\w*|fire|flames?|boil\w*|sizzl\w*|degrees|lava|sun|panas|terbakar|api|mendidih|derajat)$/i, "sizzle"],
  [/^(heart\w*|blood|pulse|lungs?|body|breath\w*|brain|stomach|jantung|darah|tubuh|paru-paru|napas)$/i, "heartbeat"],
  [/^(seconds?|minutes?|hours?|clock|countdown|time|timer|detik|menit|jam|waktu)$/i, "clock"],
  [/^(break\w*|broke|cracks?|cracked|snap\w*|shatter\w*|splits?|pecah|retak|patah)$/i, "crack"],
  [/^(shak\w*|quake\w*|rumbl\w*|collaps\w*|caves?|crumbl\w*|trembl\w*|gempa|guncang\w*|runtuh)$/i, "shake"],
  [/^(hits?|crash\w*|slam\w*|smash\w*|impact|explod\w*|boom|bang|lands?|landed|struck|strikes?|hantam\w*|tabrak\w*)$/i, "impact"],
];
const cleanWord = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");

type Cue = { frame: number; name: SfxName; vol: number };
export type { Cue };
export const autoCues = (opts: {
  ep: Episode;
  story: number[];
  lines: LineTiming[];
  beatStarts: number[]; // seconds
  beatCues: SfxCue[][];
  beatPlaces: PlaceId[];
  fps: number;
  style: "B" | "D";
  frames: number;
  actions?: Cue[]; // on-screen actions found by the runner (counter ticks, Pom's reactions, landings, key phrases)
}): Cue[] => {
  const { ep, story, lines, beatStarts, beatCues, beatPlaces, fps, style, frames, actions = [] } = opts;
  const raw: Cue[] = [...actions];
  beatStarts.forEach((s, i) => {
    if (i > 0) raw.push({ frame: Math.max(0, Math.round(s * fps) - 7), name: "whoosh", vol: style === "D" ? 0.7 : 1 });
    for (const c of beatCues[i] ?? []) {
      const cue = typeof c === "string" ? { name: c } : c;
      raw.push({ frame: Math.round((s + (cue.at ?? 0)) * fps), name: cue.name, vol: cue.vol ?? 1 });
    }
  });
  let lastTick = -99;
  for (const r of ep.rungs) {
    const f = story.findIndex((t) => t >= r.t);
    if (f > 0 && f < frames && f - lastTick > 9) {
      raw.push({ frame: f, name: "tick", vol: 1 });
      lastTick = f;
    }
  }
  let wasHidden = false;
  for (let f = 0; f < Math.min(frames, story.length); f++) {
    const hidden = !!ep.counterAt?.(story[f])?.mystery;
    if (wasHidden && !hidden) raw.push({ frame: f, name: "ding", vol: 1 });
    wasHidden = hidden;
  }
  const climax = ep.lines.findIndex((l) => l.beat === "climax");
  if (climax >= 0 && lines[climax]) raw.push({ frame: Math.round(lines[climax].start * fps), name: "impact", vol: 1 });
  const twist = ep.lines.findIndex((l) => l.beat === "twist");
  if (twist >= 0 && lines[twist]) raw.push({ frame: Math.round(lines[twist].start * fps), name: "pop", vol: 1 });
  // content cues: on the word that names it (word times spread by length, like the captions); one per line per kind
  lines.forEach((l, i) => {
    const words = (ep.lines[i]?.text ?? "").split(/\s+/);
    const total = words.reduce((a, w) => a + w.length + 1, 0);
    let acc = 0;
    const seen = new Set<SfxName>();
    for (const w of words) {
      const t = l.start + (acc / total) * (l.end - l.start);
      acc += w.length + 1;
      const hit = CONTENT.find(([re]) => re.test(cleanWord(w)));
      if (hit && !seen.has(hit[1])) {
        seen.add(hit[1]);
        raw.push({ frame: Math.round(t * fps), name: hit[1], vol: 1 });
      }
    }
  });
  // never stacked. Big effects: keep the higher-priority one when two are closer than MIN_GAP.
  const sorted = raw.filter((c) => c.frame < frames && !SMALL.has(c.name)).sort((a, b) => a.frame - b.frame || PRIORITY[b.name] - PRIORITY[a.name]);
  const big: Cue[] = [];
  for (const c of sorted) {
    const last = big[big.length - 1];
    if (last && c.frame - last.frame < MIN_GAP * fps) {
      if (PRIORITY[c.name] > PRIORITY[last.name]) big[big.length - 1] = c;
      continue;
    }
    big.push(c);
  }
  // small action sounds: closer is fine, but never on top of another cue; quieter
  const small = raw.filter((c) => SMALL.has(c.name)).filter((c) => c.frame >= 0 && c.frame < frames).sort((a, b) => a.frame - b.frame || PRIORITY[b.name] - PRIORITY[a.name]);
  const all: Cue[] = [...big];
  for (const c of small) {
    const near = all.some((o) => Math.abs(o.frame - c.frame) < (c.name === "tick" && o.name === "tick" ? 0.1 : SMALL_GAP) * fps);
    if (!near) all.push({ ...c, vol: c.vol * 0.75 });
  }
  all.sort((a, b) => a.frame - b.frame);
  const kept = all;
  // about one every 2-4 s: fill longer silences with a soft cue that fits the place
  const beatAtSec = (sec: number) => {
    let b = 0;
    beatStarts.forEach((s, k) => {
      if (sec >= s) b = k;
    });
    return b;
  };
  const out: Cue[] = [];
  let prev = 0;
  for (const c of [...kept, { frame: frames - Math.round(0.8 * fps), name: "tick" as SfxName, vol: 0 }]) {
    if (SMALL.has(c.name) && c.vol > 0) {
      out.push(c);
      continue;
    }
    while (c.frame - prev > MAX_GAP * fps) {
      prev += Math.round(3 * fps);
      if (c.frame - prev < MIN_GAP * fps) break;
      out.push({ frame: prev, name: FILL[beatPlaces[beatAtSec(prev / fps)]] ?? "whoosh", vol: 0.55 });
    }
    if (c.vol > 0) out.push(c);
    prev = c.frame;
  }
  return out;
};

export const SfxLayer: React.FC<{
  cues: Cue[];
  ambienceAt: (frame: number) => { name: AmbName; vol: number } | null;
  talkingAt: (frame: number) => number; // 0-1, how much the narrator is talking
  frames: number;
}> = ({ cues, ambienceAt, talkingAt, frames }) => {
  const ambs: AmbName[] = ["wind", "rumble", "waves", "hum"];
  const ambVol = (name: AmbName, f: number) => {
    let v = 0;
    for (let k = -4; k <= 4; k++) {
      const a = ambienceAt(Math.max(0, Math.min(frames - 1, f + k)));
      v += a && a.name === name ? a.vol / 9 : 0;
    }
    const fade = Math.min(1, f / 15, (frames - f) / 15);
    return AMB_BOOST * v * (1 - 0.45 * talkingAt(f)) * Math.max(0, fade);
  };
  return (
    <>
      {ambs.map((name) => {
        let used = false;
        for (let f = 0; f < frames && !used; f += 15) used = ambienceAt(f)?.name === name;
        return used ? <Audio key={name} src={staticFile(`sfx/${name}.wav`)} loop volume={(f) => ambVol(name, f)} /> : null;
      })}
      {cues.map((c, i) => (
        <Sequence key={i} from={c.frame} durationInFrames={Math.ceil(LEN[c.name] * 30) + 2} layout="none">
          {/* under the voice: while the narrator speaks, effects duck about 9 dB (measured: keeps the voice 8+ dB above
              music + effects); between lines they play full */}
          <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={(f) => GAIN[c.name] * c.vol * (1 - (HEAVY.has(c.name) ? 0.84 : 0.65) * talkingAt(c.frame + f))} />
        </Sequence>
      ))}
    </>
  );
};
