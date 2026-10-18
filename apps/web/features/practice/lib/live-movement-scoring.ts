import { compareMovement, getGhostSequence, getInterpolatedGhostFrame } from "@/packages/shen-domain";
import type { PoseKeypoint as PosturePoseKeypoint } from "@/packages/posture-analysis";
import type { WarmupLessonId } from "@/features/practice/data/movements";

export type LiveMovementMatch = {
  total: number;
  form: number;
  rhythm: number;
  balance: number;
  feedback: string;
};

export function scoreMovementAgainstReference(
  keypoints: PosturePoseKeypoint[],
  video: HTMLVideoElement,
  movementId: number,
  now: number,
): LiveMovementMatch {
  const sequence = getGhostSequence(`movement-${movementId}`);
  if (!sequence || !video.videoWidth || !video.videoHeight) {
    return { total: 0, form: 0, rhythm: 0, balance: 0, feedback: "Bu hareketin referans ölçümü hazırlanıyor." };
  }
  const frame = getInterpolatedGhostFrame(sequence, now % sequence.durationMs);
  if (!frame) {
    return { total: 0, form: 0, rhythm: 0, balance: 0, feedback: "Referans karesi bekleniyor." };
  }
  const normalizedPose = keypoints.flatMap((point) =>
    point.name
      ? [{
          name: point.name,
          score: point.score,
          x: point.x / video.videoWidth,
          y: point.y / video.videoHeight,
        }]
      : [],
  );
  const comparison = compareMovement(normalizedPose, frame.keypoints);
  const form = Math.round((comparison.shoulderLevel + comparison.torsoDirection + comparison.kneeAngle) / 3);
  const rhythm = comparison.timing;
  const balance = comparison.centerTransfer;
  const total = Math.round(form * 0.5 + rhythm * 0.25 + balance * 0.25);
  return {
    total,
    form,
    rhythm,
    balance,
    feedback: comparison.feedback[0] ?? "Hareket referansıyla karşılaştırılıyor.",
  };
}

export function scoreLiveMovementMatch(
  keypoints: PosturePoseKeypoint[],
  previous: { keypoints: PosturePoseKeypoint[]; at: number } | null,
  target: number | WarmupLessonId,
): LiveMovementMatch {
  const byName = new Map(keypoints.map((point) => [point.name, point]));
  const visibleNames = [
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle",
  ];
  const visibleCount = visibleNames.filter((name) => (byName.get(name)?.score ?? 0) >= 0.35).length;
  if (visibleCount < visibleNames.length) {
    return { total: 0, form: 0, rhythm: 0, balance: 0, feedback: "Biraz geriye geç; başın, ellerin ve ayakların kadrajda olsun." };
  }

  const leftShoulder = byName.get("left_shoulder");
  const rightShoulder = byName.get("right_shoulder");
  const leftWrist = byName.get("left_wrist");
  const rightWrist = byName.get("right_wrist");
  const leftHip = byName.get("left_hip");
  const rightHip = byName.get("right_hip");
  const leftKnee = byName.get("left_knee");
  const rightKnee = byName.get("right_knee");

  const shoulderWidth = leftShoulder && rightShoulder ? Math.max(40, Math.abs(leftShoulder.x - rightShoulder.x)) : 120;
  const wristSpread = leftWrist && rightWrist ? Math.abs(leftWrist.x - rightWrist.x) / shoulderWidth : 0;
  const wristHeight = leftWrist && rightWrist && leftShoulder && rightShoulder
    ? (((leftShoulder.y + rightShoulder.y) / 2) - ((leftWrist.y + rightWrist.y) / 2)) / shoulderWidth
    : 0;
  const kneeSoftness = leftHip && rightHip && leftKnee && rightKnee
    ? (((leftKnee.y + rightKnee.y) / 2) - ((leftHip.y + rightHip.y) / 2)) / shoulderWidth
    : 2.2;

  const numericTarget = typeof target === "number" ? target : target === "wuji" ? 1 : target === "warmup" ? 3 : 4;
  const phase = (numericTarget - 1) % 6;
  const targetSpread = [0.8, 1.5, 1.15, 1.8, 1.35, 0.95][phase];
  const targetHeight = [-0.85, -0.15, 0.35, 0.05, 0.55, -0.45][phase];
  const spreadError = Math.abs(wristSpread - targetSpread);
  const heightError = Math.abs(wristHeight - targetHeight);
  const form = Math.round(Math.max(0, Math.min(100, 100 - spreadError * 28 - heightError * 34)));

  const shoulderBalance = getPairBalanceScore(leftShoulder, rightShoulder, 50);
  const hipBalance = getPairBalanceScore(leftHip, rightHip, 40);
  const center = getCenteringScore(byName) * 1.4;
  const balance = Math.round(Math.max(0, Math.min(100, shoulderBalance + hipBalance + center)));

  let rhythm = 0;
  if (previous && performance.now() - previous.at < 700) {
    const previousByName = new Map(previous.keypoints.map((point) => [point.name, point]));
    const tracked = ["left_wrist", "right_wrist", "left_elbow", "right_elbow", "left_shoulder", "right_shoulder"];
    const deltas = tracked.flatMap((name) => {
      const current = byName.get(name);
      const before = previousByName.get(name);
      if (!current || !before || (current.score ?? 0) < 0.35 || (before.score ?? 0) < 0.35) return [];
      return [Math.hypot(current.x - before.x, current.y - before.y) / shoulderWidth];
    });
    const motion = deltas.length ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length : 0;
    // Shibashi should flow: completely frozen or abrupt movement both lower rhythm quality.
    rhythm = Math.round(Math.max(0, Math.min(100, 100 - Math.abs(motion - 0.035) * 950)));
  }

  const total = Math.round(form * 0.55 + rhythm * 0.25 + balance * 0.20);
  let feedback = "Akış iyi; nefesi hareketle birlikte sürdür.";
  if (balance < 62) feedback = "Omuzlarını ve kalçanı aynı hizada tut; merkezini koru.";
  else if (heightError > 0.65) feedback = wristHeight < targetHeight ? "Ellerini biraz daha yukarı taşı." : "Ellerini biraz daha aşağı ve yumuşak bırak.";
  else if (spreadError > 0.7) feedback = wristSpread < targetSpread ? "Kollarını biraz daha aç." : "Kollarını merkeze biraz yaklaştır.";
  else if (rhythm < 58) feedback = "Hareketi yavaşlat; kesintisiz ve yumuşak ak.";
  else if (total >= 85) feedback = "Çok iyi; öğretmenin ritmini ve formunu yakaladın.";

  return { total: Math.max(0, Math.min(100, total)), form, rhythm, balance, feedback };
}

export function getMovementBreathCue(movementId: number): string {
  const cues = [
    "Kollar yükselirken nefes al; alçalırken nefesi ver.",
    "Göğüs açılırken nefes al; eller merkeze dönerken nefes ver.",
    "Ağırlık merkeze gelirken nefes al; yana akarken nefes ver.",
    "Daire açılırken nefes al; avuçlar merkeze yaklaşırken nefes ver.",
    "Eller hazırlanırken nefes al; itiş merkezden çıkarken nefes ver.",
    "Kürek geriye gelirken nefes al; öne uzanırken nefes ver.",
    "Top yükselirken nefes al; ağırlık yerleşirken nefes ver.",
    "Kollar göğe çıkarken nefes al; merkeze inerken nefes ver.",
    "Avuçlar yaklaşırken nefes al; merkezden iterken nefes ver.",
    "Eller yön değiştirirken doğal nefesi kesmeden akışı sürdür.",
    "Aşağı inerken nefes ver; suyu göğe taşırken nefes al.",
    "Dalga geriye çekilirken nefes al; öne gelirken nefes ver.",
    "Kanatlar açılırken nefes al; kapanırken nefes ver.",
    "Yumruk hazırlanırken nefes al; kontrollü uzarken nefes ver.",
    "Yükselirken nefes al; yumuşakça alçalırken nefes ver.",
    "Daire yükselirken nefes al; aşağı tamamlanırken nefes ver.",
    "Top yükselirken nefes al; el ve ayak alçalırken nefes ver.",
    "Eller merkeze inerken nefesi uzat; sonra doğal nefese dön.",
  ];

  return cues[movementId - 1] ?? "Nefesi tutmadan hareketin doğal ritmini izle.";
}

function getPairBalanceScore(left?: PosturePoseKeypoint, right?: PosturePoseKeypoint, maxScore = 16): number {
  if (!left || !right || (left.score ?? 0) < 0.3 || (right.score ?? 0) < 0.3) return 0;

  const verticalDifference = Math.abs(left.y - right.y);
  return Math.max(0, maxScore - verticalDifference / 5);
}

function getCenteringScore(keypoints: Map<string | undefined, PosturePoseKeypoint>): number {
  const shoulders = [keypoints.get("left_shoulder"), keypoints.get("right_shoulder")].filter(Boolean) as PosturePoseKeypoint[];
  const hips = [keypoints.get("left_hip"), keypoints.get("right_hip")].filter(Boolean) as PosturePoseKeypoint[];
  const points = [...shoulders, ...hips].filter((point) => (point.score ?? 0) > 0.3);

  if (!points.length) return 0;

  const centerX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const idealCenter = 360;
  const distance = Math.abs(centerX - idealCenter);
  return Math.max(0, 14 - distance / 22);
}

