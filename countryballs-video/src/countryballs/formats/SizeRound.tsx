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
import { Countdown } from "../components/Countdown";
import { CountryBall } from "../components/CountryBall";
import { EMBLEM_SAFE } from "../emblems";
import { labelStyle, NEUTRAL_BG, shade } from "../theme";
import { introTimes } from "./timing";
import type { Country, FormatVoices, SizeRoundData } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const START_SIZE = 300;
const WINNER_SIZE = 500;
const BALL_Y = 800;
const LEFT_X = 285;
const RIGHT_X = 795;
const BAND = { top: 1190, bottom: 1450 };

// Size duel: both balls start equal, then grow so ball area matches country area.
export const SizeRound: React.FC<{
  round: SizeRoundData;
  index: number;
  episodeId: string;
  voices: FormatVoices;
}> = ({ round, index, episodeId, voices }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  const t = introTimes(voices, index);
  const voice = (file: string) => staticFile(`voices/${episodeId}/${file}.wav`);
  const revealIn = s(t.reveal);
  const reactionTime = (frame - s(t.punch)) / fps;
  const grow = interpolate(frame, [revealIn, revealIn + s(0.45)], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.2, 0.9, 0.3, 1.1),
  });
  const biggest = Math.max(round.a.km2, round.b.km2);
  const bob = (offset: number) => Math.sin((frame + offset) / 9) * 5;
  const popIn = (start: number) =>
    interpolate(frame, [start, start + s(0.3)], [0, 1], {
      ...clamp,
      easing: Easing.spring({ damping: 11 }),
      output: "perceptual-scale",
    });

  const ball = (c: Country, x: number, side: number, offset: number) => {
    const size = interpolate(grow, [0, 1], [START_SIZE, WINNER_SIZE * Math.sqrt(c.km2 / biggest)]);
    const won = c.km2 === biggest;
    const shown = Math.round(interpolate(grow, [0, 1], [0, c.km2]));
    return (
      <>
        <div
          style={{
            ...labelStyle,
            position: "absolute",
            left: x - 270,
            width: 540,
            top: 300,
            textAlign: "center",
            fontSize: c.name.length > 11 ? 54 : 68,
            scale: popIn(0),
          }}
        >
          {c.name}
        </div>
        <CountryBall
          flag={c.flag}
          size={size}
          expression="half"
          previous="open"
          blend={interpolate(frame, [s(t.punch), s(t.punch) + 5], [0, 1], clamp)}
          reaction={won ? round.winnerReaction : round.loserReaction}
          reactionTime={reactionTime}
          side={side}
          eyePlacement={EMBLEM_SAFE[c.flag]}
          questionBeside
          style={{
            left: x,
            top: BALL_Y + bob(offset),
            scale: interpolate(frame, [0, s(0.3)], [1.8, 1], { ...clamp, easing: Easing.bezier(0.12, 0.8, 0.3, 1) }),
          }}
        />
        {frame >= revealIn ? (
          <div
            style={{
              ...labelStyle,
              position: "absolute",
              left: x - 270,
              width: 540,
              top: 1085,
              textAlign: "center",
              fontSize: 56,
              fontVariantNumeric: "tabular-nums",
              textTransform: "none",
              color: won && grow === 1 ? "#ffe066" : "white",
            }}
          >
            {shown.toLocaleString("en-US")} km²
          </div>
        ) : null}
      </>
    );
  };

  return (
    <AbsoluteFill>
      <Background
        color={interpolateColors(frame, [revealIn, revealIn + s(0.4)], [NEUTRAL_BG, shade(round.color, -0.3)])}
      />
      {ball(round.a, LEFT_X, -1, 20)}
      {ball(round.b, RIGHT_X, 1, 0)}

      {frame >= s(t.guess) && frame < revealIn ? (
        <>
          <div
            style={{
              ...labelStyle,
              position: "absolute",
              left: 0,
              right: 0,
              top: 1090,
              textAlign: "center",
              fontSize: 96,
              scale: popIn(s(t.guess)),
            }}
          >
            Who's bigger?
          </div>
          <Sequence from={s(t.guess)} layout="none">
            <Countdown x={540} y={BALL_Y} radius={90} seconds={t.reveal - t.guess} />
          </Sequence>
        </>
      ) : null}

      <Sequence from={s(t.punch)} layout="none">
        <Caption text={round.punchline} bottom={470} band={BAND} pill big />
      </Sequence>

      <Audio src={voice(`intro${index + 1}`)} from={s(t.intro)} />
      <Audio src={voice(`punch${index + 1}`)} from={s(t.punch)} />
    </AbsoluteFill>
  );
};
