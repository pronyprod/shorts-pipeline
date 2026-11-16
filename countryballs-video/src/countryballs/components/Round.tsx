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
import { EMBLEM_SAFE, type EyePlacement } from "../emblems";
import { labelStyle, LAYOUT, type Layout, NEUTRAL_BG, shade, TEMPLATES, type TemplateSettings } from "../theme";
import { BEATS, voiceTimes } from "../timing";
import type { RoundData, VoiceManifest } from "../types";
import { Background } from "./Background";
import { Caption } from "./Caption";
import { Countdown } from "./Countdown";
import { CountryBall } from "./CountryBall";
import { FlagCard } from "./FlagCard";
import { LightRays } from "./LightRays";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Round: React.FC<{
  round: RoundData;
  index: number;
  episodeId: string;
  voices: VoiceManifest;
  childColor: string;
  layout?: Layout;
  template?: TemplateSettings;
}> = ({ round, index, episodeId, voices, childColor, layout, template = TEMPLATES[1] }) => {
  const L: Layout = layout ?? LAYOUT;
  const eyesFor = (flag: string, override?: EyePlacement) =>
    template.emblemSafeEyes ? (override ?? EMBLEM_SAFE[flag]) : undefined;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = voiceTimes(voices, index);
  const s = (seconds: number) => Math.round(seconds * fps);
  const voice = (file: string) => staticFile(`voices/${episodeId}/${file}.wav`);

  const momIn = s(BEATS.mom);
  const dadIn = s(BEATS.dad);
  const guessIn = s(BEATS.guess);
  const childIn = s(BEATS.child);
  const punchIn = s(BEATS.punch);

  // gentle idle bob so nothing is ever completely still
  const bob = (offset: number) => Math.sin((frame + offset) / 9) * 6;

  // expressions change at the punchline beat
  const reactBlend = interpolate(frame, [punchIn, punchIn + 5], [0, 1], clamp);
  // rounds with reaction data react the moment the child starts the punchline
  const reactionTime = (frame - s(t.punch)) / fps;
  const parentReaction = (side: number) =>
    round.parentReaction ? { reaction: round.parentReaction, reactionTime, side } : {};
  const rays =
    round.parentReaction === "squint" && reactionTime >= 0 ? (
      <LightRays
        x={L.child.x}
        y={L.child.y}
        progress={interpolate(reactionTime, [0, 0.2], [0, 1], clamp)}
        spin={reactionTime * 25}
      />
    ) : null;

  const popIn = (start: number) =>
    interpolate(frame, [start, start + s(0.3)], [0, 1], {
      ...clamp,
      easing: Easing.spring({ damping: 11 }),
      output: "perceptual-scale",
    });

  return (
    <AbsoluteFill>
      <Background
        color={interpolateColors(
          frame,
          [childIn, childIn + s(0.4)],
          [NEUTRAL_BG, shade(childColor, -0.3)],
        )}
      />

      {/* Parents blinded by a bright child: template 3+ draws the rays on the background only */}
      {template.raysBehindBalls ? rays : null}

      {/* Dad: slides in from the left */}
      {frame >= dadIn ? (
        <CountryBall
          flag={round.parents}
          size={L.parentSize}
          expression="squint"
          previous="open"
          blend={reactBlend}
          {...parentReaction(-1)}
          eyePlacement={eyesFor(round.parents, round.parentEyes)}
          questionBeside={template.questionBeside}
          style={{
            left: interpolate(frame, [dadIn, dadIn + s(0.4)], [-L.parentSize, L.dad.x], {
              ...clamp,
              easing: Easing.spring({ damping: 14 }),
            }),
            top: L.dad.y + bob(20),
          }}
        />
      ) : null}

      {/* Mom: whip-zooms in at frame 0 */}
      <CountryBall
        flag={round.parents}
        size={L.parentSize}
        expression="squint"
        previous="open"
        blend={reactBlend}
        {...parentReaction(1)}
        eyePlacement={eyesFor(round.parents, round.parentEyes)}
        questionBeside={template.questionBeside}
        style={{
          left: L.mom.x,
          top: L.mom.y + bob(0),
          scale: interpolate(frame, [momIn, momIn + s(0.35)], [3, 1], {
            ...clamp,
            easing: Easing.bezier(0.12, 0.8, 0.3, 1),
          }),
          rotate: `${interpolate(frame, [momIn, momIn + s(0.35)], [-14, 0], {
            ...clamp,
            easing: Easing.bezier(0.12, 0.8, 0.3, 1),
          })}deg`,
          filter: `blur(${interpolate(frame, [momIn, momIn + s(0.35)], [8, 0], clamp)}px)`,
        }}
      />

      {/* Parents blinded by a bright child (templates 1-2: rays over the parents) */}
      {template.raysBehindBalls ? null : rays}

      {/* Child: pops up front-centre */}
      {frame >= childIn ? (
        <CountryBall
          flag={round.child}
          size={L.childSize}
          expression="half"
          previous="open"
          blend={reactBlend}
          {...(round.childReaction ? { reaction: round.childReaction, reactionTime, side: 0 } : {})}
          eyePlacement={eyesFor(round.child, round.childEyes)}
          style={{
            left: L.child.x,
            top:
              L.child.y +
              bob(40) +
              interpolate(frame, [childIn, childIn + s(0.45)], [260, 0], {
                ...clamp,
                easing: Easing.spring({ damping: 10 }),
              }),
            scale: popIn(childIn),
          }}
        />
      ) : null}

      {/* Flag cards */}
      <FlagCard
        label="My mom:"
        flag={round.parents}
        width={L.cardWidth}
        x={L.momCard.x}
        y={L.momCard.y}
        style={{ scale: popIn(momIn) }}
      />
      {frame >= dadIn ? (
        <FlagCard
          label="My dad:"
          flag={round.parents}
          width={L.cardWidth}
          x={L.dadCard.x}
          y={L.dadCard.y}
          style={{ scale: popIn(dadIn) }}
        />
      ) : null}
      {frame >= childIn ? (
        <FlagCard
          label="Me:"
          flag={round.child}
          width={L.meCardWidth}
          x={L.meCard.x}
          y={L.meCard.y}
          style={{ scale: popIn(childIn) }}
        />
      ) : null}

      {/* Guess phase */}
      {frame >= guessIn && frame < childIn ? (
        <>
          <div
            style={{
              ...labelStyle,
              position: "absolute",
              left: 0,
              right: 0,
              top: L.meCard.y + 40,
              textAlign: "center",
              fontSize: 110,
              scale: popIn(guessIn),
            }}
          >
            Guess!
          </div>
          <Sequence from={guessIn} layout="none">
            <Countdown x={L.child.x} y={L.child.y} radius={110} seconds={BEATS.child - BEATS.countdown} />
          </Sequence>
        </>
      ) : null}

      {/* Punchline caption, shown while the line is spoken */}
      <Sequence from={s(t.punch)} layout="none">
        <Caption text={round.punchline} bottom={L.captionBottom} band={L.captionBand} pill={template.captionPill} big={template.bigCaptions} />
      </Sequence>

      {/* Voices */}
      <Audio src={voice("mom")} from={s(t.mom)} />
      <Audio src={voice("dad")} from={s(t.dad)} />
      <Audio src={voice("me")} from={s(t.me)} />
      <Audio src={voice(`punch${index + 1}`)} from={s(t.punch)} />
    </AbsoluteFill>
  );
};
