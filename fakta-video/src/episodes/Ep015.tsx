// Episode 15 (science, TIMELY): supermoon 24 Nov 2026. Built on the locked template (from Ep014),
// captions v2 + SfxLayer2 + v2 mix. No map: one space scene with the Moon, to-scale bars and Moon discs.
import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, Headline, Pill, Stamp, ramp, useLife, useT } from "../components/ui";
import { pickTrack } from "../music";
import { C, FONT, SHADOW, W, fmt } from "../theme";
import captionsJson from "./ep015-captions.json";
import timing from "./ep015-timing.json";
import { KEYS, NUM, type SegmentId } from "./ep015-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
// The voice alone is 39.5 s; the owner's minimum is 40 s, so the picture holds the Moon + peak time for the last second.
const END_HOLD = 1.2;
export const EP015_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP015_TRACK = pickTrack(15, EP015_SECONDS);
const QUESTION_END = E.question + 0.3;

const STAMP_Y = 1170;
const TXT = 54;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};

// deterministic stars
const STARS = Array.from({ length: 70 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 91.7 + n * 13.3) * 43758.5453) % 1 + 1) % 1;
  return { x: r(1) * W, y: r(2) * 1500, s: 2 + r(3) * 4, o: 0.35 + r(4) * 0.6 };
});

const MoonDisc: React.FC<{ cx: number; cy: number; d: number; glow?: number }> = ({ cx, cy, d, glow = 0 }) => (
  <div style={{ position: "absolute", left: cx - d / 2, top: cy - d / 2, width: d, height: d, borderRadius: "50%",
    background: "radial-gradient(circle at 38% 34%, #FFFBEF 0%, #F1E6C8 55%, #CDBF9C 100%)",
    boxShadow: `0 0 ${40 + glow * 90}px ${10 + glow * 40}px rgba(255,244,224,${0.25 + glow * 0.45})` }}>
    {[[0.3, 0.3, 0.16], [0.62, 0.45, 0.22], [0.42, 0.7, 0.13], [0.72, 0.22, 0.09]].map(([x, y, r], i) => (
      <div key={i} style={{ position: "absolute", left: x * d - (r * d) / 2, top: y * d - (r * d) / 2, width: r * d, height: r * d, borderRadius: "50%", background: "rgba(150,135,100,0.35)" }} />
    ))}
  </div>
);

const Bars: React.FC<{ t: number; rows: { label: string; v: number; color: string; from: number }[]; max: number; from: number; to: number; top: number }> = ({ t, rows, max, from, to, top }) => {
  const k = useLife(from, to);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 60, top, width: 960, fontFamily: FONT, opacity: Math.min(1, k * 1.4) }}>
      {rows.map((r) => {
        if (t < r.from) return null;
        const g = ramp(t, r.from, r.from + 0.7);
        return (
          <div key={r.label} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: TXT, fontWeight: 800, textShadow: SHADOW, textTransform: "uppercase", lineHeight: 1.1 }}>
              <span style={{ color: C.putih }}>{r.label}</span>
              <span style={{ color: r.color }}>{fmt(r.v * g, 0)} km</span>
            </div>
            <div style={{ marginTop: 6, width: Math.max(8, (960 * r.v * g) / max), height: 34, borderRadius: 10, background: r.color, border: `4px solid ${C.tinta}`, boxShadow: "0 6px 0 rgba(27,16,40,0.85)" }} />
          </div>
        );
      })}
    </div>
  );
};

const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 200, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>???</div>;
};

// Moon scene pieces -------------------------------------------------------------------------------------------
const MoonMain: React.FC<{ t: number }> = ({ t }) => {
  // one big Moon for hook/what/reveal/local; it sits at y=860 and swells slightly
  const show = t < S.orbit || (t >= S.tebak && t < S.twist);
  if (!show) return null;
  const pop = ramp(t, 0, 0.6);
  const d = 520 + 40 * Math.sin(t * 0.9);
  return <MoonDisc cx={W / 2} cy={860} d={d * pop} glow={0.5} />;
};

// orbit: a deliberately exaggerated ellipse (schematic)
const Orbit: React.FC<{ t: number }> = ({ t }) => {
  const k = useLife(S.orbit, S.tebak);
  if (k <= 0.001) return null;
  const a = 440, b = 250, cx = W / 2, cy = 900;
  const ang = -1.2 + 5.2 * ramp(t, S.orbit, S.tebak - 0.2, (x) => x);
  const mx = cx + a * Math.cos(ang), my = cy + b * Math.sin(ang);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, k * 1.5) }}>
      <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={cx} cy={cy} rx={a} ry={b} fill="none" stroke={C.kunyit} strokeWidth={8} strokeDasharray="22 16" />
        <circle cx={cx - 150} cy={cy} r={62} fill="#3B7BD8" stroke={C.putih} strokeWidth={5} />
      </svg>
      <MoonDisc cx={mx} cy={my} d={96} glow={0.4} />
    </div>
  );
};

const TwoMoons: React.FC<{ bright: boolean }> = ({ bright }) => {
  const from = bright ? S.bright : S.twist;
  const to = bright ? S.question : S.bright;
  const k = useLife(from, to);
  if (k <= 0.001) return null;
  const base = 360;
  const dBig = base * (1 + NUM.biggerPct / 100);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, k * 1.4), fontFamily: FONT }}>
      <MoonDisc cx={300} cy={900} d={base} glow={0} />
      <MoonDisc cx={780} cy={900} d={dBig} glow={bright ? 1 : 0.2} />
      <div style={{ position: "absolute", left: 300 - 250, width: 500, top: 1110, textAlign: "center", color: C.putih, fontWeight: 800, fontSize: TXT, textShadow: SHADOW, textTransform: "uppercase" }}>Terjauh</div>
      <div style={{ position: "absolute", left: 780 - 250, width: 500, top: 1110, textAlign: "center", color: C.kunyit, fontWeight: 800, fontSize: TXT, textShadow: SHADOW, textTransform: "uppercase" }}>Terdekat</div>
    </div>
  );
};

const Overlays: React.FC<{ t: number }> = ({ t }) => (
  <>
    {/* HOOK */}
    <Headline x={W / 2} y={190} from={-0.2} to={S.what} size={120} color={C.kunyit}>24 November</Headline>
    <Pill x={W / 2} y={345} from={0.2} to={S.what} size={TXT} bg={C.kunyit}>Supermoon!</Pill>
    {/* WHAT */}
    <Headline x={W / 2} y={200} from={S.what} to={S.orbit} size={104} color={C.kunyit}>Purnama + dekat Bumi</Headline>
    <Pill x={W / 2} y={1170} from={at("what", "dekat")} to={S.orbit} size={TXT}>Puncak 21.55 WIB</Pill>
    {/* ORBIT */}
    <Headline x={W / 2} y={200} from={S.orbit} to={S.tebak} size={104} color={C.kunyit}>Jaraknya berubah</Headline>
    <Pill x={W / 2} y={1250} from={at("orbit", "lonjong")} to={S.tebak} size={TXT} bg={C.toska}>Skema, bukan skala</Pill>
    {/* TEBAK */}
    <Pill x={W / 2} y={190} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={STAMP_Y} from={at("tebak", "berapa")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Berapa kilometer?</Pill>
    {/* REVEAL */}
    <Counter x={W / 2} y={200} from={S.reveal} to={S.local} a={0} b={NUM.perigeeKm} t0={at("reveal", "Titik")} t1={at("reveal", "tiga") + 1.4} unit=" KM" size={150} />
    <Pill x={W / 2} y={355} from={S.reveal} to={S.local} size={TXT} bg={C.kunyit}>Titik terdekat Bulan</Pill>
    <Stamp x={W / 2} y={STAMP_Y} from={at("reveal", "Titik")} to={S.local} color={C.kunyit} size={84}>NASA</Stamp>
    {/* LOCAL: to scale, Sabang-Merauke is a sliver */}
    <Headline x={W / 2} y={190} from={S.local} to={S.far} size={92} color={C.kunyit}>69 × Sabang–Merauke</Headline>
    <Bars t={t} max={NUM.perigeeKm} from={S.local + 0.1} to={S.far} top={370} rows={[
      { label: "Bulan terdekat", v: NUM.perigeeKm, color: C.toska, from: S.local + 0.1 },
      { label: "Sabang–Merauke", v: NUM.sabangMeraukeKm, color: C.koral, from: at("local", "Sabang") - 0.1 },
    ]} />
    {/* FAR: both bars to scale */}
    <Headline x={W / 2} y={190} from={S.far} to={S.twist} size={104} color={C.kunyit}>Titik terjauh</Headline>
    <Bars t={t} max={NUM.apogeeKm} from={S.far + 0.1} to={S.twist} top={300} rows={[
      { label: "Terdekat", v: NUM.perigeeKm, color: C.toska, from: S.far + 0.1 },
      { label: "Terjauh", v: NUM.apogeeKm, color: C.koral, from: at("far", "Titik") + 0.3 },
    ]} />
    {/* TWIST */}
    <Headline x={W / 2} y={170} from={S.twist} to={at("twist", "Paling")} size={110} color={C.koral}>Tapi tunggu…</Headline>
    <Headline x={W / 2} y={190} from={at("twist", "Paling")} to={S.bright} size={116} color={C.kunyit}>Paling banyak +14%</Headline>
    <Stamp x={W / 2} y={1260} from={at("twist", "empat")} to={S.bright} color={C.kunyit} size={70}>Bedanya tipis</Stamp>
    {/* BRIGHT */}
    <Headline x={W / 2} y={190} from={S.bright} to={S.question} size={116} color={C.kunyit}>+30% terang</Headline>
    <Pill x={W / 2} y={1260} from={at("bright", "tiga")} to={S.question} size={TXT}>Dibanding purnama terkecil</Pill>
    {/* QUESTION */}
    <Headline x={W / 2} y={250} from={S.question + 0.15} to={QUESTION_END} size={96}>
      Kamu lihat dari <span style={{ color: C.kunyit }}>kota mana?</span>
    </Headline>
    {([["Jakarta", 300, 1000], ["Medan", 780, 1000], ["Makassar", 300, 1110], ["Jayapura", 780, 1110]] as [string, number, number][]).map(([n, x, y], i) => (
      <Pill key={n} x={x} y={y} from={S.question + 0.25 + i * 0.08} to={QUESTION_END} size={TXT} bg={C.kunyit}>{n}</Pill>
    ))}
    <Pill x={W / 2} y={STAMP_Y + 80} from={at("question", "Tulis")} to={QUESTION_END} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
    {/* final hold */}
    <Headline x={W / 2} y={250} from={QUESTION_END + 0.05} to={EP015_SECONDS + 1} size={104} color={C.kunyit}>24 November</Headline>
    <Pill x={W / 2} y={1170} from={QUESTION_END + 0.1} to={EP015_SECONDS + 1} size={TXT} bg={C.kunyit}>Puncak 21.55 WIB</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "twist").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("reveal", "Titik"), name: "impact" as const },
  { at: at("bright", "tiga"), name: "pop" as const },
];

export const Ep015: React.FC = () => {
  const t = useT();
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, BOUNCE), []);
  const icons = [at("orbit", "lonjong"), at("local", "Sabang"), S.question + 0.25, QUESTION_END + 0.1];
  const counts: [number, number][] = [[at("reveal", "Titik"), at("reveal", "tiga") + 1.4]];
  const lands = [at("reveal", "Titik"), at("bright", "tiga")];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #14102A 0%, ${C.angkasa} 75%)` }}>
      <PunchIn plan={plan}>
        {STARS.map((s, i) => (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.s, height: s.s, borderRadius: "50%", background: "#fff", opacity: s.o }} />
        ))}
        <MoonMain t={t} />
        <Orbit t={t} />
        {t >= S.twist && t < S.bright && <TwoMoons bright={false} />}
        {t >= S.bright && t < S.question && <TwoMoons bright />}
        {t >= S.question && <MoonDisc cx={W / 2} cy={660} d={400} glow={0.8} />}
        <Overlays t={t} />
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep015.wav" voiceLufs={-16.3} words={captions} track={EP015_TRACK} seconds={EP015_SECONDS} mix="v2" />
      <SfxLayer2 captions={captions} segments={segments} seconds={EP015_SECONDS} extra={SFX_EXTRA} actions={{ moments: captionMoments2(plan), zooms: [S.twist], icons, counts, lands }} />
    </AbsoluteFill>
  );
};
