import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  type CalculateMetadataFunction,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FADE_IN, FADE_OUT, TRACKS } from "../music";
import { END_COLOR, LATEST_TEMPLATE, TEMPLATES } from "../theme";
import { OUTRO } from "../timing";
import { FORMAT_EPISODES } from "./index";
import { ReverseRound } from "./ReverseRound";
import { SizeRound } from "./SizeRound";
import { formatRoundFrames } from "./timing";
import { WordsRound } from "./WordsRound";
import { reelsMusic } from "../../reelsMusic";
const RM = reelsMusic();

export type FormatEpisodeProps = { episodeId: string };

export const calculateFormatMetadata: CalculateMetadataFunction<FormatEpisodeProps> = ({ props }) => {
  const { episode, voices } = FORMAT_EPISODES[props.episodeId];
  const fps = 30;
  const rounds = episode.rounds.reduce((sum, r, i) => sum + formatRoundFrames(r, voices, i, fps), 0);
  return { durationInFrames: rounds + Math.round(OUTRO * fps) };
};

// Same ending, music and mix as FlagFamilyEpisode; only the rounds differ.
export const FormatEpisode: React.FC<FormatEpisodeProps> = ({ episodeId }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { episode, voices } = FORMAT_EPISODES[episodeId];
  const template = TEMPLATES[LATEST_TEMPLATE];
  const track = TRACKS[episode.music];

  let start = 0;
  const rounds = episode.rounds.map((round, i) => {
    const length = formatRoundFrames(round, voices, i, fps);
    const from = start;
    start += length;
    const shared = { index: i, episodeId, voices };
    return (
      <Sequence key={i} from={from} durationInFrames={length} name={`Round ${i + 1}`}>
        {round.format === "reverse" ? (
          <ReverseRound round={round} {...shared} />
        ) : round.format === "size" ? (
          <SizeRound round={round} {...shared} />
        ) : (
          <WordsRound round={round} {...shared} />
        )}
      </Sequence>
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: END_COLOR }}>
      {rounds}
      <AbsoluteFill
        style={{
          backgroundColor: END_COLOR,
          opacity: interpolate(
            frame,
            [durationInFrames - Math.round((OUTRO + 0.45) * fps), durationInFrames - Math.round(OUTRO * fps)],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        }}
      />
      <Audio
        src={staticFile(RM?.file ?? `music/norm/${track.file}`)}
        trimBefore={Math.round((RM ? RM.start : track.start) * fps)}
        volume={(f) =>
          template.musicVolume *
          interpolate(
            f,
            [0, FADE_IN * fps, durationInFrames - FADE_OUT * fps, durationInFrames - 1],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
    </AbsoluteFill>
  );
};
