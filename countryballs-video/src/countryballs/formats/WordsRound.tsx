import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background } from "../components/Background";
import { Caption } from "../components/Caption";
import { CountryBall } from "../components/CountryBall";
import { EMBLEM_SAFE } from "../emblems";
import { labelStyle, NEUTRAL_BG, shade } from "../theme";
import { introTimes } from "./timing";
import type { FormatVoices, WordsRoundData } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SPOTS = [
  { x: 285, y: 580 },
  { x: 795, y: 580 },
  { x: 285, y: 930 },
  { x: 795, y: 930 },
];
const BAND = { top: 1190, bottom: 1450 };

// Four balls show the same word in their own language.
export const WordsRound: React.FC<{
  round: WordsRoundData;
  index: number;
  episodeId: string;
  voices: FormatVoices;
}> = ({ round, index, episodeId, voices }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  const t = introTimes(voices, index);
  const voice = (file: string) => staticFile(`voices/${episodeId}/${file}.wav`);
  const entryIn = (i: number) => s(t.guess - 0.4 + i * ((t.punch - t.guess + 0.2) / 4));
  const popIn = (start: number) =>
    interpolate(frame, [start, start + s(0.3)], [0, 1], {
      ...clamp,
      easing: Easing.spring({ damping: 11 }),
      output: "perceptual-scale",
    });

  return (
    <AbsoluteFill>
      <Background
        color={interpolateColors(frame, [0, s(t.reveal)], [NEUTRAL_BG, shade(round.color, -0.3)])}
      />
      <div
        style={{
          ...labelStyle,
          position: "absolute",
          left: 0,
          right: 0,
          top: 225,
          textAlign: "center",
          fontSize: round.word.length > 9 ? 104 : 124,
          scale: interpolate(frame, [0, s(0.3)], [2.4, 1], { ...clamp, easing: Easing.bezier(0.12, 0.8, 0.3, 1) }),
        }}
      >
        {round.word}
      </div>

      {round.entries.map((entry, i) => {
        const start = entryIn(i);
        const spot = SPOTS[i];
        if (frame < start) return null;
        return (
          <div key={entry.flag + i} style={{ position: "absolute", inset: 0, scale: 1 }}>
            <CountryBall
              flag={entry.flag}
              size={240}
              expression="half"
              previous="open"
              blend={interpolate(frame, [s(t.punch), s(t.punch) + 5], [0, 1], clamp)}
              eyePlacement={EMBLEM_SAFE[entry.flag]}
              style={{
                left: spot.x,
                top: spot.y + Math.sin((frame + i * 13) / 9) * 5,
                scale: popIn(start),
              }}
            />
            <div
              style={{
                ...labelStyle,
                position: "absolute",
                left: spot.x - 265,
                width: 530,
                top: spot.y + 130,
                textAlign: "center",
                textTransform: "none",
                fontSize: entry.word.length > 12 ? 52 : 66,
                scale: popIn(start + 3),
              }}
            >
              {entry.word}
            </div>
          </div>
        );
      })}

      <Sequence from={s(t.punch)} layout="none">
        <Caption text={round.punchline} bottom={470} band={BAND} pill big />
      </Sequence>

      <Audio src={voice(`intro${index + 1}`)} from={s(t.intro)} />
      <Audio src={voice(`punch${index + 1}`)} from={s(t.punch)} />
    </AbsoluteFill>
  );
};
