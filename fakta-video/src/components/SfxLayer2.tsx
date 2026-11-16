// Sound effects v2 (owner, 12-14 Nov 2026), for NEW episodes (Ep011/Ep012 keep SfxLayer). Same generated sounds as the
// What If kit (public/sfx/kit/, scripts/make-sfx.mjs; see CREDITS.md). On top of SfxLayer's cues (whoosh per segment,
// sounds that match the words, clock on "tebak", ding on "reveal", the episode's `extra` hits) it adds ACTIONS:
//  - the hook slam (impact) and a hit when each key phrase lands (from captionMoments2)
//  - map zooms (`zooms`: a whoosh), icons/pills appearing (`icons`: a pop), numbers counting (`counts`: ticks that
//    speed up), things landing (`lands`: a thud)
// Big effects stay 1.5 s apart; small action sounds may sit closer (0.35 s; ticks 0.1 s) and play quieter. Effects are
// 3 dB louder than SfxLayer, and duck while the narrator speaks (about 9 dB, heavy low ones about 16 dB) so the voice
// stays 8+ dB on top (measured on the 14 Nov test). The loudness check still applies.
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React, { useMemo } from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import { duckAmount, speechSpans } from "./Soundtrack";

export type KitSfx2 = "whoosh" | "impact" | "tick" | "pop" | "ding" | "splash" | "crowd" | "sizzle" | "heartbeat" | "clock" | "shake" | "hit" | "thud" | "rustle" | "crack" | "gasp" | "gulp" | "boing";
type Cue = { at: number; name: KitSfx2; vol: number };

const GAIN: Record<KitSfx2, number> = { whoosh: 0.56, impact: 0.85, tick: 0.34, pop: 0.6, ding: 0.5, splash: 0.56, crowd: 0.42, sizzle: 0.45, heartbeat: 0.78, clock: 0.42, shake: 0.7, hit: 0.24, thud: 0.6, rustle: 0.42, crack: 0.55, gasp: 0.42, gulp: 0.42, boing: 0.42 };
const LEN: Record<KitSfx2, number> = { whoosh: 0.7, impact: 0.9, tick: 0.06, pop: 0.16, ding: 1.4, splash: 1.0, crowd: 2.6, sizzle: 1.8, heartbeat: 1.7, clock: 2.1, shake: 1.5, hit: 0.35, thud: 0.6, rustle: 0.9, crack: 0.5, gasp: 0.45, gulp: 0.3, boing: 0.55 };
const PRIORITY: Record<KitSfx2, number> = { impact: 9, ding: 8, shake: 7, pop: 6, splash: 6, sizzle: 5, heartbeat: 5, crowd: 5, clock: 4, whoosh: 3, tick: 2, hit: 6, thud: 6, crack: 6, rustle: 3, gasp: 5, gulp: 5, boing: 5 };
const SMALL = new Set<KitSfx2>(["tick", "pop", "hit", "thud", "rustle", "crack", "gasp", "gulp", "boing"]);
const HEAVY = new Set<KitSfx2>(["impact", "shake", "thud", "crack", "crowd"]);
const MIN_GAP = 1.5;
const SMALL_GAP = 0.35;
const MAX_GAP = 4;
const CONTENT: [RegExp, KitSfx2][] = [
  [/^(laut|lautan|air|ombak|tenggelam|hujan|sungai|danau|pantai|samudra|berenang|basah)$/i, "splash"],
  [/^(orang|penduduk|penonton|semua|warga|ribuan|jutaan|kerumunan)$/i, "crowd"],
  [/^(panas|terbakar|api|mendidih|derajat|bersinar|lava|matahari|meleleh)$/i, "sizzle"],
  [/^(jantung|darah|tubuh|paru-paru|napas|otak|perut|nadi)$/i, "heartbeat"],
  [/^(detik|menit|jam|waktu|hitung)$/i, "clock"],
  [/^(pecah|retak|patah|terbelah)$/i, "crack"],
  [/^(gempa|guncang\w*|runtuh|bergetar|longsor)$/i, "shake"],
  [/^(hantam\w*|tabrak\w*|hancur|jatuh|meledak|tumbukan|menabrak)$/i, "impact"],
];
const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");

export type SfxActions = {
  moments?: { slams: number[]; lands: { at: number; big: boolean }[] };
  zooms?: number[]; // seconds a map zoom / camera move starts
  icons?: number[]; // seconds an icon, pill or pin appears
  counts?: [number, number][]; // [start, end] seconds of a number counting up
  lands?: number[]; // seconds something lands
};

export const kitSfxCues2 = (opts: { captions: Caption[]; segments: { id: string; start: number; end: number }[]; seconds: number; extra?: { at: number; name: KitSfx2; vol?: number }[]; actions?: SfxActions; fps: number }): Cue[] => {
  const { captions, segments, seconds, extra = [], actions = {}, fps } = opts;
  const raw: Cue[] = [];
  segments.forEach((s, i) => {
    if (i > 0) raw.push({ at: Math.max(0, s.start - 0.22), name: "whoosh", vol: 1 });
    if (s.id === "tebak") raw.push({ at: s.start + 0.4, name: "clock", vol: 1 });
    if (s.id === "reveal") raw.push({ at: s.start, name: "ding", vol: 1 });
  });
  const seen = new Set<string>();
  for (const c of captions) {
    const hit = CONTENT.find(([re]) => re.test(clean(c.text)));
    if (!hit) continue;
    const seg = segments.findIndex((s) => c.startMs / 1000 >= s.start - 0.05 && c.startMs / 1000 < s.end + 0.2);
    if (seen.has(`${seg}:${hit[1]}`)) continue;
    seen.add(`${seg}:${hit[1]}`);
    raw.push({ at: c.startMs / 1000, name: hit[1], vol: 1 });
  }
  for (const e of extra) raw.push({ at: e.at, name: e.name, vol: e.vol ?? 1 });
  // actions
  for (const s of actions.moments?.slams ?? []) raw.push({ at: s, name: "impact", vol: 0.8 });
  for (const l of actions.moments?.lands ?? []) raw.push({ at: l.at, name: "hit", vol: l.big ? 1 : 0.6 });
  for (const z of actions.zooms ?? []) raw.push({ at: z, name: "whoosh", vol: 0.7 });
  for (const t of actions.icons ?? []) raw.push({ at: t, name: "pop", vol: 1 });
  for (const t of actions.lands ?? []) raw.push({ at: t, name: "thud", vol: 1 });
  for (const [a, b] of actions.counts ?? []) {
    // ticks that speed up: every 9 frames at the start, every 3 at the end
    for (let t = a; t < b; ) {
      raw.push({ at: t, name: "tick", vol: 0.55 });
      t += (9 - 6 * ((t - a) / Math.max(0.01, b - a))) / fps;
    }
  }
  // big effects: never stacked (1.5 s)
  const sorted = raw.filter((c) => c.at < seconds - 0.3 && !SMALL.has(c.name)).sort((x, y) => x.at - y.at || PRIORITY[y.name] - PRIORITY[x.name]);
  const big: Cue[] = [];
  for (const c of sorted) {
    const last = big[big.length - 1];
    if (last && c.at - last.at < MIN_GAP) {
      if (PRIORITY[c.name] > PRIORITY[last.name]) big[big.length - 1] = c;
      continue;
    }
    big.push(c);
  }
  // small action sounds: closer is fine, never on top of another cue, quieter
  const all: Cue[] = [...big];
  for (const c of raw.filter((x) => x.at >= 0 && x.at < seconds - 0.3 && SMALL.has(x.name)).sort((x, y) => x.at - y.at || PRIORITY[y.name] - PRIORITY[x.name])) {
    if (!all.some((o) => Math.abs(o.at - c.at) < (c.name === "tick" && o.name === "tick" ? 0.1 : SMALL_GAP))) all.push({ ...c, vol: c.vol * 0.75 });
  }
  all.sort((x, y) => x.at - y.at);
  // gaps over 4 s between big effects get a soft whoosh
  const out: Cue[] = [];
  let prev = 0;
  for (const c of [...all, { at: seconds - 0.8, name: "tick" as KitSfx2, vol: 0 }]) {
    if (SMALL.has(c.name) && c.vol > 0) {
      out.push(c);
      continue;
    }
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

export const SfxLayer2: React.FC<{ captions: Caption[]; segments: { id: string; start: number; end: number }[]; seconds: number; extra?: { at: number; name: KitSfx2; vol?: number }[]; actions?: SfxActions }> = (p) => {
  const { fps } = useVideoConfig();
  const cues = useMemo(() => kitSfxCues2({ ...p, fps }), [p, fps]);
  const spans = useMemo(() => speechSpans(p.captions), [p.captions]);
  return (
    <>
      {cues.map((c, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(c.at * fps))} durationInFrames={Math.ceil(LEN[c.name] * fps) + 2} layout="none">
          <Audio src={staticFile(`sfx/kit/${c.name}.wav`)} volume={(f) => GAIN[c.name] * c.vol * (1 - (HEAVY.has(c.name) ? 0.84 : 0.65) * duckAmount(c.at + f / fps, spans))} />
        </Sequence>
      ))}
    </>
  );
};
