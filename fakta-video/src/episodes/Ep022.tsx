// Episode 22 (Kenapa): how a rice cooker knows the rice is done. Locked template (from Ep019),
// captions v2 + SfxLayer2 + v2 mix. Infographic only: a pot, water level, magnet, counters, pills.
import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Counter, Headline, Pill, Stamp, useT } from "../components/ui";
import { pickTrack } from "../music";
import { C, W } from "../theme";
import captionsJson from "./ep022-captions.json";
import timing from "./ep022-timing.json";
import { KEYS, type SegmentId } from "./ep022-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP022_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP022_TRACK = pickTrack(22, EP022_SECONDS);

const TXT = 54;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};



const QEND = EP022_SECONDS + 1;

// the pot: water drains when the rice has soaked it up; the magnet under it turns grey when it lets go
const Pot: React.FC = () => {
  const t = useT();
  const d0 = S.twist, d1 = at("twist", "habis");
  const water = 1 - Math.max(0, Math.min(1, (t - d0) / Math.max(0.5, d1 - d0 + 1.2)));
  const hot = t > d0 + 0.5;
  const released = t > at("magnet", "kehilangan");
  return (
    <>
      <div style={{ position: "absolute", left: 290, top: 660, width: 500, height: 330, borderRadius: "30px 30px 120px 120px", background: "#d9d2c4", border: `10px solid ${C.tinta}`, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 300 * water, background: "rgba(61,219,217,0.75)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, background: "#f3e6c4", opacity: 0.9 }} />
      </div>
      <div style={{ position: "absolute", left: 340, top: 1000, width: 400, height: 28, borderRadius: 10, background: hot ? C.koral : "#6b5f73", border: `6px solid ${C.tinta}` }} />
      <div style={{ position: "absolute", left: 480, top: 1036, width: 120, height: 60, borderRadius: 10, background: released ? "#6b5f73" : C.kunyit, border: `6px solid ${C.tinta}`, transform: released ? "translateY(18px)" : "none" }} />
    </>
  );
};

const Overlays: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(40,20,60,1) 0%, rgba(27,16,40,1) 55%, rgba(7,6,13,1) 100%)" }} />
    <Pot />

    {/* HOOK */}
    <Headline x={W / 2} y={230} from={0} to={S.why} size={104} color={C.kunyit}>Penanak nasi</Headline>
    <Pill x={W / 2} y={420} from={at("hook", "otak,")} to={S.why} size={TXT} bg={C.toska}>Nggak punya otak</Pill>
    <Stamp x={W / 2} y={1200} from={at("hook", "persis")} to={S.why} color={C.koral} size={72}>Tahu kapan matang</Stamp>

    {/* WHY */}
    <Pill x={W / 2} y={170} from={S.why} to={S.twist} size={TXT}>Rahasianya: air</Pill>
    <Counter x={W / 2} y={380} from={S.why} to={S.twist} a={25} b={100} t0={at("why", "Selama")} t1={at("why", "seratus")} unit="°C" size={170} color={C.kunyit} />
    <Pill x={W / 2} y={1200} from={at("why", "lebih")} to={S.twist} size={TXT} bg={C.toska}>Ada air = maks 100 °C</Pill>

    {/* TWIST */}
    <Headline x={W / 2} y={170} from={S.twist} to={at("twist", "begitu")} size={96} color={C.koral}>Tapi tunggu…</Headline>
    <Pill x={W / 2} y={170} from={at("twist", "begitu")} to={S.magnet} size={TXT}>Air habis terserap</Pill>
    <Headline x={W / 2} y={380} from={at("twist", "naik")} to={S.magnet} size={150} color={C.kunyit}>&gt; 100 °C</Headline>
    <Stamp x={W / 2} y={1200} from={at("twist", "langsung")} to={S.magnet} color={C.koral} size={72}>Suhu melonjak</Stamp>

    {/* MAGNET */}
    <Pill x={W / 2} y={170} from={at("magnet", "magnet")} to={S.warm} size={TXT} bg={C.kunyit}>Magnet kecil di bawah panci</Pill>
    <Pill x={W / 2} y={330} from={at("magnet", "didih,")} to={S.warm} size={TXT} bg={C.toska}>Lewat titik didih…</Pill>
    <Stamp x={W / 2} y={1200} from={at("magnet", "kehilangan")} to={S.warm} color={C.koral} size={72}>Magnet lepas!</Stamp>

    {/* WARM */}
    <Pill x={W / 2} y={170} from={S.warm} to={S.tebak} size={TXT} bg={C.toska}>Saklar terlepas</Pill>
    <Headline x={W / 2} y={380} from={at("warm", "mode")} to={S.tebak} size={130} color={C.kunyit}>MODE HANGAT</Headline>
    <Pill x={W / 2} y={1200} from={at("warm", "supaya")} to={S.tebak} size={TXT}>Nasi nggak gosong</Pill>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={170} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Headline x={W / 2} y={380} from={at("tebak", "Tebak")} to={S.reveal} size={190} color={C.kunyit}>???</Headline>
    <Pill x={W / 2} y={1200} from={at("tebak", "berapa")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Suhu mode hangat?</Pill>

    {/* REVEAL */}
    <Pill x={W / 2} y={170} from={S.reveal} to={S.question} size={TXT}>Suhu mode hangat</Pill>
    <Counter x={W / 2} y={380} from={S.reveal} to={S.question} a={0} b={65} t0={S.reveal} t1={at("reveal", "lima")} unit="°C" size={170} color={C.kunyit} />
    <Stamp x={W / 2} y={1200} from={at("reveal", "derajat!")} to={S.question} color={C.koral} size={72}>Sekitar, banyak model</Stamp>

    {/* IDENTITY QUESTION */}
    <Headline x={W / 2} y={250} from={S.question + 0.15} to={QEND} size={96}>
      Nasi <span style={{ color: C.kunyit }}>berapa kali sehari?</span>
    </Headline>
    <Pill x={290} y={1200} from={S.question + 0.25} to={QEND} size={TXT} bg={C.kunyit}>1×</Pill>
    <Pill x={540} y={1200} from={S.question + 0.33} to={QEND} size={TXT} bg={C.kunyit}>2×</Pill>
    <Pill x={790} y={1200} from={S.question + 0.41} to={QEND} size={TXT} bg={C.kunyit}>3×</Pill>
    <Pill x={W / 2} y={1310} from={at("question", "Tulis")} to={QEND} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "twist").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("reveal", "enam"), name: "impact" as const },
  { at: at("magnet", "kehilangan"), name: "pop" as const },
];

export const Ep022: React.FC = () => {
  useT();
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, BOUNCE), []);
  const icons = [at("hook", "otak,"), at("why", "lebih"), at("twist", "begitu"), at("magnet", "magnet"), at("warm", "mode"), S.question + 0.25];
  const counts: [number, number][] = [
    [at("why", "Selama"), at("why", "seratus")],
    [S.reveal, at("reveal", "lima")],
  ];
  const lands = [at("reveal", "derajat!"), at("magnet", "kehilangan")];
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <PunchIn plan={plan}>
        <Overlays />
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep022.wav" voiceLufs={-16.2} words={captions} track={EP022_TRACK} seconds={EP022_SECONDS} mix="v2" />
      <SfxLayer2 captions={captions} segments={segments} seconds={EP022_SECONDS} extra={SFX_EXTRA} actions={{ moments: captionMoments2(plan), zooms: [], icons, counts, lands }} />
    </AbsoluteFill>
  );
};
