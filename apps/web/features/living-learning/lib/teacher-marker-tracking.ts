export type MovementPoint = { name: string; x: number; y: number; score: number };
export type MarkerPoint = { x: number; y: number; confidence: number };
export type MarkerMap = Record<string, MarkerPoint>;
export type CanonicalPoint = { x: number; y: number };
export type CanonicalMarkers = Record<string, CanonicalPoint>;

const markerSpecs = [
  { name: "left_shoulder", radius: 29 },
  { name: "right_shoulder", radius: 29 },
  { name: "left_rib", radius: 24 },
  { name: "right_rib", radius: 24 },
  { name: "left_wrist", radius: 34 },
  { name: "right_wrist", radius: 34 },
  { name: "left_hip", radius: 30 },
  { name: "right_hip", radius: 30 },
  { name: "left_shin", radius: 37 },
  { name: "right_shin", radius: 37 },
  { name: "left_ankle", radius: 30 },
  { name: "right_ankle", radius: 30 },
] as const;

function between(a: MovementPoint | undefined, b: MovementPoint | undefined, fraction: number): MarkerPoint | null {
  if (!a || !b || Math.min(a.score, b.score) < .35) return null;
  return { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction, confidence: Math.min(a.score, b.score) };
}

export function virtualBodyMarkers(pose: MovementPoint[]): MarkerMap {
  const points = new Map(pose.map((point) => [point.name, point]));
  const markers: MarkerMap = {};
  for (const spec of markerSpecs) {
    let point: MarkerPoint | null = null;
    if (spec.name.endsWith("_rib")) {
      const side = spec.name.split("_")[0];
      point = between(points.get(`${side}_shoulder`), points.get(`${side}_hip`), .46);
    } else if (spec.name.endsWith("_shin")) {
      const side = spec.name.split("_")[0];
      point = between(points.get(`${side}_knee`), points.get(`${side}_ankle`), .58);
    } else {
      const joint = points.get(spec.name);
      if (joint && joint.score >= .35) point = { x: joint.x, y: joint.y, confidence: joint.score };
    }
    if (point) markers[spec.name] = point;
  }
  return markers;
}

function pixelBrightness(data: Uint8ClampedArray, width: number, height: number, x: number, y: number) {
  if (x < 0 || x >= width || y < 0 || y >= height) return 255;
  const index = (y * width + x) * 4;
  return (data[index] + data[index + 1] + data[index + 2]) / 3;
}

export function trackTeacherWhiteMarkers(video: HTMLVideoElement, pose: MovementPoint[], canvas: HTMLCanvasElement, previous: MarkerMap = {}): MarkerMap {
  if (!video.videoWidth || !video.videoHeight) return {};
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return {};
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const anchors = virtualBodyMarkers(pose);
  const markers: MarkerMap = {};
  const occupied: Array<{ x: number; y: number }> = [];
  const scale = canvas.width / 360;

  for (const spec of markerSpecs) {
    const anchor = anchors[spec.name];
    if (!anchor) continue;
    const centerX = Math.round(anchor.x * canvas.width);
    const centerY = Math.round(anchor.y * canvas.height);
    const radius = Math.round(spec.radius * scale);
    let best: { x: number; y: number; quality: number; confidence: number } | null = null;
    for (let y = Math.max(7, centerY - radius); y <= Math.min(canvas.height - 8, centerY + radius); y += 2) {
      for (let x = Math.max(7, centerX - radius); x <= Math.min(canvas.width - 8, centerX + radius); x += 2) {
        const distance = Math.hypot(x - centerX, y - centerY);
        if (distance > radius || occupied.some((point) => Math.hypot(point.x - x, point.y - y) < 9 * scale)) continue;
        const index = (y * canvas.width + x) * 4;
        const red = data[index], green = data[index + 1], blue = data[index + 2];
        const brightness = (red + green + blue) / 3;
        if (Math.min(red, green, blue) < 175 || Math.max(red, green, blue) - Math.min(red, green, blue) > 54) continue;
        const nearby = [
          pixelBrightness(data, canvas.width, canvas.height, x - 1, y),
          pixelBrightness(data, canvas.width, canvas.height, x + 1, y),
          pixelBrightness(data, canvas.width, canvas.height, x, y - 1),
          pixelBrightness(data, canvas.width, canvas.height, x, y + 1),
        ];
        if (nearby.filter((value) => value >= 165).length < 2) continue;
        const ring = [
          pixelBrightness(data, canvas.width, canvas.height, x - 7, y),
          pixelBrightness(data, canvas.width, canvas.height, x + 7, y),
          pixelBrightness(data, canvas.width, canvas.height, x, y - 7),
          pixelBrightness(data, canvas.width, canvas.height, x, y + 7),
        ];
        const background = ring.reduce((sum, value) => sum + value, 0) / ring.length;
        const contrast = brightness - background;
        if (background > 170 || contrast < 46) continue;
        const last = previous[spec.name];
        const travel = last ? Math.hypot(x - last.x * canvas.width, y - last.y * canvas.height) : 0;
        const quality = contrast - distance / radius * 35 - Math.max(0, travel - 12 * scale) * .65;
        if (!best || quality > best.quality) best = { x, y, quality, confidence: Math.min(1, contrast / 95) };
      }
    }
    if (best) {
      markers[spec.name] = { x: best.x / canvas.width, y: best.y / canvas.height, confidence: best.confidence };
      occupied.push({ x: best.x, y: best.y });
    }
  }
  return markers;
}

export function canonicalMarkers(markers: MarkerMap, pose: MovementPoint[], aspectRatio: number): CanonicalMarkers {
  const points = new Map(pose.map((point) => [point.name, point]));
  const left = points.get("left_shoulder"), right = points.get("right_shoulder");
  if (!left || !right || Math.min(left.score, right.score) < .35) return {};
  const centerX = (left.x + right.x) / 2;
  const centerY = (left.y + right.y) / 2;
  const size = Math.max(.04, Math.hypot((left.x - right.x) * aspectRatio, left.y - right.y));
  return Object.fromEntries(Object.entries(markers).filter(([, point]) => point.confidence >= .35).map(([name, point]) => [name, {
    x: (point.x - centerX) * aspectRatio / size,
    y: (point.y - centerY) / size,
  }]));
}

export function compareMarkerMotion(teacher: CanonicalMarkers, previousTeacher: CanonicalMarkers, user: CanonicalMarkers, previousUser: CanonicalMarkers): number | null {
  let error = 0;
  let movement = 0;
  let count = 0;
  for (const name of Object.keys(teacher)) {
    const currentTeacher = teacher[name], oldTeacher = previousTeacher[name];
    const currentUser = user[name], oldUser = previousUser[name];
    if (!oldTeacher || !currentUser || !oldUser) continue;
    const teacherDx = currentTeacher.x - oldTeacher.x;
    const teacherDy = currentTeacher.y - oldTeacher.y;
    const userDx = currentUser.x - oldUser.x;
    const userDy = currentUser.y - oldUser.y;
    movement += Math.hypot(teacherDx, teacherDy);
    error += Math.hypot(userDx - teacherDx, userDy - teacherDy);
    count++;
  }
  if (count < 3 || movement / count < .025) return null;
  return Math.max(0, Math.min(100, Math.round(100 - error / count * 135)));
}
