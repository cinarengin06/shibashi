import type { PoseLandmark } from './MediaPipePoseBridge';

export type ReferenceFrame = { t: number; p: [number, number, number][] };
export type ReferenceMovement = { duration: number; aspect: number; frames: ReferenceFrame[] };
export type JointComparison = { score: number | null; fullBody: boolean; joints: Record<number, number> };

const joints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const weights: Record<number, number> = { 0: .35, 11: .5, 12: .5, 13: 1, 14: 1, 15: 1.3, 16: 1.3, 23: .7, 24: .7, 25: .7, 26: .7, 27: .6, 28: .6 };
type Point = { x: number; y: number; v: number };

function normalized(points: Point[], aspect: number) {
  const left = points[11], right = points[12];
  if (!left || !right || Math.min(left.v, right.v) < .4) return null;
  const cx = (left.x + right.x) / 2;
  const cy = (left.y + right.y) / 2;
  const scale = Math.max(.04, Math.hypot((left.x - right.x) * aspect, left.y - right.y));
  return points.map(point => ({ x: (point.x - cx) * aspect / scale, y: (point.y - cy) / scale, v: point.v }));
}

function fullBody(points: Point[]) {
  const required = [0, 11, 12, 23, 24, 25, 26, 27, 28];
  if (!required.every(i => points[i] && points[i].v >= .45 && points[i].x > .015 && points[i].x < .985 && points[i].y > .015 && points[i].y < .985)) return false;
  const y = (a: number, b: number) => (points[a].y + points[b].y) / 2;
  return points[0].y < .43 && y(23,24) > y(11,12) + .08 && y(25,26) > y(23,24) + .07 && y(27,28) > .68 && y(27,28) - points[0].y > .46;
}

export function compareShibashiPose(user: PoseLandmark[], teacher: ReferenceFrame, userAspect: number, teacherAspect: number, previous?: { user: PoseLandmark[]; teacher: ReferenceFrame }): JointComparison {
  const actual = user.map(p => ({ x: p.x, y: p.y, v: p.visibility ?? 0 }));
  const expected = teacher.p.map(p => ({ x: p[0], y: p[1], v: p[2] }));
  const visible = fullBody(actual);
  const a = normalized(actual, userAspect), b = normalized(expected, teacherAspect);
  if (!visible || !a || !b) return { score: null, fullBody: visible, joints: {} };
  const jointScores: Record<number, number> = {};
  let error = 0, weight = 0;
  for (const i of joints) {
    if (!a[i] || !b[i] || Math.min(a[i].v, b[i].v) < .4) continue;
    const distance = Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y);
    const w = weights[i];
    error += distance * w;
    weight += w;
    jointScores[i] = Math.max(0, Math.round(100 - distance * 105));
  }
  if (weight < 4) return { score: null, fullBody: true, joints: jointScores };
  let posture = Math.max(0, Math.min(100, 100 - error / weight * 105));
  if (previous) {
    const oldA = normalized(previous.user.map(p => ({ x: p.x, y: p.y, v: p.visibility ?? 0 })), userAspect);
    const oldB = normalized(previous.teacher.p.map(p => ({ x: p[0], y: p[1], v: p[2] })), teacherAspect);
    if (oldA && oldB) {
      let motionError = 0, teacherMotion = 0, motionWeight = 0;
      for (const i of joints) {
        if (Math.min(a[i]?.v ?? 0, b[i]?.v ?? 0, oldA[i]?.v ?? 0, oldB[i]?.v ?? 0) < .4) continue;
        const dx = a[i].x - oldA[i].x - (b[i].x - oldB[i].x);
        const dy = a[i].y - oldA[i].y - (b[i].y - oldB[i].y);
        const w = weights[i];
        motionError += Math.hypot(dx, dy) * w;
        teacherMotion += Math.hypot(b[i].x - oldB[i].x, b[i].y - oldB[i].y) * w;
        motionWeight += w;
      }
      if (motionWeight > 3 && teacherMotion / motionWeight > .025) {
        const motion = Math.max(0, Math.min(100, 100 - motionError / motionWeight * 140));
        posture = posture * .75 + motion * .25;
      }
    }
  }
  return { score: Math.round(posture), fullBody: true, joints: jointScores };
}

export function referenceAt(movement: ReferenceMovement, seconds: number) {
  if (!movement.frames.length) return null;
  return movement.frames.reduce((best, frame) => Math.abs(frame.t - seconds) < Math.abs(best.t - seconds) ? frame : best, movement.frames[0]);
}
