// KIT lively captions v2 (owner, 12 Nov 2026 evening).
// - Highlighting by MEANING: the script marks key phrases (`keys` on a line, or the kit file's `keys`), each a
//   complete unit ("1 trillion", "right now", "Swift"). The phrase splitter never cuts one in half; at most one
//   per caption phrase gets a coloured sticker; phrases without one get none. No automatic per-word highlighter.
// - Entrances by kind, never the same twice in a row: the hook SLAMS in (big -> normal + shake), number phrases
//   PUNCH in and count up, twist/climax lines FLIP or GLITCH in, other phrases bounce/pop/swing/rise.
// - The sticker lands with an overshoot when its words are spoken; captions float slightly while idle.
// - `planCaptions` is shared with the camera punch-ins and the sound effects (hits synced to key phrases).
// Kit episodes only (the published 2D episodes keep src/whatif/components/Captions.tsx).
import React from "react";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { phraseChunks } from "../whatif/components/Captions";
import type { LineTiming } from "../whatif/timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const NB = " "; // joins a key phrase into one token
export type Kind = "hook" | "number" | "reveal" | "normal";
export type Entrance = "slam" | "punch" | "zoom" | "flip" | "glitch" | "bounce" | "pop" | "swing" | "rise";
export type CapChunk = { line: number; tokens: string[]; start: number; end: number; wordStarts: number[]; key: number; keyAt: number | null; kind: Kind; entrance: Entrance };

const NORMAL: Entrance[] = ["bounce", "pop", "swing", "rise"];
const MAX_CHARS = 24;
// a phrase longer than MAX_CHARS splits at its most balanced point between tokens (a key phrase is one token, never cut)
const splitLong = (tokens: string[]): string[][] => {
  const len = (ts: string[]) => ts.join(" ").length;
  if (len(tokens) <= MAX_CHARS || tokens.length < 2) return [tokens];
  let best = 1;
  for (let k = 1; k < tokens.length; k++) if (Math.max(len(tokens.slice(0, k)), len(tokens.slice(k))) < Math.max(len(tokens.slice(0, best)), len(tokens.slice(best)))) best = k;
  return [...splitLong(tokens.slice(0, best)), ...splitLong(tokens.slice(best))];
};
const strip = (w: string) => w.replace(/[.,!?;:…]+$/g, "");

export const planCaptions = (texts: string[], lines: LineTiming[], beats: (string | undefined)[], keys: string[][]): CapChunk[] => {
  const out: CapChunk[] = [];
  let prev: Entrance | null = null;
  let normalI = 0;
  let revealI = 0;
  lines.forEach((l, i) => {
    let text = texts[i];
    const ks = (keys[i] ?? []).filter((k) => k && text.includes(k));
    for (const k of ks) text = text.replace(k, k.replace(/ /g, NB));
    const chunks = phraseChunks(text).flatMap(splitLong);
    const weights = chunks.map((c) => c.join(" ").length + 4);
    const total = weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    chunks.forEach((tokens, ci) => {
      const cStart = l.start + (acc / total) * (l.end - l.start);
      const cEnd = l.start + ((acc + weights[ci]) / total) * (l.end - l.start);
      acc += weights[ci];
      const chars = tokens.map((w) => w.length + 1);
      const ct = chars.reduce((a, b) => a + b, 0);
      let wa = 0;
      const wordStarts = tokens.map((_, k) => {
        const t = cStart + (wa / ct) * (cEnd - cStart);
        wa += chars[k];
        return t;
      });
      const key = tokens.findIndex((w) => ks.some((k) => strip(w) === k.replace(/ /g, NB) || strip(w) === k));
      const kind: Kind = i === 0 && ci === 0 ? "hook" : beats[i] === "twist" || beats[i] === "climax" ? "reveal" : tokens.some((w) => /\d/.test(w)) ? "number" : "normal";
      let entrance: Entrance;
      if (kind === "hook") entrance = "slam";
      else if (kind === "number") entrance = prev === "punch" ? "zoom" : "punch";
      else if (kind === "reveal") entrance = (["flip", "glitch"] as Entrance[])[revealI++ % 2];
      else entrance = NORMAL[normalI++ % NORMAL.length];
      if (entrance === prev) entrance = kind === "reveal" ? (entrance === "flip" ? "glitch" : "flip") : NORMAL[normalI++ % NORMAL.length];
      prev = entrance;
      out.push({ line: i, tokens, start: cStart, end: cEnd, wordStarts, key, keyAt: key >= 0 ? wordStarts[key] : null, kind, entrance });
    });
  });
  return out;
};

// moments for the camera and the sound: the hook slam, and every key phrase landing (big = hook/number/reveal)
export const captionMoments = (plan: CapChunk[]) => ({
  slams: plan.filter((c) => c.entrance === "slam").map((c) => c.start),
  lands: plan.filter((c) => c.keyAt !== null).map((c) => ({ at: c.keyAt as number, big: c.kind !== "normal" })),
});

// "11,000" / "$1" / "2.5%" counting up from 0, keeping the format
const counting = (w: string, p: number) => {
  const m = /^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/s.exec(w);
  if (!m) return w;
  const raw = m[2].replace(/,/g, "");
  const value = Number(raw);
  if (!Number.isFinite(value)) return w;
  const dec = raw.includes(".") ? raw.split(".")[1].length : 0;
  const v = value * Easing.out(Easing.cubic)(p);
  return `${m[1]}${v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: m[2].includes(",") })}${m[3]}`;
};

export type CaptionLook = { font: string; weight: number; color: string; ink: string; pixel?: boolean; sticker: Record<Kind, string> };
export const LOOKS: Record<"main" | "pixel", CaptionLook> = {
  main: { font: "", weight: 900, color: "#FFFFFF", ink: "#0A1226", sticker: { hook: "#FF5A5F", number: "#FFD166", reveal: "#4FC3FF", normal: "#FFD166" } },
  pixel: { font: "", weight: 700, color: "#F5F0FF", ink: "#0B0716", pixel: true, sticker: { hook: "#FF3EA5", number: "#FFE14A", reveal: "#3EF0FF", normal: "#4CFF8A" } },
};

const TOP = 1290;
const BOTTOM = 1520;

const entranceStyle = (e: Entrance, f: number, pixel: boolean): React.CSSProperties => {
  const g = (xs: number[], ys: number[]) => interpolate(f, xs, ys, clamp);
  switch (e) {
    case "slam": {
      const shake = Math.sin(f * 2.8) * 11 * g([3, 13], [1, 0]);
      return { transform: `translateX(${shake}px) scale(${g([0, 5], [2.3, 1])})`, opacity: g([0, 2], [0, 1]) };
    }
    case "punch":
      return { transform: `scale(${g([0, 3, 7], [0.45, 1.22, 1])})` };
    case "zoom":
      return { transform: `scale(${g([0, 6], [0.2, 1])}) rotate(${g([0, 6], [-7, 0])}deg)` };
    case "flip":
      return { transform: `perspective(900px) rotateX(${g([0, 8], [90, 0])}deg)`, opacity: g([0, 3], [0, 1]) };
    case "glitch": {
      const on = f < 9;
      const jx = on ? (random(`gx${Math.floor(f / (pixel ? 2 : 1))}`) - 0.5) * 26 : 0;
      return { transform: `translateX(${jx}px) skewX(${on ? (random(`gs${f}`) - 0.5) * 14 : 0}deg)`, opacity: on && f % 3 === 1 ? 0.55 : 1, filter: on ? "drop-shadow(5px 0 0 #FF3EA5) drop-shadow(-5px 0 0 #3EF0FF)" : undefined };
    }
    case "bounce":
      return { transform: `translateY(${g([0, 4, 8, 11], [55, -14, 5, 0])}px)`, opacity: g([0, 2], [0, 1]) };
    case "pop":
      return { transform: `scale(${g([0, 3, 6], [0.7, 1.12, 1])})` };
    case "swing":
      return { transform: `rotate(${g([0, 4, 8], [-11, 4, 0])}deg) scale(${g([0, 4], [0.9, 1])})`, transformOrigin: "50% 100%" };
    case "rise":
    default:
      return { transform: `translateY(${g([0, 7], [36, 0])}px)`, opacity: g([0, 4], [0, 1]) };
  }
};

export const LiveCaptions: React.FC<{ plan: CapChunk[]; lines: LineTiming[]; look: CaptionLook }> = ({ plan, lines, look }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  // the phrase on screen: from its start until the next phrase (or 0.25 s after its line ends)
  let ci = -1;
  plan.forEach((c, k) => {
    if (sec >= c.start - 0.02) ci = k;
  });
  if (ci < 0) return null;
  const c = plan[ci];
  const next = plan[ci + 1];
  if (sec > lines[c.line].end + 0.25 && (!next || sec < next.start - 0.02)) return null;
  const step = (x: number) => (look.pixel ? Math.floor(x / 2) * 2 : x);
  const f = step(frame - c.start * fps);
  const words = c.tokens.map((w) => w.replace(new RegExp(NB, "g"), " "));
  const len = words.join(" ").length;
  const longest = Math.max(...words.map((w) => w.length));
  const base = Math.min(look.pixel ? 74 : 86, 860 / (Math.min(len, 18) * (look.pixel ? 0.66 : 0.62)), 860 / (longest * 0.68 * 1.15));
  const float = Math.sin(frame / 16) * 4;
  const ent = entranceStyle(c.entrance, f, !!look.pixel);
  const outline = look.pixel
    ? `5px 0 0 ${look.ink}, -5px 0 0 ${look.ink}, 0 5px 0 ${look.ink}, 0 -5px 0 ${look.ink}, 5px 5px 0 ${look.ink}, -5px -5px 0 ${look.ink}, 7px 10px 0 ${look.ink}`
    : `0 ${base * 0.09}px 0 rgba(0,0,0,0.5)`;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: TOP, height: BOTTOM - TOP, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${float}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: base * 0.28, rowGap: base * 0.12, ...ent }}>
        {words.map((w, k) => {
          const wf = step(frame - c.wordStarts[k] * fps);
          const shown = wf >= -1;
          const isKey = k === c.key;
          const num = /\d/.test(w);
          const size = base * (isKey ? 1.12 : 1);
          const text = isKey && num ? counting(w, interpolate(wf, [0, 12], [0, 1], clamp)) : w;
          const span = (
            <span
              style={{
                fontFamily: look.font,
                fontWeight: look.weight,
                fontSize: size,
                lineHeight: 1.08,
                textTransform: "uppercase",
                color: isKey ? look.ink : look.color,
                WebkitTextStroke: look.pixel || isKey ? undefined : `${size * 0.11}px ${look.ink}`,
                paintOrder: "stroke fill",
                textShadow: isKey ? undefined : outline,
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {text}
            </span>
          );
          if (!isKey)
            return (
              <span key={k} style={{ display: "inline-block", opacity: shown ? interpolate(wf, [-1, 2], [0, 1], clamp) : 0, transform: `scale(${shown ? interpolate(wf, [-1, 3], [0.88, 1], clamp) : 0.88})` }}>
                {span}
              </span>
            );
          // the key phrase: a bold coloured sticker that lands with an overshoot when it is spoken
          const land = interpolate(wf, [-1, 3, 7], [0, 1.2, 1], { ...clamp, easing: Easing.out(Easing.quad) });
          return (
            <span
              key={k}
              style={{
                display: "inline-block",
                background: look.sticker[c.kind],
                border: `${look.pixel ? 6 : 5}px solid ${look.ink}`,
                borderRadius: look.pixel ? 0 : size * 0.22,
                padding: `${size * 0.04}px ${size * 0.2}px`,
                boxShadow: look.pixel ? `7px 8px 0 ${look.ink}` : `0 ${size * 0.1}px 0 rgba(0,0,0,0.45)`,
                transform: `rotate(${look.pixel ? 0 : -2.5}deg) scale(${shown ? land : 0.001})`,
                opacity: shown ? 1 : 0,
              }}
            >
              {span}
            </span>
          );
        })}
      </div>
    </div>
  );
};
