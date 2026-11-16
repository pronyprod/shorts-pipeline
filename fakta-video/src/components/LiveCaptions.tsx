// Lively captions (owner, 12 Nov 2026), for NEW episodes (published episodes keep `Captions` in ui.tsx).
// Same words and whisper timing as before, but alive: each word pops in on its real start time, the key word
// of each phrase is bigger and turmeric, numbers are bigger (and count up when written in digits), impact
// words shake, reveal lines bounce. Phrases of 2-4 words (<= 24 characters), a new phrase after . , ? ! :,
// at most 2 rows, always clear of the bottom 20% (y <= 1520). Channel font and ink outline.
import type { Caption } from "@remotion/captions";
import React from "react";
import { Easing, interpolate } from "remotion";
import { C, FONT } from "../theme";
import { useT } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const STOP = new Set(["yang", "dan", "itu", "ini", "dari", "untuk", "dengan", "kamu", "kita", "bisa", "sudah", "akan", "juga", "atau", "tapi", "cuma", "ada", "di", "ke", "per", "sampai", "sekitar", "lebih", "karena", "seperti", "nggak", "tidak"]);
const NUMWORD = /^(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|seratus|seribu|puluh|belas|ratus|ribu|juta|miliar|triliun)$/i;
const IMPACT = /^(pecah|hancur|jatuh|meledak|terbakar|bersinar|runtuh|hantam\w*|tabrak\w*|gempa|guncang\w*|tenggelam|hilang|punah|mati|panas|wow|astaga)$/i;
const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}%.,-]/gu, "").replace(/[.,]+$/, "");
const isNum = (w: string) => /\d/.test(w) || NUMWORD.test(clean(w));

type Tok = { text: string; from: number; to: number };
type Page = { start: number; end: number; tokens: Tok[] };
const MAX_WORDS = 4;
const MAX_CHARS = 24;
const paginate = (caps: Caption[]): Page[] => {
  const pages: Page[] = [];
  let cur: Page | null = null;
  for (const c of caps) {
    const text = c.text.trim();
    const len = cur ? cur.tokens.reduce((a, x) => a + x.text.length + 1, 0) : 0;
    const prev = cur?.tokens[cur.tokens.length - 1]?.text ?? "";
    if (!cur || cur.tokens.length >= MAX_WORDS || len + text.length > MAX_CHARS || /[.,?!:]$/.test(prev)) {
      cur = { start: c.startMs, end: c.endMs, tokens: [] };
      pages.push(cur);
    }
    cur.tokens.push({ text, from: c.startMs, to: c.endMs });
    cur.end = c.endMs;
  }
  // glue a lone word to its neighbour (2+ words per phrase where possible)
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].tokens.length > 1 || pages.length < 2) continue;
    const j = i < pages.length - 1 && !/[.?!]$/.test(pages[i].tokens[0].text) ? i + 1 : i - 1;
    if (j < 0) continue;
    const [a, b] = j > i ? [pages[i], pages[j]] : [pages[j], pages[i]];
    a.tokens.push(...b.tokens);
    a.end = b.end;
    pages.splice(j > i ? j : i, 1);
    i--;
  }
  pages.forEach((p, i) => {
    if (pages[i + 1]) p.end = Math.max(p.end, Math.min(pages[i + 1].start, p.end + 400));
  });
  return pages;
};
const keyIndex = (toks: Tok[]) => {
  const n = toks.findIndex((t) => isNum(t.text));
  if (n >= 0) return n;
  let best = -1;
  toks.forEach((t, i) => {
    const c = clean(t.text).replace(/[^\p{L}]/gu, "");
    if (c.length >= 4 && !STOP.has(c) && (best === -1 || c.length > clean(toks[best].text).length)) best = i;
  });
  return best;
};
const counting = (w: string, p: number) => {
  const m = /^([^\d]*)(\d[\d.,]*)(.*)$/.exec(w);
  if (!m) return w;
  const raw = m[2].replace(/\./g, "").replace(",", ".");
  const value = Number(raw);
  if (!Number.isFinite(value)) return w;
  const dec = raw.includes(".") ? raw.split(".")[1].length : 0;
  const v = (value * Easing.out(Easing.cubic)(p)).toLocaleString("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return `${m[1]}${v}${m[3]}`;
};

// `bounceFrom`: seconds; phrases starting inside these [start, end) spans bounce (reveals, twists)
export const LiveCaptions: React.FC<{ captions: Caption[]; top?: number; bounce?: [number, number][] }> = ({ captions, top = 1330, bounce = [] }) => {
  const t = useT() * 1000;
  const pages = React.useMemo(() => paginate(captions), [captions]);
  const page = pages.find((p) => t >= p.start && t < p.end);
  if (!page) return null;
  const key = keyIndex(page.tokens);
  const len = page.tokens.reduce((a, x) => a + x.text.length + 1, 0);
  const base = Math.min(76, 900 / (Math.min(len, 16) * 0.66));
  const rows = len * base * 0.62 > 900 ? 2 : 1;
  const y = Math.min(top, 1520 - rows * base * 1.45 * 1.12);
  const reveal = bounce.some(([a, b]) => page.start / 1000 >= a && page.start / 1000 < b);
  const k = reveal
    ? interpolate(t - page.start, [0, 130, 260, 400], [0.86, 1.12, 0.97, 1], clamp)
    : interpolate(t - page.start, [0, 90], [0.92, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <div style={{ position: "absolute", top: y, left: 50, right: 50, display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "center", columnGap: base * 0.3, transform: `scale(${k})` }}>
      {page.tokens.map((tk, i) => {
        const f = t - tk.from; // ms since the word was spoken
        if (f < -30) return null;
        const num = isNum(tk.text);
        const isKey = i === key;
        const size = base * (num ? 1.35 : isKey ? 1.25 : 1);
        const pop = interpolate(f, [-30, 70, 170], [0.45, 1.18, 1], { ...clamp, easing: Easing.out(Easing.quad) });
        const shake = IMPACT.test(clean(tk.text)) ? Math.sin(f / 13) * 7 * interpolate(f, [0, 300], [1, 0], clamp) : 0;
        const on = t >= tk.from && t < tk.to;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: size,
              lineHeight: 1.1,
              textTransform: "uppercase",
              color: num ? C.toska : isKey ? C.kunyit : on ? "#FFF4C2" : C.putih,
              WebkitTextStroke: `${Math.round(size * 0.19)}px ${C.tinta}`,
              paintOrder: "stroke fill",
              textShadow: "0 8px 18px rgba(0,0,0,0.5)",
              transform: `translateX(${shake}px) scale(${pop})`,
              opacity: interpolate(f, [-30, 40], [0, 1], clamp),
            }}
          >
            {/\d/.test(tk.text) ? counting(tk.text, interpolate(f, [0, 360], [0, 1], clamp)) : tk.text}
          </span>
        );
      })}
    </div>
  );
};
