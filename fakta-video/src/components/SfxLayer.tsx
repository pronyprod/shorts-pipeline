// Sound effects throughout (owner, 12 Nov 2026), for NEW episodes. Same idea and same generated sounds as the
// What If kit (public/sfx/kit/, made by scripts/make-sfx.mjs; see CREDITS.md): a whoosh at every new segment,
// effects that match the words being said (splash, crowd, sizzle, heartbeat, clock, shake, impact), a clock on
// the "tebak" line, a ding on the reveal, plus the episode's own hand-placed hits (`extra`). Cues closer than
// 0.7 s are thinned by priority (never stacked); gaps over 4 s get a soft whoosh. Cues that land while the
// narrator talks play softer, so every word stays clear. The loudness check still applies.
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React, { useMemo } from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";

export type KitSfx = "whoosh" | "impact" | "tick" | "pop" | "ding" | "splash" | "crowd" | "sizzle" | "heartbeat" | "clock" | "shake";
type Cue = { at: number; name: KitSfx; vol: number };

// levels for fakta's mix (voice at -16 LUFS, music under it); measured on the 12 Nov test
const GAIN: Record<KitSfx, number> = { whoosh: 0.4, impact: 0.6, tick: 0.3, pop: 0.42, ding: 0.36, splash: 0.4, crowd: 0.3, sizzle: 0.32, heartbeat: 0.55, clock: 0.3, shake: 0.5 };
const LEN: Record<KitSfx, number> = { whoosh: 0.7, impact: 0.9, tick: 0.06, pop: 0.16, ding: 1.4, splash: 1.0, crowd: 2.6, sizzle: 1.8, heartbeat: 1.7, clock: 2.1, shake: 1.5 };
const PRIORITY: Record<KitSfx, number> = { impact: 9, ding: 8, shake: 7, pop: 6, splash: 6, sizzle: 5, heartbeat: 5, crowd: 5, clock: 4, whoosh: 3, tick: 2 };
const MIN_GAP = 1.5; // about one effect every 2-4 s (0.7 was too busy in the 12 Nov test)
const MAX_GAP = 4;
const CONTENT: [RegExp, KitSfx][] = [
  [/^(laut|lautan|air|ombak|tenggelam|hujan|sungai|danau|pantai|samudra|berenang|basah|water|sea|ocean|wave)$/i, "splash"],
  [/^(orang|penduduk|penonton|semua|warga|ribuan|jutaan|kerumunan|crowd|people)$/i, "crowd"],
  [/^(panas|terbakar|api|mendidih|derajat|bersinar|lava|matahari|meleleh|hot|heat|burn\w*)$/i, "sizzle"],
  [/^(jantung|darah|tubuh|paru-paru|napas|otak|perut|nadi|heart|blood|body)$/i, "heartbeat"],
  [/^(detik|menit|jam|waktu|tahun|hitung|seconds?|minutes?|hours?)$/i, "clock"],
  [/^(gempa|guncang\w*|runtuh|retak|bergetar|longsor|shake|quake|collaps\w*)$/i, "shake"],
  [/^(hantam\w*|tabrak\w*|pecah|hancur|jatuh|meledak|tumbukan|menabrak|hit|crash\w*|impact)$/i, "impact"],
];
const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");

export const kitSfxCues = (opts: {
  captions: Caption[];
  segments: { id: string; start: number; end: number }[];
  seconds: number;
  extra?: { at: number; name: KitSfx; vol?: number }[];
}): Cue[] => {
  const { captions, segments, seconds, extra = [] } = opts;
  const raw: Cue[] = [];
  segments.forEach((s, i) => {
    if (i > 0) raw.push({ at: Math.max(0, s.start - 0.22), name: "whoosh", vol: 1 });
    if (s.id === "tebak") raw.push({ at: s.start + 0.4, name: "clock", vol: 1 });
    if (s.id === "reveal") raw.push({ at: s.start, name: "ding", vol: 1 });
  });
  // one content cue per kind per segment, on the word that names it
  const seen = new Set<string>();
  for (const c of captions) {
    const hit = CONTENT.find(([re]) => re.test(clean(c.text)));
    if (!hit) continue;
    const seg = segments.findIndex((s) => c.startMs / 1000 >= s.start - 0.05 && c.startMs / 1000 < s.end + 0.2);
    const k = `${seg}:${hit[1]}`;
    if (seen.has(k)) continue;
    seen.add(k);
    raw.push({ at: c.startMs / 1000, name: hit[1], vol: 1 });
  }
  for (const e of extra) raw.push({ at: e.at, name: e.name, vol: e.vol ?? 1 });
  const sorted = raw.filter((c) => c.at < seconds - 0.3).sort((a, b) => a.at - b.at || PRIORITY[b.name] - PRIORITY[a.name]);
  const kept: Cue[] = [];
  for (const c of sorted) {
    const last = kept[kept.length - 1];
    if (last && c.at - last.at < MIN_GAP) {
      if (PRIORITY[c.name] > PRIORITY[last.name]) kept[kept.length - 1] = c;
      continue;
    }
    kept.push(c);
  }
  const out: Cue[] = [];
  let prev = 0;
  for (const c of [...kept, { at: seconds - 0.8, name: "tick" as KitSfx, vol: 0 }]) {
    while (c.at - prev > MAX_GAP) {
      prev += 3;
      if (c.at - prev < MIN_GAP) break;
      out.push({ at: prev, name: "whoosh", vol: 0.6 });
    }
    if (c.vol > 0) out.push(c);
    prev = c.at;
  }
  return out;
};

export const SfxLayer: React.FC<{ captions: Caption[]; segments: { id: string; start: number; end: number }[]; seconds: number; extra?: { at: number; name: KitSfx; vol?: number }[] }> = (p) => {
  const { fps } = useVideoConfig();
  const cues = useMemo(() => kitSfxCues(p), [p]);
  const talking = (sec: number) => p.captions.some((c) => sec * 1000 >= c.startMs - 100 && sec * 1000 <= c.endMs + 150);
  return (
    <>
      {cues.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * fps))} durationInFrames={Math.ceil(LEN[c.name] * fps) + 2} layout="none">
          <Audio src={staticFile(`sfx/kit/${c.name}.wav`)} volume={GAIN[c.name] * c.vol * (talking(c.at) ? 0.75 : 1)} />
        </Sequence>
      ))}
    </>
  );
};
