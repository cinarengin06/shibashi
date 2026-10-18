export type PostureView = "front" | "side" | "back";

export type PoseKeypoint = {
  name?: string;
  score?: number;
  x: number;
  y: number;
};

export type PostureAnalysisSnapshot = {
  axisScore: number;
  confidence: number;
  feedback: string;
  flags: string[];
  hipScore: number;
  hipTilt: number;
  shoulderScore: number;
  shoulderTilt: number;
  sampleCount?: number;
  spineShift: number;
  view?: PostureView;
};

export type PostureReportAnalysisSource = {
  captures: Record<PostureView, { analysis: PostureAnalysisSnapshot }>;
  flags: string[];
  score: number;
  summary: string;
};

export function getPostureReportCompositeAnalysis(report: PostureReportAnalysisSource): ReturnType<typeof analyzePosture> {
  const front = report.captures.front.analysis;
  const side = report.captures.side.analysis;
  const back = report.captures.back.analysis;

  return {
    ...front,
    axisScore: report.score,
    breathScore: 0,
    confidence: Math.round(((front.confidence ?? 0) + (side.confidence ?? 0) + (back.confidence ?? 0)) / 3),
    feedback: report.summary,
    flags: report.flags,
    hipScore: Math.round((front.hipScore + side.hipScore + back.hipScore) / 3),
    hipTilt: (front.hipTilt + back.hipTilt) / 2,
    lean: Math.max(-10, Math.min(10, (front.spineShift + side.spineShift) / 4)),
    shoulderScore: Math.round((front.shoulderScore + side.shoulderScore + back.shoulderScore) / 3),
    shoulderTilt: (front.shoulderTilt + back.shoulderTilt) / 2,
    spineShift: Math.max(-20, Math.min(20, (front.spineShift + side.spineShift + back.spineShift) / 3)),
    view: "front",
  };
}

export function getPostureOverallScore(analysis: ReturnType<typeof analyzePosture>) {
  const values = [analysis.axisScore, analysis.shoulderScore, analysis.hipScore].filter((value) => value > 0);
  if (!values.length) return 0;

  return Math.round(analysis.axisScore * 0.42 + analysis.shoulderScore * 0.32 + analysis.hipScore * 0.26);
}

export function getPostureMetricList(analysis: ReturnType<typeof analyzePosture>) {
  const postureScore = getPostureOverallScore(analysis);
  const balanceScore = Math.round((analysis.axisScore + analysis.hipScore + analysis.shoulderScore) / 3);

  return [
    { icon: "D", label: "Genel duruş", value: postureScore, measurement: "bileşik skor", confidence: analysis.confidence },
    { icon: "O", label: "Omuz farkı", value: analysis.shoulderScore, measurement: `${Math.abs(analysis.shoulderTilt).toFixed(1)}°`, confidence: analysis.confidence },
    { icon: "S", label: "Gövde ekseni", value: analysis.axisScore, measurement: `${Math.abs(analysis.spineShift).toFixed(1)}°`, confidence: analysis.confidence },
    { icon: "K", label: "Kalça farkı", value: analysis.hipScore, measurement: `${Math.abs(analysis.hipTilt).toFixed(1)}°`, confidence: analysis.confidence },
    { icon: "G", label: "Denge bileşeni", value: balanceScore, measurement: "omuz · kalça · eksen", confidence: analysis.confidence },
  ];
}

function getMetricTone(value: number) {
  if (value >= 80) return "good";
  if (value >= 62) return "mid";
  return "fix";
}

export function getPostureQualityCounts(analysis: ReturnType<typeof analyzePosture>) {
  return getPostureMetricList(analysis).reduce(
    (counts, metric) => {
      const tone = getMetricTone(metric.value);
      if (tone === "good") counts.good += 1;
      if (tone === "mid") counts.mid += 1;
      if (tone === "fix") counts.fix += 1;
      return counts;
    },
    { fix: 0, good: 0, mid: 0 },
  );
}

export function getPostureCorrections(analysis: ReturnType<typeof analyzePosture>, ready: boolean) {
  if (!ready) {
    return ["Kamerayı açınca önce ayaklar ve baş aynı anda görünmeli. Analiz tam beden görünmeden başlamaz."];
  }

  const corrections = analysis.flags
    .filter((flag) => flag.includes("eğiliyor") || flag.includes("kaçıyor") || flag.includes("yana") || flag.includes("Ayakları"))
    .map((flag) => {
      if (flag.includes("Omuz")) return "Omuz çizgisinde fark var. Omuzlarını aşağı bırak ve göğsü zorlamadan aç.";
      if (flag.includes("Kalça")) return "Kalça hattı kayıyor. Ağırlığı iki ayağa daha eşit dağıt.";
      if (flag.includes("Merkez")) return "Baş ve gövde merkezden uzaklaşıyor. Tepeyi yukarı, kuyruk sokumunu aşağı düşün.";
      return "Ayaklar kadraj dışında kalıyor. Laptop ekranını biraz geriye eğ veya biraz daha geri çekil.";
    });

  return corrections.length ? corrections : ["Belirgin bir alarm yok. Nefesi bozma; hareketin yumuşaklığını koru."];
}

export function getPostureRecommendations(analysis: ReturnType<typeof analyzePosture>, view: PostureView) {
  const recommendations = [
    analysis.shoulderScore < 80
      ? {
          body: "Omuzlarını aşağı doğru gevşet ve nefesi göğüste tutma.",
          initial: "O",
          title: "Omuzları Rahatlat",
        }
      : {
          body: "Omuz hattı sakin. Bu yumuşaklığı forma taşımaya devam et.",
          initial: "O",
          title: "Omuz Çizgisini Koru",
        },
    analysis.hipScore < 80
      ? {
          body: "Ağırlığını aceleyle öne alma; topuk ve ayak başparmağı kökünü hisset.",
          initial: "A",
          title: "Ağırlık Merkezini Düzenle",
        }
      : {
          body: "Kalça hattı dengeli. Dizleri kilitlemeden bu dengeyi sürdür.",
          initial: "K",
          title: "Kalça Dengesini Koru",
        },
    view === "side"
      ? {
          body: "Yan görünümde kulak, omuz, kalça ve ayak bileği tek hat gibi aksın.",
          initial: "Y",
          title: "Yan Ekseni Kontrol Et",
        }
      : {
          body: "Gözlerin karşıda, çene rahat. Baş ve gövdeyi aynı merkeze çağır.",
          initial: "E",
          title: "Ekseni Ortala",
        },
  ];

  return recommendations.slice(0, 2);
}

export function analyzePosture(keypoints: PoseKeypoint[], _movementScore: number, _shenId: string, view: PostureView) {
  const visibleCount = keypoints.filter((keypoint) => (keypoint.score ?? 0) > 0.35).length;
  if (visibleCount < 6) {
    return {
      axisScore: 0,
      breathScore: 0,
      confidence: 0,
      feedback: "MediaPipe bekleniyor.",
      flags: ["Kamera bekleniyor", "Tam beden kadrajı gerekli", "Ayaklar görünmeli", "2-3 metre geri çekil"],
      hipScore: 0,
      hipTilt: 0,
      lean: 0,
      shoulderScore: 0,
      shoulderTilt: 0,
      spineShift: 0,
      view,
    };
  }

  const byName = new Map(keypoints.map((keypoint) => [keypoint.name, keypoint]));
  const leftShoulder = byName.get("left_shoulder");
  const rightShoulder = byName.get("right_shoulder");
  const leftHip = byName.get("left_hip");
  const rightHip = byName.get("right_hip");
  const nose = byName.get("nose");
  const leftAnkle = byName.get("left_ankle");
  const rightAnkle = byName.get("right_ankle");
  if (view === "side") {
    return analyzeSidePosture(byName);
  }

  const shoulderTilt = getSignedPairTilt(leftShoulder, rightShoulder);
  const hipTilt = getSignedPairTilt(leftHip, rightHip);
  const shoulderScore = scoreAngularDeviation(Math.abs(shoulderTilt), 1.25, 12);
  const hipScore = scoreAngularDeviation(Math.abs(hipTilt), 1.25, 10);
  const shoulderCenter = getMidpoint(leftShoulder, rightShoulder);
  const hipCenter = getMidpoint(leftHip, rightHip);
  const torsoTilt = shoulderCenter && hipCenter
    ? Math.atan2(shoulderCenter.x - hipCenter.x, hipCenter.y - shoulderCenter.y) * 180 / Math.PI
    : 0;
  const headTilt = nose && shoulderCenter && isVisiblePosePoint(nose)
    ? Math.atan2(nose.x - shoulderCenter.x, shoulderCenter.y - nose.y) * 180 / Math.PI
    : torsoTilt;
  const spineShift = Math.max(-30, Math.min(30, torsoTilt * 0.7 + headTilt * 0.3));
  const axisScore = scoreAngularDeviation(Math.abs(spineShift), 1.25, 12);
  const lean = Math.max(-10, Math.min(10, shoulderTilt / 2.1 + spineShift / 4.5));
  const fullBodyReady = [leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle].every((point) => isVisiblePosePoint(point));
  const confidence = getPoseMeasurementConfidence([nose, leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle]);
  const flags = [
    Math.abs(shoulderTilt) > 8 ? "Omuz hattı eğiliyor" : "Omuz hattı sakin",
    Math.abs(hipTilt) > 8 ? "Kalça çizgisi kaçıyor" : "Kalça dengeli",
    Math.abs(spineShift) > 8 ? "Merkez ekseni yana kayıyor" : "Eksen merkezde",
    fullBodyReady ? "Tam beden görünür" : "Ayakları da kadraja al",
  ];

  const viewCue =
    view === "front"
      ? "Ön görünümde omuz ve kalça çizgisini yatay tut."
      : "Arka görünümde sağ-sol yük dağılımını eşitle.";
  const feedback =
    axisScore > 82 && shoulderScore > 78 && hipScore > 78
      ? `${viewCue} Şu an postür çizgin oldukça temiz; nefesi bozmadan devam et.`
      : `${viewCue} ${Math.abs(spineShift) > 8 ? "Baş ve gövdeyi merkeze çağır." : "Omuzları yumuşat ve dizleri kilitleme."}`;

  return {
    axisScore,
    breathScore: 0,
    confidence,
    feedback,
    flags,
    hipScore,
    hipTilt,
    lean,
    shoulderScore,
    shoulderTilt,
    spineShift,
    view,
  };
}

function analyzeSidePosture(byName: Map<string | undefined, PoseKeypoint>) {
  const sideLines = {
    left: ["left_ear", "left_shoulder", "left_hip", "left_knee", "left_ankle"],
    right: ["right_ear", "right_shoulder", "right_hip", "right_knee", "right_ankle"],
  } as const;
  const lineVisibility = (names: readonly string[]) => names.reduce((sum, name) => sum + (byName.get(name)?.score ?? 0), 0);
  const line = lineVisibility(sideLines.left) >= lineVisibility(sideLines.right) ? sideLines.left : sideLines.right;
  const [ear, shoulder, hip, knee, ankle] = line.map((name) => byName.get(name));
  const verticalAngle = (upper?: PoseKeypoint, lower?: PoseKeypoint) => {
    if (!isVisiblePosePoint(upper) || !isVisiblePosePoint(lower)) return 20;
    return Math.abs(Math.atan2(lower.x - upper.x, lower.y - upper.y) * 180 / Math.PI);
  };
  const jointFlexionDeviation = (upper?: PoseKeypoint, center?: PoseKeypoint, lower?: PoseKeypoint) => {
    if (!isVisiblePosePoint(upper) || !isVisiblePosePoint(center) || !isVisiblePosePoint(lower)) return 24;
    const first = { x: upper.x - center.x, y: upper.y - center.y };
    const second = { x: lower.x - center.x, y: lower.y - center.y };
    const denominator = Math.hypot(first.x, first.y) * Math.hypot(second.x, second.y);
    if (!denominator) return 24;
    const angle = Math.acos(Math.max(-1, Math.min(1, (first.x * second.x + first.y * second.y) / denominator))) * 180 / Math.PI;
    return Math.abs(180 - angle);
  };
  const headAngle = verticalAngle(ear, shoulder);
  const torsoAngle = verticalAngle(shoulder, hip);
  const legAngle = verticalAngle(hip, ankle);
  const kneeAngle = jointFlexionDeviation(hip, knee, ankle);
  const headForward = Math.abs(headAngle - torsoAngle);
  const lowerAxisDifference = Math.abs(torsoAngle - legAngle);
  const shoulderScore = scoreAngularDeviation(headForward, 4.5, 24);
  const torsoScore = scoreAngularDeviation(torsoAngle, 3.5, 20);
  const legScore = scoreAngularDeviation(lowerAxisDifference, 4, 22);
  const kneeScore = scoreAngularDeviation(kneeAngle, 12, 38);
  const axisScore = Math.round(torsoScore * 0.6 + legScore * 0.25 + kneeScore * 0.15);
  const hipScore = scoreAngularDeviation(lowerAxisDifference, 4, 20);
  const spineShift = Math.max(-20, Math.min(20, torsoAngle));
  const fullBodyReady = [ear, shoulder, hip, knee, ankle].every((point) => isVisiblePosePoint(point));
  const confidence = getPoseMeasurementConfidence([ear, shoulder, hip, knee, ankle]);
  const flags = [
    headForward > 10 ? "Baş öne taşınıyor" : "Baş omuz hattında",
    torsoAngle > 8 ? "Gövde dikeyden sapıyor" : "Gövde ekseni sakin",
    Math.abs(torsoAngle - legAngle) > 7 ? "Kalça-ayak bileği hattı ayrışıyor" : "Alt beden ekseni dengeli",
    fullBodyReady ? "Yan beden görünür" : "Yan kadrajı tamamla",
  ];
  return {
    axisScore,
    breathScore: 0,
    confidence,
    feedback:
      axisScore > 82 && shoulderScore > 78
        ? "Yan görünümde kulak, omuz, kalça ve ayak bileği dengeli bir hatta."
        : `Yan eksende baş farkı ${headForward.toFixed(1)}°, gövde ${torsoAngle.toFixed(1)}° ve diz bükümü ${kneeAngle.toFixed(1)}° ölçüldü.`,
    flags,
    hipScore,
    hipTilt: torsoAngle - legAngle,
    lean: Math.max(-10, Math.min(10, torsoAngle / 2)),
    shoulderScore,
    shoulderTilt: headForward,
    spineShift,
    view: "side" as const,
  };
}

function getSignedPairTilt(left?: PoseKeypoint, right?: PoseKeypoint) {
  if (!isVisiblePosePoint(left) || !isVisiblePosePoint(right)) return 0;
  return Math.atan2(right.y - left.y, right.x - left.x) * 180 / Math.PI;
}

function scoreAngularDeviation(deviation: number, excellent: number, limit: number) {
  if (deviation <= excellent) return 100;
  return Math.max(0, Math.min(100, Math.round(100 - ((deviation - excellent) / (limit - excellent)) * 100)));
}

function getPoseMeasurementConfidence(points: Array<PoseKeypoint | undefined>) {
  const scored = points.map((point) => Math.max(0, Math.min(1, point?.score ?? 0)));
  if (!scored.length) return 0;
  return Math.round((scored.reduce((sum, score) => sum + score, 0) / scored.length) * 100);
}

export function getMidpoint(left?: PoseKeypoint, right?: PoseKeypoint) {
  if (!isVisiblePosePoint(left) || !isVisiblePosePoint(right)) return undefined;
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
  };
}

export function isVisiblePosePoint(keypoint: PoseKeypoint | undefined): keypoint is PoseKeypoint {
  return Boolean(keypoint && (keypoint.score ?? 0) >= 0.35);
}
