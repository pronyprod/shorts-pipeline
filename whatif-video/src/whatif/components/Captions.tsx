import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, fontFamily, LAYOUT } from "../theme";
import type { LineTiming } from "../timing";

const MAX_WORDS = 7;
const MAX_FONT = 84;
const CHAR_WIDTH = 0.7;
const LINE_HEIGHT = 1.12;

// Splits a line into chunks of at most MAX_WORDS, preferring sentence ends
const chunk = (text: string) => {
  const sentences = text.match(/[^.!?:]+[.!?:]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  const out: string[][] = [];
  for (const s of sentences) {
    const words = s.split(" ");
    const last = out[out.length - 1];
    if (last && last.length + words.length <= 4) {
      last.push(...words);
      continue;
    }
    const parts = Math.ceil(words.length / MAX_WORDS);
    const size = Math.ceil(words.length / parts);
    for (let i = 0; i < words.length; i += size) out.push(words.slice(i, i + size));
  }
  return out;
};

// Template 2: readable phrases of 2-5 words. Splits at punctuation, glues lone
// fragments ("16.", "Us.") to their neighbour, and splits long runs evenly.
export const phraseChunks = (text: string) => {
  const segments: string[][] = [];
  let cur: string[] = [];
  for (const w of text.split(" ")) {
    cur.push(w);
    if (/[.,!?:;]$/.test(w)) {
      segments.push(cur);
      cur = [];
    }
  }
  if (cur.length) segments.push(cur);
  // glue one-word segments to the next one (or the previous one at the end)
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].length > 1 || segments.length === 1) continue;
    if (i < segments.length - 1) segments[i + 1] = [...segments[i], ...segments[i + 1]];
    else segments[i - 1] = [...segments[i - 1], ...segments[i]];
    segments.splice(i, 1);
    i--;
  }
  const out: string[][] = [];
  for (const seg of segments) {
    const parts = Math.ceil(seg.length / 5);
    let from = 0;
    for (let p = 0; p < parts; p++) {
      const size = Math.round((seg.length - from) / (parts - p));
      out.push(seg.slice(from, from + size));
      from += size;
    }
  }
  return out;
};

// Rows of similar length (about 18 characters each, at least one row)
const toRows = (words: string[]) => {
  const total = words.join(" ").length;
  if (total < 16) return [words];
  const count = Math.max(2, Math.round(total / 18));
  const target = total / count;
  const rows: string[][] = [[]];
  let len = 0;
  for (const w of words) {
    const row = rows[rows.length - 1];
    if (row.length && rows.length < count && len + w.length / 2 > target) {
      rows.push([w]);
      len = w.length + 1;
    } else {
      row.push(w);
      len += w.length + 1;
    }
  }
  return rows;
};

// Big karaoke captions. Each narration line is its own audio clip, so the
// line's timing is exact; inside a line, words are timed by their length.
// `whole[i]`: show line i in one piece (used for the title in frame 1).
export const Captions: React.FC<{ texts: string[]; whole: boolean[]; lines: LineTiming[]; phrases?: boolean }> = ({
  texts,
  whole,
  lines,
  phrases = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  // show the current line, or hold the previous one through the pause
  let i = lines.findIndex((l) => sec < l.end);
  if (i === -1) return null;
  if (sec < lines[i].start && i > 0 && sec - lines[i - 1].end < 0.25) i -= 1;
  else if (sec < lines[i].start && i > 0) return null;

  const { start, end } = lines[i];
  const chunks = whole[i] ? [texts[i].split(" ")] : phrases ? phraseChunks(texts[i]) : chunk(texts[i]);
  const weights = chunks.map((c) => c.join(" ").length + 4);
  const total = weights.reduce((a, b) => a + b, 0);
  const p = Math.min(0.999, Math.max(0, (sec - start) / (end - start)));
  let acc = 0;
  let ci = 0;
  for (; ci < chunks.length; ci++) {
    if (p < (acc + weights[ci]) / total) break;
    acc += weights[ci];
  }
  ci = Math.min(ci, chunks.length - 1);
  const cStart = acc / total;
  const cEnd = (acc + weights[ci]) / total;
  const words = chunks[ci];
  const inChunk = (p - cStart) / (cEnd - cStart);
  const chars = words.map((w) => w.length + 1);
  const charTotal = chars.reduce((a, b) => a + b, 0);
  let wAcc = 0;
  let active = 0;
  for (; active < words.length; active++) {
    wAcc += chars[active];
    if (inChunk * charTotal < wAcc) break;
  }

  const chunkStartFrame = (start + cStart * (end - start)) * fps;
  const pop = interpolate(frame, [chunkStartFrame - 1, chunkStartFrame + 5], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2)),
  });

  const rows = toRows(words);
  const longest = Math.max(...rows.map((r) => r.join(" ").length));
  const band = LAYOUT.captionBottom - LAYOUT.captionTop;
  const fontSize = Math.min(MAX_FONT, 920 / (longest * CHAR_WIDTH), band / (rows.length * LINE_HEIGHT));

  let wordIndex = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: LAYOUT.captionTop,
        height: band,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
        fontWeight: 900,
        fontSize,
        lineHeight: LINE_HEIGHT,
        textTransform: "uppercase",
        textAlign: "center",
        transform: `scale(${pop})`,
      }}
    >
      {rows.map((row, r) => (
        <div key={r} style={{ whiteSpace: "nowrap" }}>
          {row.map((w, k) => {
            const idx = wordIndex++;
            return (
              <span
                key={k}
                style={{
                  color: idx === active ? COLORS.accent : idx < active ? COLORS.text : "rgba(255,255,255,0.9)",
                  WebkitTextStroke: `${fontSize * 0.1}px ${COLORS.ink}`,
                  paintOrder: "stroke fill",
                  textShadow: `0 ${fontSize * 0.08}px 0 rgba(0,0,0,0.45)`,
                }}
              >
                {w}
                {k < row.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
