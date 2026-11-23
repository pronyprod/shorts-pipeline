import { Audio } from "@remotion/media";
import React, { useMemo } from "react";
import { AbsoluteFill, CalculateMetadataFunction, Freeze, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./components/Background";
import { Captions } from "./components/Captions";
import { Counter } from "./components/Counter";
import { Stage } from "./components/Stage";
import { CashStage } from "./components/CashStage";
import { CrowdStage } from "./components/CrowdStage";
import { MoonStage } from "./components/MoonStage";
import { RingStage } from "./components/RingStage";
import { RopeStage } from "./components/RopeStage";
import { TunnelStage } from "./components/TunnelStage";
import { VacuumStage } from "./components/VacuumStage";
import { WorldStage } from "./components/WorldStage";
import { EPISODES } from "./episodes";
import { MUSIC_VOLUME, templateOf } from "./theme";
import { musicGain, musicSections, planMusic } from "./music";
import { buildSchedule, Schedule } from "./timing";
import type { Episode } from "./types";
import { reelsMusic } from "../reelsMusic";
const RM = reelsMusic();

export type WhatIfProps = { episodeId: keyof typeof EPISODES; music: string };

export const calculateWhatIfMetadata: CalculateMetadataFunction<WhatIfProps> = ({ props }) => {
  const { episode, voices } = EPISODES[props.episodeId];
  return { durationInFrames: buildSchedule(episode, voices.durations, 30).durationInFrames };
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Everything you see, for the current frame
const Scene: React.FC<{ ep: Episode; schedule: Schedule }> = ({ ep, schedule }) => {
  const frame = useCurrentFrame();
  const tpl = templateOf(ep);
  const f = Math.min(frame, schedule.story.length - 1);
  const t = schedule.story[f];
  const moment = ep.counterAt?.(t);
  return (
    <AbsoluteFill>
      <Background t={t} rain={tpl.rain} />
      {ep.stage === "tunnel" ? (
        <TunnelStage ep={ep} t={t} lines={schedule.lines} />
      ) : ep.stage === "rope" ? (
        <RopeStage ep={ep} t={t} lines={schedule.lines} />
      ) : ep.stage === "crowd" ? (
        <CrowdStage ep={ep} t={t} lines={schedule.lines} />
      ) : ep.stage === "moon" ? (
        <MoonStage ep={ep} t={t} lines={schedule.lines} />
      ) : ep.stage === "vacuum" ? (
        <VacuumStage ep={ep} t={t} lines={schedule.lines} />
      ) : ep.stage === "cash" ? (
        <CashStage ep={ep} t={t} lines={schedule.lines} />
      ) : ep.stage === "rings" ? (
        <RingStage ep={ep} t={t} lines={schedule.lines} />
      ) : tpl.worldStage ? (
        <WorldStage ep={ep} t={t} camera={schedule.camera[f]} lines={schedule.lines} />
      ) : (
        <Stage ep={ep} t={t} lines={schedule.lines} rungFrames={schedule.rungFrames} />
      )}
      <Counter
        label={moment?.label ?? ep.counterLabel}
        t={t}
        endT={ep.endT}
        meters={moment?.meters ?? ep.diameterAt(t)}
        mystery={moment?.mystery}
        valueText={moment?.text}
        clockText={ep.clockText?.(t)}
        rungs={ep.rungs}
        rungFrames={schedule.rungFrames}
        mmDecimals={tpl.mmDecimals}
        clockLabel={ep.clockLabel}
      />
      <Captions
        texts={ep.lines.map((l) => l.text)}
        whole={ep.lines.map((l) => !!l.whole)}
        lines={schedule.lines}
        phrases={tpl.phraseCaptions}
      />
    </AbsoluteFill>
  );
};

export const WhatIfEpisode: React.FC<WhatIfProps> = ({ episodeId, music }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { episode: ep, voices } = EPISODES[episodeId];
  const tpl = templateOf(ep);
  const schedule = useMemo(() => buildSchedule(ep, voices.durations, fps), [ep, voices, fps]);
  const end = durationInFrames - 1;
  // template 1: fade out over the last 1.5 s. Template 2: short fade in and out so the loop seam is soft.
  const musicFade = (f: number) =>
    MUSIC_VOLUME *
    (tpl.loopFade > 0
      ? interpolate(f, [0, tpl.musicFadeIn * fps], [0, 1], clamp) * interpolate(f, [end - tpl.loopFade * fps, end], [1, 0], clamp)
      : interpolate(f, [durationInFrames - 1.5 * fps, end], [1, 0], clamp));
  // template 2: the last moments cross-fade into frame 0, so the loop point is clean
  const loopIn = tpl.loopFade > 0 ? interpolate(frame, [end - tpl.loopFade * fps, end], [0, 1], clamp) : 0;
  // template 3: rotating library track, its build on the climax, ducked under the voice
  const videoSec = durationInFrames / fps;
  const plan = useMemo(() => (tpl.libraryMusic ? planMusic(ep, schedule.lines, videoSec) : null), [tpl, ep, schedule, videoSec]);

  return (
    <AbsoluteFill>
      <Scene ep={ep} schedule={schedule} />
      {loopIn > 0 ? (
        <AbsoluteFill style={{ opacity: loopIn }}>
          <Freeze frame={0}>
            <Scene ep={ep} schedule={schedule} />
          </Freeze>
        </AbsoluteFill>
      ) : null}
      {schedule.lines.map((l, i) => (
        <Sequence key={i} from={Math.round(l.start * fps)} layout="none">
          <Audio src={staticFile(`voices/${ep.id}/line${String(i + 1).padStart(2, "0")}.wav`)} />
        </Sequence>
      ))}
      {plan?.mode === "early build" && !RM ? (
        musicSections(plan).map((sec, i) => (
          <Sequence key={i} from={Math.round(sec.videoStart * fps)} layout="none">
            <Audio
              src={staticFile(plan.track.file)}
              trimBefore={Math.round(sec.trackOffset * fps)}
              volume={(f) => {
                const t = sec.videoStart + f / fps;
                return musicGain(t, plan, schedule.lines, videoSec, tpl.musicFadeIn, tpl.loopFade) * sec.fade(t);
              }}
            />
          </Sequence>
        ))
      ) : plan ? (
        <Audio
          src={staticFile(RM?.file ?? plan.track.file)}
          trimBefore={Math.round((RM ? RM.start : plan.offset) * fps)}
          volume={(f) => musicGain(f / fps, plan, schedule.lines, videoSec, tpl.musicFadeIn, tpl.loopFade)}
        />
      ) : music ? (
        <Audio src={staticFile(RM?.file ?? music)} trimBefore={RM ? Math.round(RM.start * fps) : undefined} volume={musicFade} loop={!RM} />
      ) : null}
    </AbsoluteFill>
  );
};
