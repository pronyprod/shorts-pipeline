// KIT runner: plays a What If episode in style B (blocky 3D, a cut per beat) or style D
// (paper cut-out Pom, ONE continuous camera through the places). It reuses the channel's
// script, voice timing (buildSchedule), captions and music plan, so only the visuals are new.
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { musicGain, musicSections, planMusic } from "../whatif/music";
import { fontFamily, templateOf } from "../whatif/theme";
import { buildSchedule, type Schedule } from "../whatif/timing";
import type { Episode } from "../whatif/types";
import { FOV, moveOf, shotFor, type MoveKind, type Pose as CamPose, type ShotKind } from "./camera";
import { envAt, LookContext, Lights, Sky, smoothAt, type EnvName, type EnvState, type Look, type PathKey, type V3 } from "./core";
import { captionMoments, LiveCaptions, LOOKS, planCaptions } from "./liveCaptions";
import { PalettePass, PixelHud, PIXEL_SCALE, PIXEL_TEXT, TextCards } from "./pixel";
import { AMBIENCE, autoCues, SfxLayer, type AmbName, type Cue, type SfxCue } from "./sfx";
import { KitCounter, Tags, type Tag } from "./hud";
import { ANCHORS, originOf, Place, PLACE_IDS, type PlaceId, type PlaceOpts } from "./places";
import { PomBlock } from "./PomBlock";
import { PomPaper } from "./PomPaper";
import { CounterBoard, Falling, type CounterValue } from "./props";
import type { Expression, Outfit, Pose } from "./types";
import { reelsMusic } from "../reelsMusic";
const RM = reelsMusic();

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// music alone (no narrator): measured 11 Nov on Ep009's track, about -15 LUFS with the peak just under -1 dBFS.
// Music alone peaks higher than a voice mix, so a voiceless episode must pass the loudness check like any other.
const SOLO_MUSIC = 1.42;

// ---------- what an episode file describes ----------
export type PomBeat = { expr: Expression; pose?: Pose; at?: V3; to?: V3; scale?: number; float?: boolean; outfit?: Outfit; hide?: boolean };
export type Beat = {
  line: number; // index of the narration line this beat starts on (0-based)
  place: PlaceId;
  shot: ShotKind;
  move?: MoveKind; // D: how the camera moves during the beat (default "push"); B: always a slow push
  nudge?: Partial<CamPose>; // small shot correction
  env?: EnvName; // the light from this beat on (default: keeps the previous)
  pom?: PomBeat;
  board?: boolean; // show the counter board in this place (D: default true; B: default false, B uses the screen counter)
  falling?: number; // amount of falling cash 0-1 (default 0)
  sfx?: SfxCue[]; // extra sound effects in this beat ("impact", { name: "pop", at: 1.2 })
  ambience?: AmbName | "none"; // the background sound from this beat on (default: the place's own)
  trail?: string[]; // pixel look: the location trail shown from this beat on, e.g. ["You", "Your lungs"]
};
export type Ctx = { sec: number; t: number; frame: number; beat: number; p: number; env: EnvState; font: string; style: "B" | "D" };
export type KitEp = {
  id: string;
  style: "B" | "D"; // camera: B = a cut per beat, D = one continuous camera
  look?: Look; // shaded (B, D; default), flat (style A: B camera + flat), pixel (style P: D camera + pixel)
  voice?: boolean; // false = no narrator: text cards + music only (the old style C option)
  sfx?: boolean; // false = no sound effects (default: automatic cues + place ambience + each beat's `sfx`)
  untilLine?: number; // end after this line (index): for short test clips
  keys?: Record<number, string[]>; // caption key phrases per line index (else the episode line's own `keys`)
  mute?: "voice" | "bed"; // level checks only: render without the voice, or without music + effects
  base: { episode: Episode; voices: { durations: number[] } };
  beats: Beat[];
  counter?: (t: number) => CounterValue; // default: the base episode's counter + the latest rung as the "≈" line
  opts?: (c: Ctx) => Partial<Record<PlaceId, PlaceOpts>>;
  extras?: (c: Ctx) => React.ReactNode; // episode-only 3D bits
  tags?: (c: Ctx) => Tag[];
  moon?: (c: Ctx) => number | undefined; // sky moon opacity override
  pomScale?: (c: Ctx) => number; // per-frame size change for Pom (default: the beat's scale)
  dim?: (c: Ctx) => number; // fade the picture towards black (0-1), e.g. "everything goes black"
};

const fmtM = (m: number) => (m >= 1000 ? { value: (m / 1000).toLocaleString("en-US", { maximumFractionDigits: 0 }), unit: "km" } : { value: m.toLocaleString("en-US", { maximumFractionDigits: 1 }), unit: "m" });
export const defaultCounter = (ep: Episode) => (t: number): CounterValue => {
  const m = ep.counterAt?.(t);
  const text = m?.mystery ? { value: "???", unit: "" } : m?.text ?? fmtM(m?.meters ?? ep.diameterAt(t));
  const rung = [...ep.rungs].reverse().find((r) => t >= r.t);
  return { label: m?.label ?? ep.counterLabel, value: text.value, unit: text.unit, compare: rung?.label };
};

// ---------- timing helpers ----------
export const scheduleOf = (k: KitEp, fps: number): Schedule => {
  const s = buildSchedule(k.base.episode, k.base.voices.durations, fps);
  if (k.untilLine === undefined) return s;
  const durationInFrames = Math.ceil((s.lines[k.untilLine].end + 0.6) * fps);
  return { ...s, lines: s.lines.slice(0, k.untilLine + 1), story: s.story.slice(0, durationInFrames), durationInFrames };
};
const envFor = (k: KitEp, T: { beats: { start: number }[] }, sec: number) => {
  const keys: [number, EnvName][] = [];
  k.beats.forEach((bb, j) => {
    if (bb.env || j === 0) keys.push([T.beats[j].start, bb.env ?? "day"]);
  });
  return envAt(sec, keys, k.style === "D" ? 1.6 : 0);
};
type Timed = { beats: { start: number; end: number }[]; durationInFrames: number };
const beatTimes = (k: KitEp, s: Schedule, fps: number): Timed => {
  const LEAD = 0.2;
  const end = s.durationInFrames / fps;
  return {
    beats: k.beats
      .filter((b) => b.line < s.lines.length)
      .map((b, i, all) => ({ start: i === 0 ? 0 : s.lines[b.line].start - LEAD, end: i < all.length - 1 ? s.lines[all[i + 1].line].start - LEAD : end })),
    durationInFrames: s.durationInFrames,
  };
};
const beatAt = (sec: number, T: Timed) => {
  let i = 0;
  T.beats.forEach((b, k) => {
    if (sec >= b.start) i = k;
  });
  return i;
};

// ---------- camera ----------
const camKeysD = (k: KitEp, T: Timed): { pos: PathKey[]; look: PathKey[] } => {
  const pos: PathKey[] = [];
  const look: PathKey[] = [];
  k.beats.forEach((b, i) => {
    if (!T.beats[i]) return;
    const { start, end } = T.beats[i];
    const [a, z] = moveOf(shotFor(b.place, b.shot, b.pom?.at, b.nudge), b.move ?? "push");
    const prev = k.beats[i - 1];
    // changing place: lift the camera on the way so the flight passes over the land, not through it
    if (prev && prev.place !== b.place && b.place !== "space" && prev.place !== "space") {
      const p0 = pos[pos.length - 1][1];
      pos.push([start - 0.05, [(p0[0] + a.pos[0]) / 2, Math.max(p0[1], a.pos[1]) + 9, (p0[2] + a.pos[2]) / 2 + 6]]);
      const l0 = look[look.length - 1][1];
      look.push([start - 0.05, [(l0[0] + a.look[0]) / 2, 1, (l0[2] + a.look[2]) / 2]]);
    }
    pos.push([start + 0.3, a.pos], [Math.max(start + 0.35, end - 0.3), z.pos]);
    look.push([start + 0.3, a.look], [Math.max(start + 0.35, end - 0.3), z.look]);
  });
  return { pos, look };
};
const camAt = (k: KitEp, T: Timed, sec: number, keysD: { pos: PathKey[]; look: PathKey[] } | null): CamPose => {
  const i = beatAt(sec, T);
  const b = k.beats[i];
  if (k.style === "D" && keysD) return { pos: smoothAt(keysD.pos, sec, 0.6), look: smoothAt(keysD.look, sec, 0.6) };
  // B: a cut per beat, then a slow push
  const { start, end } = T.beats[i];
  const [a, z] = moveOf(shotFor(b.place, b.shot, b.pom?.at, b.nudge), b.move === "pull" ? "pull" : "hold");
  const u = interpolate(sec, [start, end], [0, 1], clamp);
  const e = u * u * (3 - 2 * u);
  return { pos: a.pos.map((v, j) => v + (z.pos[j] - v) * e) as V3, look: a.look.map((v, j) => v + (z.look[j] - v) * e) as V3 };
};
const Rig: React.FC<{ pose: CamPose }> = ({ pose }) => {
  const { camera, size } = useThree();
  const ortho = (camera as THREE.OrthographicCamera).isOrthographicCamera;
  // flat look: a level side view (no tilt), so the ground is a strip at the bottom and the sky shows above it
  camera.position.set(pose.pos[0], ortho ? pose.look[1] : pose.pos[1], pose.pos[2]);
  camera.lookAt(new THREE.Vector3(...pose.look));
  if (ortho) {
    // flat look: frame the same as the perspective shot would at the focus distance
    const d = Math.hypot(pose.pos[0] - pose.look[0], pose.pos[1] - pose.look[1], pose.pos[2] - pose.look[2]);
    camera.zoom = size.height / (2 * d * Math.tan((FOV * Math.PI) / 360));
    camera.near = -200;
    camera.far = 400;
    camera.updateProjectionMatrix();
  }
  return null;
};

// ---------- Pom for the current beat ----------
const pomPosAt = (k: KitEp, T: Timed, sec: number): { pos: V3; running: boolean; place: PlaceId } => {
  const i = beatAt(sec, T);
  const b = k.beats[i];
  const o = originOf(b.place);
  const from = b.pom?.at ?? ANCHORS[b.place].pom;
  const at: V3 = [o[0] + from[0], o[1] + from[1], o[2] + from[2]];
  if (!b.pom?.to) return { pos: at, running: false, place: b.place };
  const to: V3 = [o[0] + b.pom.to[0], o[1] + b.pom.to[1], o[2] + b.pom.to[2]];
  const { start, end } = T.beats[i];
  const u = interpolate(sec, [start + 0.2, end - 0.2], [0, 1], clamp);
  return { pos: at.map((v, j) => v + (to[j] - v) * u) as V3, running: u > 0 && u < 1, place: b.place };
};

const World: React.FC<{ k: KitEp; T: Timed; schedule: Schedule; frame: number; fps: number; keysD: { pos: PathKey[]; look: PathKey[] } | null }> = ({ k, T, schedule, frame, fps, keysD }) => {
  const sec = frame / fps;
  const t = schedule.story[Math.min(frame, schedule.story.length - 1)];
  const i = beatAt(sec, T);
  const b = k.beats[i];
  const { start, end } = T.beats[i];
  const p = interpolate(sec, [start, end], [0, 1], clamp);
  // light: each beat may switch the preset; D blends, B switches on the cut
  const env = envFor(k, T, sec);
  const look: Look = k.look ?? "shaded";
  const ctx: Ctx = { sec, t, frame, beat: i, p, env, font: fontFamily, style: k.style };
  const pose = camAt(k, T, sec, keysD);
  const opts = k.opts?.(ctx) ?? {};
  const counter = (k.counter ?? defaultCounter(k.base.episode))(t);
  const pom = pomPosAt(k, T, sec);
  const pb = b.pom;
  // only build the places near the camera (and the current one)
  const near = PLACE_IDS.filter((id) => id === b.place || Math.abs(originOf(id)[0] - pose.pos[0]) < 70);
  const focus: V3 = [originOf(b.place)[0] + ANCHORS[b.place].focus[0], 0, ANCHORS[b.place].focus[2]];
  const yaw = Math.atan2(pose.pos[0] - pom.pos[0], pose.pos[2] - pom.pos[2]) * 0.85;
  const runYaw = pb?.to ? (pb.to[0] > (pb.at ?? ANCHORS[b.place].pom)[0] ? Math.PI : 0) : 0;
  const flip = k.style === "D" && pom.running ? runYaw : 0;
  const paper = look === "flat" || (look === "shaded" && k.style === "D");
  return (
    <LookContext.Provider value={look}>
      <Rig pose={pose} />
      {look === "flat" ? null : <fog attach="fog" args={[env.horizon, env.fogNear, env.fogFar]} />}
      <Sky env={env} frame={frame} center={pose.pos} moon={k.moon?.(ctx)} />
      <Lights env={env} focus={focus} cam={pose.pos} />
      {near.map((id) => (
        <Place key={id} id={id} env={env} frame={frame} opts={opts[id]} />
      ))}
      {near.map((id) =>
        k.beats.some((bb) => bb.place === id && id !== "space" && (k.style === "D" ? bb.board !== false : bb.board === true)) ? (
          <CounterBoard key={`b${id}`} v={counter} font={fontFamily} p={[originOf(id)[0] + ANCHORS[id].board.p[0], ANCHORS[id].board.p[1], ANCHORS[id].board.p[2]]} yaw={ANCHORS[id].board.yaw} top={ANCHORS[id].board.top} post={ANCHORS[id].board.post !== false} lamp={env.lamps} />
        ) : null,
      )}
      {(b.falling ?? 0) > 0 ? <Falling frame={frame} amount={b.falling ?? 0} origin={originOf(b.place)} /> : null}
      {k.extras?.(ctx)}
      {pb && !pb.hide ? (
        paper ? (
          <PomPaper position={pom.pos} yaw={yaw + flip} expression={pb.expr} pose={pom.running ? "run" : pb.pose} frame={frame} scale={k.pomScale?.(ctx) ?? pb.scale} outfit={pb.outfit} float={pb.float} />
        ) : (
          <PomBlock position={pom.pos} rotY={pom.running ? (runYaw ? Math.PI / 2 : -Math.PI / 2) : yaw * 0.6} expression={pb.expr} pose={pom.running ? "run" : pb.pose} frame={frame} scale={k.pomScale?.(ctx) ?? pb.scale} outfit={pb.outfit} float={pb.float} />
        )
      ) : null}
    </LookContext.Provider>
  );
};

// Is a counter board readable on screen? Then D hides the screen counter.
const boardOnScreen = (k: KitEp, T: Timed, sec: number, keysD: { pos: PathKey[]; look: PathKey[] } | null) => {
  const b = k.beats[beatAt(sec, T)];
  if (b.board === false || b.place === "space") return false;
  const pose = camAt(k, T, sec, keysD);
  const A = ANCHORS[b.place].board;
  const top = A.top ?? 2.9;
  const o = originOf(b.place);
  const c: V3 = [o[0] + A.p[0], A.p[1] + top - 0.75, A.p[2]];
  const cam = new THREE.PerspectiveCamera(FOV, 1080 / 1920, 0.1, 400);
  cam.position.set(...pose.pos);
  cam.lookAt(new THREE.Vector3(...pose.look));
  cam.updateMatrixWorld();
  const v = new THREE.Vector3(...c).project(cam);
  const t2 = new THREE.Vector3(c[0], c[1] + 0.86, c[2]).project(cam);
  const b2 = new THREE.Vector3(c[0], c[1] - 0.86, c[2]).project(cam);
  const x = ((v.x + 1) / 2) * 1080;
  const y = ((1 - v.y) / 2) * 1920;
  const hPx = ((t2.y - b2.y) / 2) * 1920;
  return v.z < 1 && x > 160 && x < 920 && y > 280 && y < 1260 && hPx > 190;
};

export const KitEpisodeView: React.FC<{ k: KitEp }> = ({ k }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const ep = k.base.episode;
  const tpl = templateOf(ep);
  const schedule = useMemo(() => scheduleOf(k, fps), [k, fps]);
  const look: Look = k.look ?? "shaded";
  const voice = k.voice !== false;
  const T = useMemo(() => beatTimes(k, schedule, fps), [k, schedule, fps]);
  const keysD = useMemo(() => (k.style === "D" ? camKeysD(k, T) : null), [k, T]);
  const sec = frame / fps;
  const t = schedule.story[Math.min(frame, schedule.story.length - 1)];
  const i = beatAt(sec, T);
  const counter = (k.counter ?? defaultCounter(ep))(t);
  const bumpFrame = Math.round(T.beats[i].start * fps);
  const local = frame - bumpFrame;
  // B: every cut gets a quick settle and a soft flash; D: only place changes in or out of space flash
  const placeJump = i > 0 && k.beats[i - 1].place !== k.beats[i].place && (k.beats[i].place === "space" || k.beats[i - 1].place === "space");
  const flash = i > 0 && (k.style === "B" || placeJump) ? interpolate(local, [0, 7], [k.style === "B" ? 0.45 : 0.9, 0], clamp) : 0;
  const settle = i > 0 && k.style === "B" ? interpolate(local, [0, 8], [1.07, 1], clamp) : 1;
  let hide = 1;
  if (k.style === "D") {
    hide = 0;
    for (let q = 0; q < 8; q++) hide += boardOnScreen(k, T, Math.max(0, sec - q / fps), keysD) ? 0 : 1 / 8;
  }
  const pose = camAt(k, T, sec, keysD);
  const env = envFor(k, T, sec);
  const tags = k.tags?.({ sec, t, frame, beat: i, p: interpolate(sec, [T.beats[i].start, T.beats[i].end], [0, 1], clamp), env, font: fontFamily, style: k.style }) ?? [];
  const videoSec = durationInFrames / fps;
  // the music plan always uses the full episode (a short test clip may stop before the climax line)
  // captions: key phrases come from the script (by meaning), never from word rules
  const capPlan = useMemo(
    () => planCaptions(ep.lines.map((l) => l.text), schedule.lines, ep.lines.map((l) => l.beat), ep.lines.map((l, j) => k.keys?.[j] ?? l.keys ?? [])),
    [ep, schedule, k],
  );
  const moments = useMemo(() => captionMoments(capPlan), [capPlan]);
  // a small camera punch-in when the hook slams in and when a big key phrase lands
  const punchAt = (f: number) => {
    let v = 0;
    for (const s0 of moments.slams) v = Math.max(v, interpolate(f - s0 * fps, [0, 3, 14], [0, 0.06, 0], clamp));
    for (const l of moments.lands) if (l.big) v = Math.max(v, interpolate(f - l.at * fps, [0, 4, 14], [0, 0.045, 0], clamp));
    return v;
  };
  // sounds for on-screen actions
  const actions = useMemo(() => {
    const a: Cue[] = [];
    const counterFn = k.counter ?? defaultCounter(ep);
    // the counter: a tick when its number changes, faster as it races (every 9 frames down to every 3)
    const changes: number[] = [];
    let last = "";
    let lastTick = -99;
    for (let f = 0; f < durationInFrames; f++) {
      const v = counterFn(schedule.story[Math.min(f, schedule.story.length - 1)]).value;
      if (v !== last) {
        changes.push(f);
        const recent = changes.filter((c) => f - c < 30).length;
        const gap = Math.max(3, 9 - Math.floor(recent / 2));
        if (f > 0 && f - lastTick >= gap) {
          a.push({ frame: f, name: "tick", vol: 0.55 });
          lastTick = f;
        }
        last = v;
      }
    }
    // Pom reacts: gasp (shocked/amazed), gulp (scared), boing (relieved, or arms up)
    k.beats.forEach((b, j) => {
      if (!T.beats[j] || !b.pom) return;
      const prevPom = k.beats[j - 1]?.pom;
      const at = Math.round((T.beats[j].start + 0.25) * fps);
      if (prevPom?.expr !== b.pom.expr) {
        const name = b.pom.expr === "scared" ? "gulp" : b.pom.expr === "relieved" ? "boing" : b.pom.expr === "neutral" ? null : "gasp";
        if (name) a.push({ frame: at, name, vol: 1 });
      } else if (b.pom.pose === "armsUp" && prevPom?.pose !== "armsUp") a.push({ frame: at, name: "boing", vol: 0.8 });
      // cash / paper starts falling
      if ((b.falling ?? 0) > (k.beats[j - 1]?.falling ?? 0) + 0.2) a.push({ frame: Math.round((T.beats[j].start + 0.4) * fps), name: "rustle", vol: 1 });
    });
    // things breaking and landing (a place's `collapse` knob): crack when it starts, thud when it lands
    if (k.opts) {
      let was = 0;
      for (let f = 0; f < durationInFrames; f += 2) {
        const sec = f / fps;
        const bi = beatAt(sec, T);
        const o = k.opts({ sec, t: schedule.story[Math.min(f, schedule.story.length - 1)], frame: f, beat: bi, p: interpolate(sec, [T.beats[bi].start, T.beats[bi].end], [0, 1], clamp), env: envFor(k, T, sec), font: fontFamily, style: k.style });
        const c = Math.max(0, ...Object.values(o).map((x) => x?.collapse ?? 0));
        if (was < 0.05 && c >= 0.05) a.push({ frame: f, name: "crack", vol: 1 });
        if (was < 0.95 && c >= 0.95) a.push({ frame: f, name: "thud", vol: 1 });
        was = c;
      }
    }
    // the hook slams in with an impact; key phrases land with a hit (soft for normal lines)
    for (const s0 of moments.slams) a.push({ frame: Math.round(s0 * fps), name: "impact", vol: 0.8 });
    for (const l of moments.lands) a.push({ frame: Math.round(l.at * fps), name: "hit", vol: l.big ? 1 : 0.6 });
    return a;
  }, [k, ep, schedule, T, fps, durationInFrames, moments]);
  const sfxCues = useMemo(
    () => autoCues({ ep, story: schedule.story, lines: schedule.lines, beatStarts: T.beats.map((b) => b.start), beatCues: k.beats.map((b) => b.sfx ?? []), beatPlaces: k.beats.map((b) => b.place), fps, style: k.style, frames: durationInFrames, actions }),
    [ep, schedule, T, k, fps, durationInFrames, actions],
  );
  // music a bit louder (owner, 12 Nov evening): 4 dB less ducking under the voice, 2 dB more between lines (kit only;
  // the voice still sits 8+ dB above music + effects, measured)
  const talkAt = (sec: number) => {
    let v = 0;
    for (const l of schedule.lines) v = Math.max(v, Math.min(Math.min(1, Math.max(0, (sec - (l.start - 0.15)) / 0.15)), Math.min(1, Math.max(0, (l.end + 0.4 - sec) / 0.4))));
    return v;
  };
  const lift = (sec: number) => 10 ** ((4 * talkAt(sec) + 2 * (1 - talkAt(sec))) / 20);
  const plan = useMemo(() => planMusic(ep, buildSchedule(ep, k.base.voices.durations, fps).lines, videoSec), [ep, k, fps, videoSec]);

  return (
    <AbsoluteFill style={{ background: "#0C1534" }}>
      {look === "flat" ? <AbsoluteFill style={{ background: `linear-gradient(180deg, ${env.skyTop} 0%, ${env.skyMid} 55%, ${env.horizon} 100%)` }} /> : null}
      <AbsoluteFill style={{ transform: `scale(${settle * (1 + punchAt(frame))})` }}>
        {look === "pixel" ? (
          // a quarter-size render, scaled up with hard pixel edges
          <div style={{ position: "absolute", left: 0, top: 0, width: width / PIXEL_SCALE, height: height / PIXEL_SCALE, transform: `scale(${PIXEL_SCALE})`, transformOrigin: "0 0", imageRendering: "pixelated" }}>
            <ThreeCanvas width={width / PIXEL_SCALE} height={height / PIXEL_SCALE} gl={{ antialias: false }} camera={{ fov: FOV, position: [0, 2, 10], near: 0.1, far: 400 }}>
              <World k={k} T={T} schedule={schedule} frame={frame} fps={fps} keysD={keysD} />
              <PalettePass />
            </ThreeCanvas>
          </div>
        ) : look === "flat" ? (
          <ThreeCanvas width={width} height={height} orthographic gl={{ alpha: true }} camera={{ position: [0, 2, 10], zoom: 100 }}>
            <World k={k} T={T} schedule={schedule} frame={frame} fps={fps} keysD={keysD} />
          </ThreeCanvas>
        ) : (
          <ThreeCanvas width={width} height={height} shadows="soft" camera={{ fov: FOV, position: [0, 2, 10], near: 0.1, far: 400 }}>
            <World k={k} T={T} schedule={schedule} frame={frame} fps={fps} keysD={keysD} />
          </ThreeCanvas>
        )}
        <Tags tags={tags} pose={pose} font={fontFamily} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />
      {k.dim ? <AbsoluteFill style={{ background: "#000000", opacity: k.dim({ sec, t, frame, beat: i, p: interpolate(sec, [T.beats[i].start, T.beats[i].end], [0, 1], clamp), env, font: fontFamily, style: k.style }) }} /> : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, transparent 58%, rgba(10,8,30,0.36) 100%)" }} />
      {look === "pixel" ? (
        <PixelHud v={counter} trail={[...k.beats.slice(0, i + 1)].reverse().find((b) => b.trail)?.trail} bumpFrame={bumpFrame} />
      ) : hide > 0.01 ? (
        <AbsoluteFill style={{ opacity: hide }}>
          <KitCounter v={counter} chip={ep.clockText?.(t)} step={i} steps={T.beats.length} font={fontFamily} bumpFrame={bumpFrame} />
        </AbsoluteFill>
      ) : null}
      {!voice ? (
        <TextCards texts={ep.lines.map((l) => l.text)} lines={schedule.lines} font={fontFamily} />
      ) : (
        // lively captions (12 Nov): word pop-in, key word bigger in an accent colour, counting numbers, shakes, bounces
        <LiveCaptions plan={capPlan} lines={schedule.lines} look={look === "pixel" ? { ...LOOKS.pixel, font: PIXEL_TEXT } : { ...LOOKS.main, font: fontFamily }} />
      )}
      {(voice && k.mute !== "voice" ? schedule.lines : []).map((l, j) => (
        <Sequence key={j} from={Math.round(l.start * fps)} layout="none">
          <Audio src={staticFile(`voices/${ep.id}/line${String(j + 1).padStart(2, "0")}.wav`)} />
        </Sequence>
      ))}
      {k.mute === "bed" ? null : !voice ? (
        <Audio src={staticFile(RM?.file ?? plan.track.file)} trimBefore={Math.round((RM ? RM.start : plan.offset) * fps)} volume={(f) => SOLO_MUSIC * Math.max(0, Math.min(1, f / fps / 0.5, (videoSec - f / fps) / 0.6))} />
      ) : plan.mode === "early build" && !RM ? (
        musicSections(plan).map((s, j) => (
          <Sequence key={j} from={Math.round(s.videoStart * fps)} layout="none">
            <Audio src={staticFile(plan.track.file)} trimBefore={Math.round(s.trackOffset * fps)} volume={(f) => lift(s.videoStart + f / fps) * musicGain(s.videoStart + f / fps, plan, schedule.lines, videoSec, tpl.musicFadeIn, tpl.loopFade) * s.fade(s.videoStart + f / fps)} />
          </Sequence>
        ))
      ) : (
        <Audio src={staticFile(RM?.file ?? plan.track.file)} trimBefore={Math.round((RM ? RM.start : plan.offset) * fps)} volume={(f) => lift(f / fps) * musicGain(f / fps, plan, schedule.lines, videoSec, tpl.musicFadeIn, tpl.loopFade)} />
      )}
      {k.sfx !== false && k.mute !== "bed" ? (
        <SfxLayer
          cues={sfxCues}
          frames={durationInFrames}
          ambienceAt={(f) => {
            const b = k.beats[beatAt(f / fps, T)];
            if (b.ambience === "none") return null;
            return b.ambience ? { name: b.ambience, vol: AMBIENCE[b.place]?.vol ?? 0.08 } : AMBIENCE[b.place];
          }}
          talkingAt={(f) => (voice ? talkAt(f / fps) : 0)}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const kitDuration = (k: KitEp) => scheduleOf(k, 30).durationInFrames;
