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
import { FlagCard } from "../components/FlagCard";
import { EMBLEM_SAFE } from "../emblems";
import { labelStyle, LAYOUT_LOW_V3 as L, NEUTRAL_BG, shade } from "../theme";
import { GUESS_FROM, REVEAL, reverseTimes } from "./timing";
import type { FormatVoices, ReverseRoundData } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Reverse quiz: the kid is on screen first, then the parents are revealed.
export const ReverseRound: React.FC<{
  round: ReverseRoundData;
  index: number;
  episodeId: string;
  voices: FormatVoices;
}> = ({ round, index, episodeId, voices }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seconds: number) => Math.round(seconds * fps);
  const t = reverseTimes(voices);
  const voice = (file: string) => staticFile(`voices/${episodeId}/${file}.wav`);
  const bob = (offset: number) => Math.sin((frame + offset) / 9) * 6;
  const reactionTime = (frame - s(t.punch)) / fps;
  const momIn = s(t.mom);
  const dadIn = s(t.dad);
  const blend = interpolate(frame, [s(t.punch), s(t.punch) + 5], [0, 1], clamp);
  const popIn = (start: number) =>
    interpolate(frame, [start, start + s(0.3)], [0, 1], {
      ...clamp,
      easing: Easing.spring({ damping: 11 }),
      output: "perceptual-scale",
    });
  const whip = (end: number, from: number) =>
    interpolate(frame, [0, s(0.35)], [from, end], { ...clamp, easing: Easing.bezier(0.12, 0.8, 0.3, 1) });

  const parent = (x: number, y: number, side: number, start: number, offset: number) =>
    frame >= start ? (
      <CountryBall
        flag={round.parents}
        size={L.parentSize}
        expression="squint"
        previous="open"
        blend={blend}
        reaction={round.parentReaction}
        reactionTime={reactionTime}
        side={side}
        eyePlacement={round.parentEyes ?? EMBLEM_SAFE[round.parents]}
        questionBeside
        style={{ left: x, top: y + bob(offset), scale: popIn(start) }}
      />
    ) : null;

  return (
    <AbsoluteFill>
      <Background
        color={interpolateColors(frame, [momIn, momIn + s(0.4)], [NEUTRAL_BG, shade(round.color, -0.3)])}
      />
      {parent(L.dad.x, L.dad.y, -1, dadIn, 20)}
      {parent(L.mom.x, L.mom.y, 1, momIn, 0)}

      {/* Kid: whip-zooms in on frame 0, so there's motion in the very first frame */}
      <CountryBall
        flag={round.child}
        size={L.childSize}
        expression="half"
        previous="open"
        blend={blend}
        reaction={round.childReaction}
        reactionTime={reactionTime}
        eyePlacement={round.childEyes ?? EMBLEM_SAFE[round.child]}
        style={{
          left: L.child.x,
          top: L.child.y + bob(40),
          scale: whip(1, 3),
          rotate: `${whip(0, -14)}deg`,
          filter: `blur(${interpolate(frame, [0, s(0.35)], [8, 0], clamp)}px)`,
        }}
      />

      {/* Beside the kid, so it stays clear of the parents when they arrive */}
      <FlagCard label="Me:" flag={round.child} width={L.meCardWidth} x={880} y={1195} style={{ scale: popIn(0) }} />
      {frame >= momIn ? (
        <FlagCard label="My mom:" flag={round.parents} width={L.cardWidth} x={L.momCard.x} y={L.momCard.y} style={{ scale: popIn(momIn) }} />
      ) : null}
      {frame >= dadIn ? (
        <FlagCard label="My dad:" flag={round.parents} width={L.cardWidth} x={L.dadCard.x} y={L.dadCard.y} style={{ scale: popIn(dadIn) }} />
      ) : null}

      {frame >= s(GUESS_FROM) && frame < momIn ? (
        <>
          <div
            style={{
              ...labelStyle,
              position: "absolute",
              left: 0,
              right: 0,
              top: 430,
              textAlign: "center",
              fontSize: 96,
              scale: popIn(s(GUESS_FROM)),
            }}
          >
            Guess my parents!
          </div>
          <Sequence from={s(GUESS_FROM)} layout="none">
            <Countdown x={540} y={740} radius={110} seconds={REVEAL - GUESS_FROM} />
          </Sequence>
        </>
      ) : null}

      <Sequence from={s(t.punch)} layout="none">
        <Caption text={round.punchline} bottom={L.captionBottom} band={L.captionBand} pill big />
      </Sequence>

      <Audio src={voice("me")} from={s(t.me)} />
      <Audio src={voice("mom")} from={s(t.mom)} />
      <Audio src={voice("dad")} from={s(t.dad)} />
      <Audio src={voice(`punch${index + 1}`)} from={s(t.punch)} />
    </AbsoluteFill>
  );
};
