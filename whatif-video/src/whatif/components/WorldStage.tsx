import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, fontFamily } from "../theme";
import type { LineTiming } from "../timing";
import type { Episode } from "../types";
import { Icon, ICONS } from "./Icon";
import { CommentCard, Drop, DustInset } from "./Stage";

// Template 2 stage: one true-scale world seen through a log-zoom camera.
// Everything (drop, comparison objects, the city, the Earth itself) is placed in
// metres; the camera turns metres into pixels. As the drop grows the camera
// zooms out, so the world shrinks away beneath it.

const EARTH_RADIUS_M = 6_371_000; // NASA Earth Fact Sheet (mean radius)
const BASE = 290; // drop diameter on screen when the camera has caught up
const CX = 540;
const GROUND_Y = 1180; // where the drop touches the ground while the ground is big
const CITY_WIDTH_M = 3000; // illustrative skyline; not a measured city
const FLAT_ABOVE_PX = 40_000; // draw the Earth as a flat ground when its radius is bigger than this
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CTA_ICON = { drop: "drop", domino: "domino", jump: "person" } as const;

export const WorldStage: React.FC<{
  ep: Episode;
  t: number;
  camera: number;
  lines: LineTiming[];
}> = ({ ep, t, camera, lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowOf = (show: string) => {
    const i = ep.lines.findIndex((l) => l.show === show);
    return i === -1 ? null : { from: lines[i].start * fps, to: lines[i].end * fps };
  };
  const fade = (show: string, fadeOut: boolean) => {
    const w = windowOf(show);
    if (!w) return 0;
    const fadeIn = interpolate(frame, [w.from - 4, w.from + 8], [0, 1], clamp);
    return fadeOut ? fadeIn * interpolate(frame, [w.to + 6, w.to + 14], [1, 0], clamp) : fadeIn;
  };

  const s = BASE / 2 ** camera; // pixels per metre
  const d = ep.diameterAt(t);
  const dropPx = d * s;
  const Rpx = EARTH_RADIUS_M * s;
  // once the whole planet fits on screen, lift the ground so the Earth stays above the captions
  // (radius 50-110 px: its bottom sits at y=1250, just above the captions)
  const ground = interpolate(Rpx, [50, 110, 400], [1150, 1030, GROUND_Y], clamp);

  const mergeFrom = windowOf("merge")?.from;
  // episodes without a "merge" moment never merge
  const merge = mergeFrom === undefined ? 0 : interpolate(frame, [mergeFrom, mergeFrom + 1.6 * fps], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const dust = fade("dust", true);
  const speck = fade("speck", false) * (1 - fade("cta", false));
  const cta = fade("cta", false);

  const dropCy = ground - dropPx / 2;
  // Earth centre moves from under the ground into the middle of the drop
  const earthCy = ground + Rpx - merge * (Rpx + dropPx / 2);

  // screen position of a point on the Earth's surface, `x` metres along it from the drop
  const surface = (x: number) => {
    const th = x / EARTH_RADIUS_M;
    return { X: CX + EARTH_RADIUS_M * Math.sin(th) * s, Y: earthCy - EARTH_RADIUS_M * Math.cos(th) * s, th };
  };

  const wobble = 0.015 * Math.sin(frame / 5) + 0.05 * Math.max(0, 1 - (t % 1) * 5) * (t > 0.5 && t < ep.endT ? 1 : 0);
  const object = ep.object ?? "drop";

  // comparison objects stand on the ground, alternating right/left of the drop,
  // just outside the drop's edge at the moment of their comparison
  // (a domino chain fills the left side, so its comparisons all stand on the right)
  const objects = ep.rungs
    .filter((r) => r.icon !== "drop" && r.icon !== "earth" && r.placement !== "altitude")
    .map((r, k) => {
      const def = ICONS[r.icon];
      const widthM = def.axis === "w" ? r.size : (r.size * def.w) / def.h;
      const heightM = def.axis === "h" ? r.size : (r.size * def.h) / def.w;
      const side = object === "domino" || k % 2 === 0 ? 1 : -1;
      const x = side * (0.6 * ep.diameterAt(r.t) + widthM / 2);
      const p = surface(x);
      const w = widthM * s;
      const h = heightM * s;
      const op =
        interpolate(Math.max(w, h), [3, 8], [0, 1], clamp) *
        interpolate(h, [620, 900], [1, 0], clamp) *
        (1 - merge);
      return { r, p, w, h, op };
    })
    .filter((o) => o.op > 0.01 && Math.abs(o.p.X - CX) < 2500);

  const cityW = CITY_WIDTH_M * s;
  const cityOp = interpolate(cityW, [1600, 2600], [1, 0], clamp) * interpolate(cityW, [15, 40], [0, 1], clamp) * (1 - merge);
  const cityP = surface(0);

  const flat = Rpx > FLAT_ABOVE_PX;
  const earthArt = interpolate(Rpx, [900, 2500], [1, 0], clamp);

  const earth = flat ? (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: ground,
        bottom: 0,
        background: "linear-gradient(180deg, #4C9A55 0px, #2F6B3F 40px, #1F4A2C 100%)",
      }}
    />
  ) : (
    <>
      <div
        style={{
          position: "absolute",
          left: CX - Rpx,
          top: earthCy - Rpx,
          width: 2 * Rpx,
          height: 2 * Rpx,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 0%, #4C9A55 0%, #2F6B3F 30%, #1F4A2C 100%)",
        }}
      />
      {earthArt > 0 ? (
        <div style={{ position: "absolute", left: CX - Rpx, top: earthCy - Rpx, opacity: earthArt }}>
          <Icon name="earth" px={2 * Rpx} />
        </div>
      ) : null}
    </>
  );

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily }}>
      {merge === 0 ? earth : null}

      {cityOp > 0 ? (
        <div style={{ position: "absolute", left: cityP.X - cityW / 2, top: cityP.Y - (cityW * ICONS.city.h) / ICONS.city.w, opacity: cityOp }}>
          <Icon name="city" px={cityW} />
        </div>
      ) : null}

      {objects.map(({ r, p, w, h, op }) => (
        <div
          key={r.t}
          style={{
            position: "absolute",
            left: p.X - w / 2,
            top: p.Y - h,
            opacity: op,
            transformOrigin: "50% 100%",
            // a pitch is shown lying on the ground, seen from a low angle
            transform: `rotate(${p.th}rad)${r.icon === "field" ? " scaleY(0.35)" : ""}`,
          }}
        >
          <Icon name={r.icon} px={ICONS[r.icon].axis === "w" ? w : h} />
        </div>
      ))}

      {object === "drop" ? (
        <div style={{ position: "absolute", left: CX - dropPx / 2, top: dropCy - dropPx / 2, opacity: 0.92 }}>
          <Drop size={dropPx} wobble={wobble} />
        </div>
      ) : null}
      {object === "domino" ? <DominoChain ep={ep} t={t} s={s} ground={ground} topple={toppleProgress(ep, lines, frame, fps)} /> : null}
      {object === "jump" ? <JumpPath height={d} s={s} ground={ground} escape={escapeProgress(ep, lines, frame, fps)} frame={frame} /> : null}
      <SkyMarkers ep={ep} s={s} top={earthCy - Rpx} merge={merge} />

      {/* the Earth falls in: drawn inside the drop, under a layer of water */}
      {merge > 0 ? (
        <>
          {earth}
          <div
            style={{
              position: "absolute",
              left: CX - dropPx / 2,
              top: dropCy - dropPx / 2,
              width: dropPx,
              height: dropPx,
              borderRadius: "50%",
              background: "radial-gradient(circle at 40% 35%, rgba(181,228,255,0.25), rgba(30,136,229,0.45))",
              opacity: merge,
            }}
          />
        </>
      ) : null}

      {speck > 0 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: CX - Rpx * 1.6,
              top: earthCy - Rpx * 1.6,
              width: Rpx * 3.2,
              height: Rpx * 3.2,
              borderRadius: "50%",
              border: `8px solid ${COLORS.alert}`,
              boxSizing: "border-box",
              opacity: speck,
              transform: `scale(${1 + 0.06 * Math.sin(frame / 4)})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: dropCy + dropPx / 2 + 24,
              textAlign: "center",
              fontSize: 54,
              fontWeight: 900,
              color: COLORS.alert,
              opacity: speck,
              letterSpacing: 3,
            }}
          >
            THE SPECK = EARTH
          </div>
        </>
      ) : null}

      {dust > 0 ? <DustInset opacity={dust} frame={frame} /> : null}
      {ep.lines.map((l, i) =>
        l.show === "card" && l.card ? <FactCard key={i} card={l.card} opacity={cardOpacity(lines[i], frame, fps)} /> : null,
      )}
      {cta > 0 ? <CommentCard opacity={cta} frame={frame - (windowOf("cta")?.from ?? 0)} title={ep.ctaTitle} icon={CTA_ICON[object]} /> : null}
    </div>
  );
};

// ---- episode content pieces (only drawn when an episode asks for them) -------------

const windowProgress = (ep: Episode, lines: LineTiming[], show: string, frame: number, fps: number, seconds: number) => {
  const i = ep.lines.findIndex((l) => l.show === show);
  if (i === -1) return 0;
  const from = lines[i].start * fps;
  return interpolate(frame, [from, from + seconds * fps], [0, 1], clamp);
};
const toppleProgress = (ep: Episode, lines: LineTiming[], frame: number, fps: number) => windowProgress(ep, lines, "topple", frame, fps, 2.4);
const escapeProgress = (ep: Episode, lines: LineTiming[], frame: number, fps: number) => windowProgress(ep, lines, "escape", frame, fps, 2.5);
export const cardOpacity = (line: LineTiming, frame: number, fps: number) =>
  interpolate(frame, [line.start * fps - 4, line.start * fps + 8, line.end * fps + 6, line.end * fps + 14], [0, 1, 1, 0], clamp);

// A chain of dominoes, each 1.5x (or whatever the episode's growth is) the one before, at
// true scale. The newest stands in the middle; older, smaller ones run off to the left.
// `topple` 0->1 knocks them over one after another, left to right.
const DOMINO_WIDTH = 0.5; // tile width / height (front view)
const DOMINO_GAP = 0.15; // gap to the next tile / tile height: less than the height, so it can hit it
const DominoChain: React.FC<{ ep: Episode; t: number; s: number; ground: number; topple: number }> = ({ ep, t, s, ground, topple }) => {
  // dominoes 1..done are placed; the next one grows from the last size to its own while
  // the story moves on, so the counter (its height) ticks continuously
  const done = Math.floor(t + 1e-6);
  const growing = ep.diameterAt(t) / ep.diameterAt(done) > 1.01;
  const newest = growing ? done + 1 : done;
  const heightOf = (n: number) => (n > done ? ep.diameterAt(t) : ep.diameterAt(n));
  const tiles: { x: number; h: number; n: number }[] = [];
  let right = CX + (heightOf(newest) * s * DOMINO_WIDTH) / 2; // right edge of the newest tile
  for (let n = newest; n >= 1 && tiles.length < 40; n--) {
    const h = heightOf(n) * s;
    if (h < 1.5 || right < -200) break;
    tiles.push({ x: right - h * DOMINO_WIDTH, h, n });
    right -= h * DOMINO_WIDTH + h * DOMINO_GAP;
  }
  const count = tiles.length;
  return (
    <>
      {tiles.map(({ x, h, n }, i) => {
        // oldest visible tile falls first; each one leans onto the next, the last one lands flat
        const rank = count - 1 - i;
        const p = Math.min(1, Math.max(0, (topple * (count + 1) - rank) / 1.3));
        const angle = p * (i === 0 ? 90 : 62);
        return (
          <div key={n} style={{ position: "absolute", left: x, top: ground - h, transformOrigin: "100% 100%", transform: `rotate(${angle}deg)` }}>
            <Icon name="domino" px={h} />
          </div>
        );
      })}
    </>
  );
};

// A straight-up jump: dashed path from the ground to the top of the jump, with "you" at the
// top (drawn at least 46 px tall so you can see it; the path height is true scale).
// `escape` 0->1 sends you up and away off the top of the screen.
const JumpPath: React.FC<{ height: number; s: number; ground: number; escape: number; frame: number }> = ({ height, s, ground, escape, frame }) => {
  const h = height * s;
  const top = ground - h - escape * escape * 1600;
  const person = Math.min(Math.max(1.7 * s, 46), 170);
  const bob = escape > 0 ? 0 : 4 * Math.sin(frame / 6);
  return (
    <>
      <div style={{ position: "absolute", left: CX - 3, top, width: 6, height: ground - top, background: `repeating-linear-gradient(180deg, ${COLORS.accent} 0 14px, transparent 14px 26px)`, opacity: 0.9 }} />
      <div style={{ position: "absolute", left: CX - 40, top: ground - 8, width: 80, height: 10, borderRadius: "50%", background: "rgba(0,0,0,0.3)" }} />
      <div style={{ position: "absolute", left: CX - (person * 0.4) / 2, top: top - person + bob }}>
        <Icon name="person" px={person} />
      </div>
      <div style={{ position: "absolute", left: CX + person * 0.3 + 10, top: top - person * 0.8 + bob, fontFamily, fontWeight: 900, fontSize: 30, color: COLORS.text, letterSpacing: 2 }}>
        YOU
      </div>
    </>
  );
};

// Things that sit up in the sky at a known altitude (plane, space station, Moon), drawn on the
// right of the centre line at their true altitude, with a short label. Their own size is shown
// at least 28 px so they stay readable (the altitude is what is compared).
const SkyMarkers: React.FC<{ ep: Episode; s: number; top: number; merge: number }> = ({ ep, s, top, merge }) => {
  const markers = ep.rungs.filter((r) => r.placement === "altitude");
  return (
    <>
      {markers.map((r) => {
        const y = top - r.size * s;
        const altPx = r.size * s;
        const op = interpolate(altPx, [12, 40], [0, 1], clamp) * interpolate(y, [80, 200], [0, 1], clamp) * (1 - merge);
        if (op <= 0.01) return null;
        const px = Math.max(r.icon === "moon" ? 34 : 56, (r.icon === "moon" ? 3_474_800 : 0) * s);
        return (
          <div key={r.t} style={{ position: "absolute", left: CX + 150, top: y - px / 2, opacity: op, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "absolute", left: -150, top: px / 2, width: 140, borderTop: "3px dashed rgba(255,255,255,0.55)" }} />
            <Icon name={r.icon} px={px} />
            <div style={{ fontFamily, fontWeight: 900, fontSize: 28, color: COLORS.text, letterSpacing: 2, whiteSpace: "nowrap" }}>{r.marker ?? ""}</div>
          </div>
        );
      })}
    </>
  );
};

// A fact card over the stage (for twists that need a number or a source on screen)
export const FactCard: React.FC<{ card: { title: string; lines: string[] }; opacity: number }> = ({ card, opacity }) => {
  if (opacity <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, bottom: 0, background: "rgba(5,8,20,0.75)" }} />
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 700,
          padding: "40px 44px",
          borderRadius: 40,
          background: "#FFFFFF",
          color: COLORS.ink,
          fontFamily,
          boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.1, color: COLORS.accentDeep }}>{card.title}</div>
        {card.lines.map((l, i) => (
          <div key={i} style={{ marginTop: 18, fontSize: 36, fontWeight: 700, lineHeight: 1.25 }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
