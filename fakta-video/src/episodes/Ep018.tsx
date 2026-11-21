// Episode 18 (Kenapa / flags): "Bendera kita hampir sama dengan Monako". Built on the locked template (from Ep017),
// captions v2 + SfxLayer2 + v2 mix. Infographic only: flags drawn to true ratio and equal height, no map.
import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { captionMoments2, LiveCaptions2, planCaptions2, PunchIn } from "../components/LiveCaptions2";
import { SfxLayer2 } from "../components/SfxLayer2";
import { Soundtrack } from "../components/Soundtrack";
import { Headline, Pill, Stamp, useLife, useT } from "../components/ui";
import { pickTrack } from "../music";
import { C, FONT, SHADOW, W } from "../theme";
import captionsJson from "./ep018-captions.json";
import timing from "./ep018-timing.json";
import { KEYS, type SegmentId } from "./ep018-script";

const captions = captionsJson as Caption[];
const S = Object.fromEntries(timing.map((s) => [s.id, s.start])) as Record<SegmentId, number>;
const E = Object.fromEntries(timing.map((s) => [s.id, s.end])) as Record<SegmentId, number>;
const END_HOLD = 0.3;
export const EP018_SECONDS = timing[timing.length - 1].end + END_HOLD;
export const EP018_TRACK = pickTrack(18, EP018_SECONDS);

const STAMP_Y = 1170;
const TXT = 54;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (seg: SegmentId, w: string, nth = 0) => {
  const hits = captions.filter((c) => c.startMs / 1000 >= S[seg] - 0.01 && c.startMs / 1000 < E[seg] && norm(c.text) === norm(w));
  if (!hits[nth]) throw new Error(`word "${w}" not found in ${seg}`);
  return hits[nth].startMs / 1000;
};

const QEND = EP018_SECONDS + 1;
const FH = 300; // all flags the same height; width = height * ratio
const FY = 760; // flag centre y

// red over white (Indonesia 2:3, Monaco 4:5); flip = white over red (Poland, 5:8)
const Flag: React.FC<{ cx: number; w: number; from: number; to: number; flip?: boolean; shake?: boolean }> = ({ cx, w, from, to, flip }) => {
  const k = useLife(from, to);
  if (k <= 0.001) return null;
  const top = flip ? "#FFFFFF" : "#E70011";
  const bottom = flip ? "#E70011" : "#FFFFFF";
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: FY - FH / 2, width: w, height: FH, transform: `scale(${k})`, border: `8px solid ${C.tinta}`, boxSizing: "border-box", boxShadow: "0 12px 0 rgba(27,16,40,0.85), 0 18px 40px rgba(0,0,0,0.45)", overflow: "hidden" }}>
      <div style={{ height: "50%", background: top }} />
      <div style={{ height: "50%", background: bottom }} />
    </div>
  );
};

const Guess: React.FC = () => {
  const k = useLife(at("tebak", "Tebak"), S.reveal);
  if (k <= 0.001) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top: 400, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 180, color: C.kunyit, textShadow: SHADOW, transform: `scale(${k})` }}>???</div>;
};

const IDW = 450, MCW = 375, ID_X = 290, MC_X = 790;

const Overlays: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(60,40,90,1) 0%, rgba(27,16,40,1) 55%, rgba(7,6,13,1) 100%)" }} />

    {/* HOOK */}
    <Headline x={W / 2} y={200} from={0} to={S.same} size={96} color={C.kunyit}>Indonesia = Monako?</Headline>
    <Pill x={W / 2} y={360} from={0.3} to={S.same} size={TXT}>Bendera hampir kembar</Pill>
    <Flag cx={ID_X} w={IDW} from={0.1} to={S.poland} />
    <Flag cx={MC_X} w={MCW} from={at("hook", "Monako")} to={S.poland} />
    <Pill x={ID_X} y={FY + 215} from={0.4} to={S.poland} size={TXT}>Indonesia</Pill>
    <Pill x={MC_X} y={FY + 215} from={at("hook", "Monako")} to={S.poland} size={TXT}>Monako</Pill>

    {/* SAME: the ratios */}
    <Headline x={W / 2} y={200} from={S.same} to={S.tebak} size={104} color={C.kunyit}>Bedanya: bentuk</Headline>
    <Pill x={ID_X} y={FY + 370} from={at("same", "dua")} to={S.tebak} size={TXT} bg={C.kunyit}>2 : 3</Pill>
    <Pill x={MC_X} y={FY + 370} from={at("same", "empat")} to={S.tebak} size={TXT} bg={C.toska}>4 : 5</Pill>

    {/* TEBAK DULU */}
    <Pill x={W / 2} y={150} from={at("tebak", "Tebak")} to={S.reveal} size={TXT} bg={C.kunyit}>Tebak dulu di komentar</Pill>
    <Guess />
    <Pill x={W / 2} y={330} from={at("tebak", "bendera")} to={S.reveal} size={TXT} bg={C.koral} fg={C.putih}>Siapa lebih tua?</Pill>

    {/* REVEAL */}
    <Headline x={MC_X} y={FY - 250} from={S.reveal} to={S.twist} size={130} color={C.toska}>1881</Headline>
    <Pill x={W / 2} y={200} from={S.reveal} to={S.ours} size={TXT}>Monako resmi</Pill>
    <Stamp x={MC_X} y={FY + 450} from={at("reveal", "seribu")} to={S.ours} color={C.toska} size={64}>Lebih tua</Stamp>

    {/* OURS */}
    <Headline x={ID_X} y={FY - 250} from={S.ours} to={S.twist} size={130} color={C.kunyit}>1945</Headline>
    <Pill x={W / 2} y={200} from={S.ours} to={S.twist} size={TXT}>Pertama dikibarkan</Pill>

    {/* TWIST */}
    <Headline x={W / 2} y={190} from={S.twist} to={S.poland} size={104} color={C.koral}>Tapi tunggu…</Headline>
    <Pill x={W / 2} y={350} from={at("twist", "Majapahit")} to={S.poland} size={TXT} bg={C.kunyit}>Warna dari Majapahit</Pill>
    <Stamp x={ID_X} y={FY + 450} from={at("twist", "Majapahit")} to={S.poland} color={C.kunyit} size={64}>Abad ke-13</Stamp>

    {/* POLAND */}
    <Flag cx={W / 2} w={480} from={S.poland} to={S.question} flip />
    <Headline x={W / 2} y={200} from={S.poland} to={S.question} size={104} color={C.kunyit}>Dibalik = Polandia</Headline>
    <Pill x={W / 2} y={FY + 215} from={at("poland", "Polandia")} to={S.question} size={TXT} bg={C.krim}>Putih di atas</Pill>

    {/* IDENTITY QUESTION */}
    <Flag cx={ID_X} w={IDW} from={S.question} to={QEND} />
    <Flag cx={MC_X} w={MCW} from={S.question + 0.08} to={QEND} />
    <Headline x={W / 2} y={250} from={S.question + 0.15} to={QEND} size={96}>
      Kamu pilih <span style={{ color: C.kunyit }}>yang mana?</span>
    </Headline>
    <Pill x={ID_X} y={FY + 215} from={S.question + 0.25} to={QEND} size={TXT} bg={C.kunyit}>Indonesia</Pill>
    <Pill x={MC_X} y={FY + 215} from={S.question + 0.33} to={QEND} size={TXT} bg={C.kunyit}>Monako</Pill>
    <Pill x={W / 2} y={STAMP_Y + 80} from={at("question", "Tulis")} to={QEND} size={TXT} bg={C.koral} fg={C.putih}>Tulis di komentar ↓</Pill>
  </>
);

const segments = timing.map((s) => ({ id: s.id, start: s.start, end: s.end }));
const BOUNCE = timing.filter((s) => s.id === "reveal" || s.id === "twist").map((s) => [s.start, s.end] as [number, number]);
const SFX_EXTRA = [
  { at: at("reveal", "seribu"), name: "impact" as const },
  { at: at("twist", "Majapahit"), name: "pop" as const },
];

export const Ep018: React.FC = () => {
  useT();
  const plan = useMemo(() => planCaptions2(captions, segments, KEYS, BOUNCE), []);
  const icons = [0.1, at("hook", "Monako"), S.poland, S.question + 0.25];
  const counts: [number, number][] = [];
  const lands = [at("reveal", "seribu"), at("twist", "Majapahit")];
  return (
    <AbsoluteFill style={{ background: C.angkasa }}>
      <PunchIn plan={plan}>
        <Overlays />
      </PunchIn>
      <LiveCaptions2 plan={plan} />
      <Soundtrack voice="voice/ep018.wav" voiceLufs={-16.2} words={captions} track={EP018_TRACK} seconds={EP018_SECONDS} mix="v2" />
      <SfxLayer2 captions={captions} segments={segments} seconds={EP018_SECONDS} extra={SFX_EXTRA} actions={{ moments: captionMoments2(plan), zooms: [], icons, counts, lands }} />
    </AbsoluteFill>
  );
};
