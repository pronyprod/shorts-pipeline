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
import { Round } from "./components/Round";
import { EPISODES } from "./episodes";
import { FADE_IN, FADE_OUT, TRACKS } from "./music";
import { END_COLOR, LATEST_TEMPLATE, TEMPLATES } from "./theme";
import { OUTRO, roundFrames } from "./timing";

export type FlagFamilyProps = {
  episodeId: string;
  // Older episodes only: a looping file inside public/. New episodes set `music` in their data instead.
  music: string;
  // Filled in automatically by calculateMetadata
  childColors?: string[];
};

// Most common colour of a flag, ignoring white and near-black details.
const dominantColor = async (flag: string) => {
  const img = new Image();
  img.src = staticFile(`flags/4x3/${flag}.svg`);
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 48;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 64, 48);
  const { data } = ctx.getImageData(0, 0, 64, 48);
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (Math.min(r, g, b) > 215 || Math.max(r, g, b) < 40) continue;
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }
  const best = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  if (!best) return "#555555";
  const hex = (v: number) => Math.round(v / best.n).toString(16).padStart(2, "0");
  return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`;
};

export const calculateFlagFamilyMetadata: CalculateMetadataFunction<FlagFamilyProps> = async ({
  props,
}) => {
  const { episode, voices } = EPISODES[props.episodeId];
  const fps = 30;
  // CLAUDE.md: never reuse the same reaction in consecutive rounds
  episode.rounds.forEach((r, i) => {
    const prev = episode.rounds[i - 1];
    if (!prev) return;
    for (const key of ["parentReaction", "childReaction"] as const) {
      if (r[key] && r[key] === prev[key]) {
        throw new Error(`${episode.id}: rounds ${i} and ${i + 1} both use ${key} "${r[key]}"`);
      }
    }
  });
  // CLAUDE.md: never the same music track in two consecutive episodes
  // (versions like ep002v2 count as the same episode number)
  const epNumber = (id: string) => Number(id.match(/^ep(\d+)/)?.[1] ?? NaN);
  const n = epNumber(episode.id);
  if (episode.music && !Number.isNaN(n)) {
    for (const other of Object.values(EPISODES)) {
      if (epNumber(other.episode.id) === n - 1 && other.episode.music === episode.music) {
        throw new Error(
          `${episode.id} uses music "${episode.music}", same as ${other.episode.id}. Pick another track (see ROTATION in music.ts).`,
        );
      }
    }
  }
  const childColors = await Promise.all(
    episode.rounds.map((r) => r.childColor ?? dominantColor(r.child)),
  );
  const total =
    episode.rounds.reduce((sum, _, i) => sum + roundFrames(voices, i, fps), 0) +
    Math.round(OUTRO * fps);
  return { durationInFrames: total, props: { ...props, childColors } };
};

export const FlagFamilyEpisode: React.FC<FlagFamilyProps> = ({
  episodeId,
  music,
  childColors = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { episode, voices } = EPISODES[episodeId];
  const template = TEMPLATES[episode.template ?? LATEST_TEMPLATE];
  const track = episode.music ? TRACKS[episode.music] : null;

  let start = 0;
  const rounds = episode.rounds.map((round, i) => {
    const length = roundFrames(voices, i, fps);
    const from = start;
    start += length;
    return (
      <Sequence key={i} from={from} durationInFrames={length} name={`Round ${i + 1}`}>
        <Round
          round={round}
          index={i}
          episodeId={episodeId}
          voices={voices}
          childColor={childColors[i] ?? "#555555"}
          layout={template.layouts[episode.layout ?? "classic"]}
          template={template}
        />
      </Sequence>
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: END_COLOR }}>
      {rounds}
      {/* fade to near-black at the end so the video loops */}
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
      {track ? (
        // episode's own track: starts at its lively point, fades in, fades out on the last frame
        <Audio
          src={staticFile(`music/norm/${track.file}`)}
          trimBefore={Math.round(track.start * fps)}
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
      ) : music ? (
        // older episodes: a looping file given as a prop
        <Audio src={staticFile(music)} volume={template.musicVolume} loop />
      ) : null}
    </AbsoluteFill>
  );
};
