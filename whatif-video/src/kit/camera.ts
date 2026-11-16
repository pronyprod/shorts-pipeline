// KIT camera: named shots per place (B and D), and moves within a beat (D).
// All shots are made for a narrow 9:16 frame: they keep Pom and the board inside ~3 units of width.
import * as THREE from "three";
import type { V3 } from "./core";
import { ANCHORS, originOf, type PlaceId } from "./places";

export const FOV = 50;
export type ShotKind = "wide" | "medium" | "close" | "high" | "low" | "board" | "far";
export type MoveKind = "hold" | "push" | "pull" | "crane" | "drop" | "orbitL" | "orbitR";
export type Pose = { pos: V3; look: V3 };

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lerp = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// `pomAt` = where Pom stands in this beat (local), if not the place default
export const shotFor = (place: PlaceId, kind: ShotKind, pomAt?: V3, nudge?: Partial<Pose>): Pose => {
  const o = originOf(place);
  const A = ANCHORS[place];
  const pom = add(o, pomAt ?? A.pom);
  const focus = add(o, A.focus);
  const board = add(o, A.board.p);
  const mid: V3 = [(pom[0] + board[0]) / 2, 0, (pom[2] + board[2]) / 2];
  let s: Pose;
  switch (kind) {
    case "wide":
      s = { pos: add(focus, [0.4, 2.4, 13.5]), look: add(focus, [0, 0.4, 0]) };
      break;
    case "far":
      s = { pos: add(focus, [0.6, 4.5, 22]), look: add(focus, [0, 1.5, 0]) };
      break;
    case "medium":
      s = { pos: add(pom, [0.3, 1.8, 6.4]), look: add(pom, [0.1, 1.25, 0]) };
      break;
    case "close":
      s = { pos: add(pom, [0.15, 1.5, 3.7]), look: add(pom, [0.05, 1.3, 0]) };
      break;
    case "high":
      s = { pos: add(focus, [0.6, 7.5, 11.5]), look: add(focus, [0, -0.3, 0]) };
      break;
    case "low":
      s = { pos: add(pom, [0.7, 0.45, 5.2]), look: add(pom, [0, 2.3, 0]) };
      break;
    case "board":
    default:
      s = { pos: [mid[0], 2.1, mid[2] + 9.2], look: [mid[0], 1.65, mid[2]] };
  }
  return { pos: nudge?.pos ? add(s.pos, nudge.pos) : s.pos, look: nudge?.look ? add(s.look, nudge.look) : s.look };
};

const orbit = (s: Pose, ang: number): Pose => {
  const d = new THREE.Vector3(s.pos[0] - s.look[0], 0, s.pos[2] - s.look[2]).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
  return { pos: [s.look[0] + d.x, s.pos[1], s.look[2] + d.z], look: s.look };
};
// a move turns one shot into a start pose and an end pose
export const moveOf = (s: Pose, m: MoveKind): [Pose, Pose] => {
  const back = (k: number): Pose => ({ pos: lerp(s.look, s.pos, k), look: s.look });
  switch (m) {
    case "push":
      return [back(1.3), s];
    case "pull":
      return [back(0.75), back(1.15)];
    case "crane":
      return [{ pos: add(s.pos, [0, -1.4, -1]), look: add(s.look, [0, -0.6, 0]) }, { pos: add(s.pos, [0, 1.6, 0.8]), look: s.look }];
    case "drop":
      return [{ pos: add(s.pos, [0, 2.5, 1]), look: s.look }, s];
    case "orbitL":
      return [orbit(s, 0.28), orbit(s, -0.12)];
    case "orbitR":
      return [orbit(s, -0.28), orbit(s, 0.12)];
    case "hold":
    default:
      return [back(1.05), back(0.97)];
  }
};

export const projectTo = (p: V3, pose: Pose) => {
  const cam = new THREE.PerspectiveCamera(FOV, 1080 / 1920, 0.1, 400);
  cam.position.set(...pose.pos);
  cam.lookAt(new THREE.Vector3(...pose.look));
  cam.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(cam);
  return { x: ((v.x + 1) / 2) * 1080, y: ((1 - v.y) / 2) * 1920, inFront: v.z < 1 };
};
