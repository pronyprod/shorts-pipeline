// Captions v2 (owner, 12-14 Nov 2026), for NEW episodes. Ep011/Ep012 and older keep their own components.
// - Highlighting by MEANING: the script exports KEYS (per segment id, the phrases a person would stress: a whole
//   unit like "lima pulau", "tiga meter", "Indonesia"). They are matched to the whisper words of that segment and
//   become one token: never split, at most one sticker per caption phrase; phrases without one get none.
// - Entrances by kind, never the same twice in a row: the hook SLAMS in, number phrases PUNCH in, reveal/twist
//   phrases FLIP or GLITCH in, the rest bounce / pop / swing / rise. The key phrase lands on a coloured sticker with
//   an overshoot when it is spoken. Captions float slightly while idle. 2-4 tokens, <= 24 characters, clear of
//   the bottom 20%. `planCaptions2` + `captionMoments2` also drive PunchIn (camera) and SfxLayer2 (hits).
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const NUMWORD = /^(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|seratus|seribu|puluh|belas|ratus|ribu|juta|miliar|triliun)$/i;
const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");
// numbers spoken as words are shown as digits ("seribu sembilan ratus sepuluh" -> "1910", "lima pulau" -> "5 pulau"):
// shorter, readable at sticker size, and they can count up
const ONES: Record<string, number> = { nol: 0, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9 };
export const digitsOf = (text: string) => {
  const out: string[] = [];
  let total = 0, cur = 0, small = 0, inNum = false, run: string[] = [];
  const flush = () => {
    if (!inNum) return;
    const v = total + cur + small;
    // a lone "satu"/"dua" in a phrase like "satu pulau" reads fine as a word too, but digits are consistent
    const tail = run[run.length - 1].match(/[.,!?:;]+$/)?.[0] ?? "";
    out.push((v >= 1000 && v <= 2100 ? String(v) : v.toLocaleString("id-ID")) + tail);
    total = cur = small = 0;
    inNum = false;
    run = [];
  };
  for (const raw of text.split(/\s+/)) {
    const w = norm(raw);
    const isN = w in ONES || ["puluh", "ratus", "ribu", "belas", "sepuluh", "sebelas", "seratus", "seribu"].includes(w);
    if (!isN) {
      flush();
      out.push(raw);
      continue;
    }
    inNum = true;
    run.push(raw);
    if (w in ONES) small += ONES[w];
    else if (w === "belas") { cur += 10 + small; small = 0; }
    else if (w === "puluh") { cur += small * 10; small = 0; }
    else if (w === "ratus") { cur += small * 100; small = 0; }
    else if (w === "ribu") { total += (cur + small || 1) * 1000; cur = small = 0; }
    else if (w === "sepuluh") cur += 10;
    else if (w === "sebelas") cur += 11;
    else if (w === "seratus") cur += 100;
    else if (w === "seribu") total += 1000;
    if (/[.,!?:;]$/.test(raw)) flush();
  }
  flush();
  return out.join(" ");
};
const isNum = (w: string) => /\d/.test(w) || w.split(/\s+/).some((x) => NUMWORD.test(norm(x)));

export type Kind = "hook" | "number" | "reveal" | "normal";
export type Entrance = "slam" | "punch" | "zoom" | "flip" | "glitch" | "bounce" | "pop" | "swing" | "rise";
type Tok = { text: string; from: number; to: number; key: boolean }; // ms
export type Page2 = { start: number; end: number; tokens: Tok[]; key: number; keyAt: number | null; kind: Kind; entrance: Entrance };
type Seg = { id: string; start: number; end: number };

const MAX_TOKENS = 4;
const MAX_CHARS = 24;
const NORMAL: Entrance[] = ["bounce", "pop", "swing", "rise"];

export const planCaptions2 = (captions: Caption[], segments: Seg[], keys: Partial<Record<string, string[]>>, bounce: [number, number][]): Page2[] => {
  // 1. tokens, with each key phrase merged into one token
  const toks: (Tok & { seg: number })[] = [];
  segments.forEach((s, si) => {
    const words = captions.filter((c) => c.startMs / 1000 >= s.start - 0.05 && c.startMs / 1000 < s.end - 0.02);
    const used = new Set<number>();
    const merges: [number, number][] = [];
    for (const k of keys[s.id] ?? []) {
      const kw = k.split(/\s+/).map(norm);
      for (let i = 0; i + kw.length <= words.length; i++) {
        if (kw.every((x, j) => norm(words[i + j].text) === x) && ![...Array(kw.length).keys()].some((j) => used.has(i + j))) {
          merges.push([i, i + kw.length - 1]);
          for (let j = 0; j < kw.length; j++) used.add(i + j);
          break;
        }
      }
    }
    for (let i = 0; i < words.length; i++) {
      const m = merges.find(([a]) => a === i);
      if (m) {
        toks.push({ text: digitsOf(words.slice(m[0], m[1] + 1).map((w) => w.text.trim()).join(" ")), from: words[m[0]].startMs, to: words[m[1]].endMs, key: true, seg: si });
        i = m[1];
      } else toks.push({ text: words[i].text.trim(), from: words[i].startMs, to: words[i].endMs, key: false, seg: si });
    }
  });
  // 2. pages: new page at a segment change or after . , ? ! :, max 4 tokens / 24 characters; key tokens never split
  const pages: { start: number; end: number; tokens: Tok[] }[] = [];
  let cur: { start: number; end: number; tokens: Tok[]; seg: number } | null = null;
  for (const t of toks) {
    const len = cur ? cur.tokens.reduce((a, x) => a + x.text.length + 1, 0) : 0;
    const prev = cur?.tokens[cur.tokens.length - 1]?.text ?? "";
    if (!cur || cur.seg !== t.seg || cur.tokens.length >= MAX_TOKENS || (len + t.text.length > MAX_CHARS && cur.tokens.length > 0) || /[.,?!:]$/.test(prev)) {
      cur = { start: t.from, end: t.to, tokens: [], seg: t.seg };
      pages.push(cur);
    }
    cur.tokens.push({ text: t.text, from: t.from, to: t.to, key: t.key });
    cur.end = t.to;
  }
  // glue a lone short non-key word to the next page of the same sentence
  for (let i = 0; i < pages.length - 1; i++) {
    const p = pages[i];
    if (p.tokens.length === 1 && !p.tokens[0].key && !/[.?!]$/.test(p.tokens[0].text) && p.tokens[0].text.length + pages[i + 1].tokens.reduce((a, x) => a + x.text.length + 1, 0) <= MAX_CHARS) {
      pages[i + 1].tokens.unshift(p.tokens[0]);
      pages[i + 1].start = p.start;
      pages.splice(i, 1);
      i--;
    }
  }
  pages.forEach((p, i) => {
    if (pages[i + 1]) p.end = Math.max(p.end, Math.min(pages[i + 1].start, p.end + 400));
  });
  // 3. kinds and entrances (never the same twice in a row)
  let prev: Entrance | null = null;
  let ni = 0;
  let ri = 0;
  return pages.map((p, i) => {
    const key = p.tokens.findIndex((t) => t.key);
    const s = p.start / 1000;
    const kind: Kind = i === 0 ? "hook" : bounce.some(([a, b]) => s >= a && s < b) ? "reveal" : p.tokens.some((t) => isNum(t.text)) ? "number" : "normal";
    let entrance: Entrance = kind === "hook" ? "slam" : kind === "number" ? (prev === "punch" ? "zoom" : "punch") : kind === "reveal" ? (["flip", "glitch"] as Entrance[])[ri++ % 2] : NORMAL[ni++ % NORMAL.length];
    if (entrance === prev) entrance = kind === "reveal" ? (entrance === "flip" ? "glitch" : "flip") : NORMAL[ni++ % NORMAL.length];
    prev = entrance;
    return { ...p, key, keyAt: key >= 0 ? p.tokens[key].from / 1000 : null, kind, entrance };
  });
};

export const captionMoments2 = (plan: Page2[]) => ({
  slams: plan.filter((p) => p.entrance === "slam").map((p) => p.start / 1000),
  lands: plan.filter((p) => p.keyAt !== null).map((p) => ({ at: p.keyAt as number, big: p.kind !== "normal" })),
});

// a small camera punch-in when the hook slams in and when a big key phrase lands: wrap the map in it
export const PunchIn: React.FC<{ plan: Page2[]; children: React.ReactNode }> = ({ plan, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = captionMoments2(plan);
  let v = 0;
  for (const s of m.slams) v = Math.max(v, interpolate(frame - s * fps, [0, 3, 14], [0, 0.06, 0], clamp));
  for (const l of m.lands) if (l.big) v = Math.max(v, interpolate(frame - l.at * fps, [0, 4, 14], [0, 0.045, 0], clamp));
  return <AbsoluteFill style={{ transform: `scale(${1 + v})` }}>{children}</AbsoluteFill>;
};

const STICKER: Record<Kind, string> = { hook: C.koral, number: C.kunyit, reveal: C.toska, normal: C.kunyit };
const entranceStyle = (e: Entrance, f: number): React.CSSProperties => {
  const g = (xs: number[], ys: number[]) => interpolate(f, xs, ys, clamp);
  switch (e) {
    case "slam":
      return { transform: `translateX(${Math.sin(f * 2.8) * 11 * g([3, 13], [1, 0])}px) scale(${g([0, 5], [2.3, 1])})`, opacity: g([0, 2], [0, 1]) };
    case "punch":
      return { transform: `scale(${g([0, 3, 7], [0.45, 1.22, 1])})` };
    case "zoom":
      return { transform: `scale(${g([0, 6], [0.2, 1])}) rotate(${g([0, 6], [-7, 0])}deg)` };
    case "flip":
      return { transform: `perspective(900px) rotateX(${g([0, 8], [90, 0])}deg)`, opacity: g([0, 3], [0, 1]) };
    case "glitch": {
      const on = f < 9;
      return { transform: `translateX(${on ? (random(`g${f}`) - 0.5) * 26 : 0}px) skewX(${on ? (random(`s${f}`) - 0.5) * 14 : 0}deg)`, opacity: on && f % 3 === 1 ? 0.55 : 1, filter: on ? `drop-shadow(5px 0 0 ${C.koral}) drop-shadow(-5px 0 0 ${C.toska})` : undefined };
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
const counting = (w: string, p: number) => {
  const m = /^([^\d]*)(\d[\d.,]*)(.*)$/.exec(w);
  if (!m) return w;
  const raw = m[2].replace(/\./g, "").replace(",", ".");
  const value = Number(raw);
  if (!Number.isFinite(value)) return w;
  const dec = raw.includes(".") ? raw.split(".")[1].length : 0;
  return `${m[1]}${(value * Easing.out(Easing.cubic)(p)).toLocaleString("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec })}${m[3]}`;
};

export const LiveCaptions2: React.FC<{ plan: Page2[]; top?: number }> = ({ plan, top = 1330 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const page = plan.find((p) => t >= p.start - 20 && t < p.end);
  if (!page) return null;
  const f = frame - (page.start / 1000) * fps;
  const len = page.tokens.reduce((a, x) => a + x.text.length + 1, 0);
  const longest = Math.max(...page.tokens.map((x) => x.text.length));
  const base = Math.min(76, 880 / (Math.min(len, 18) * 0.66), 880 / (longest * 0.66 * 1.15));
  const rows = len * base * 0.64 > 880 ? 2 : 1;
  const y = Math.min(top, 1520 - rows * base * 1.3);
  return (
    <div style={{ position: "absolute", top: y, left: 50, right: 50, display: "flex", justifyContent: "center", transform: `translateY(${Math.sin(frame / 16) * 4}px)` }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: base * 0.28, rowGap: base * 0.12, ...entranceStyle(page.entrance, f) }}>
        {page.tokens.map((tk, i) => {
          const wf = frame - (tk.from / 1000) * fps;
          const shown = wf >= -1;
          const isKey = i === page.key;
          const size = base * (isKey ? 1.12 : 1);
          const year = /^\d{4}\b/.test(tk.text) && Number(tk.text.slice(0, 4)) >= 1000 && Number(tk.text.slice(0, 4)) <= 2100;
          const text = isKey && /\d/.test(tk.text) && !year ? counting(tk.text, interpolate(wf, [0, 12], [0, 1], clamp)) : tk.text;
          const span = (
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.1, textTransform: "uppercase", color: isKey ? C.tinta : C.putih, WebkitTextStroke: isKey ? undefined : `${Math.round(size * 0.19)}px ${C.tinta}`, paintOrder: "stroke fill", textShadow: isKey ? undefined : "0 8px 18px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
              {text}
            </span>
          );
          if (!isKey)
            return (
              <span key={i} style={{ display: "inline-block", opacity: shown ? interpolate(wf, [-1, 2], [0, 1], clamp) : 0, transform: `scale(${shown ? interpolate(wf, [-1, 3], [0.88, 1], clamp) : 0.88})` }}>
                {span}
              </span>
            );
          const land = interpolate(wf, [-1, 3, 7], [0, 1.2, 1], { ...clamp, easing: Easing.out(Easing.quad) });
          return (
            <span key={i} style={{ display: "inline-block", background: STICKER[page.kind], border: `5px solid ${C.tinta}`, borderRadius: size * 0.22, padding: `${size * 0.04}px ${size * 0.2}px`, boxShadow: "0 7px 0 rgba(0,0,0,0.45)", transform: `rotate(-2.5deg) scale(${shown ? land : 0.001})`, opacity: shown ? 1 : 0 }}>
              {span}
            </span>
          );
        })}
      </div>
    </div>
  );
};
