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

export type PostureNarrativeCapture = Pick<
  PostureAnalysisSnapshot,
  "axisScore" | "hipScore" | "shoulderScore"
> & Pick<Partial<PostureAnalysisSnapshot>, "hipTilt" | "shoulderTilt" | "spineShift"> & { view: PostureView };

export type PostureNarrativePrevious = {
  score: number;
  captures: PostureNarrativeCapture[];
};

const postureViewLabels: Record<PostureView, string> = {
  front: "ön",
  side: "yan",
  back: "arka",
};

const postureRegionLabels = {
  axisScore: "merkez ekseni",
  shoulderScore: "omuz hattı",
  hipScore: "kalça dengesi",
} as const;

export function buildPostureNarrative(
  captures: PostureNarrativeCapture[],
  score: number,
  previous?: PostureNarrativePrevious,
) {
  const regions = (["shoulderScore", "hipScore", "axisScore"] as const).map((key) => {
    const relevant = captures.filter((capture) => Number.isFinite(capture[key]));
    const average = Math.round(relevant.reduce((total, capture) => total + capture[key], 0) / Math.max(1, relevant.length));
    const lowest = relevant.reduce<PostureNarrativeCapture | undefined>(
      (current, capture) => !current || capture[key] < current[key] ? capture : current,
      undefined,
    );
    return { key, label: postureRegionLabels[key], average, lowest };
  });
  const weakest = [...regions].sort((first, second) => first.average - second.average)[0];
  const weakestScore = weakest.lowest?.[weakest.key] ?? weakest.average;
  const observations = captures.flatMap((capture) => {
    const viewLabel = postureViewLabels[capture.view];
    if (capture.view === "side") {
      return typeof capture.spineShift === "number" && Number.isFinite(capture.spineShift)
        ? [{ viewLabel, line: "gövde hattının dikey çizgiyle hizasında", angle: Math.abs(capture.spineShift) }]
        : [];
    }
    return [
      { viewLabel, line: "omuz hizasında", angle: Math.abs(capture.shoulderTilt ?? Number.NaN) },
      { viewLabel, line: "kalça hizasında", angle: Math.abs(capture.hipTilt ?? Number.NaN) },
    ].filter((item) => Number.isFinite(item.angle));
  });
  const observation = observations.sort((first, second) => second.angle - first.angle)[0];
  const viewSentence = observation ? `${observation.viewLabel[0].toLocaleUpperCase("tr-TR")}${observation.viewLabel.slice(1)} görüntüde` : "Bu çekimde";
  const summary = observation && observation.angle >= 6
    ? `${viewSentence} ${observation.line} fark gözlemlendi. Bu gözlem yalnızca bu çekime aittir.`
    : "Bu çekimde belirgin bir hizalama farkı gözlemlenmedi.";
  const recommendation = observation && observation.angle >= 6
    ? `${viewSentence} görülen hizalama farkını karşılaştırmak için kamerayı ve beden konumunu benzer tutarak yeniden ölçebilirsin.`
    : "Sonraki karşılaştırmada aynı kamera mesafesini ve üç görünümü kullanabilirsin.";
  const trendText = !previous?.captures?.length
    ? "İlk kayıt başlangıç çizgin. Sonraki ölçümde aynı üç açı ve kamera mesafesiyle değişimi karşılaştırabiliriz."
    : (() => {
        const delta = score - previous.score;
        const previousByView = new Map(previous.captures.map((capture) => [capture.view, capture]));
        const changes = captures.flatMap((capture) => {
          const before = previousByView.get(capture.view);
          if (!before) return [];
          return (["shoulderScore", "hipScore", "axisScore"] as const).map((key) => ({
            key,
            view: capture.view,
            delta: capture[key] - before[key],
          }));
        });
        const largestChange = changes.sort((first, second) => Math.abs(second.delta) - Math.abs(first.delta))[0];
        const overall = delta > 0 ? `${delta} puan yükseldi` : delta < 0 ? `${Math.abs(delta)} puan düştü` : "aynı kaldı";
        if (!largestChange || largestChange.delta === 0) return `Genel skor ${overall}; ölçülen üç bölgede belirgin fark yok.`;
        const region = postureRegionLabels[largestChange.key];
        const change = largestChange.delta > 0 ? `+${largestChange.delta}` : `${largestChange.delta}`;
        return `Genel skor ${overall}. En belirgin değişim ${postureViewLabels[largestChange.view]} görünümündeki ${region}: ${change} puan.`;
      })();

  return { recommendation, summary, trendText, weakestRegion: weakest.key, weakestScore, weakestAverage: weakest.average };
}

export function getPostureReportCompositeAnalysis(report: PostureReportAnalysisSource): ReturnType<typeof analyzePosture> {
  const front = report.captures.front.analysis;
  const side = report.captures.side.analysis;
  const back = report.captures.back.analysis;

  return {
    ...front,
    axisScore: Math.round((front.axisScore + side.axisScore + back.axisScore) / 3),
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

export function getPostureOverallScore(analysis: Pick<PostureAnalysisSnapshot, "axisScore" | "shoulderScore" | "hipScore">) {
  const values = [analysis.axisScore, analysis.shoulderScore, analysis.hipScore].filter((value) => value > 0);
  if (!values.length) return 0;

  return Math.round(analysis.axisScore * 0.42 + analysis.shoulderScore * 0.32 + analysis.hipScore * 0.26);
}

export function getPostureMetricList(analysis: ReturnType<typeof analyzePosture>) {
  const postureScore = getPostureOverallScore(analysis);
  const balanceScore = Math.round((analysis.axisScore + analysis.hipScore + analysis.shoulderScore) / 3);

  return [
    { icon: "D", label: "Genel duruş", value: postureScore, measurement: "bileşik skor", confidence: analysis.confidence },
    { icon: "O", label: "Omuz hizası", value: analysis.shoulderScore, measurement: `${Math.abs(analysis.shoulderTilt).toFixed(1)}°`, confidence: analysis.confidence },
    { icon: "S", label: "Omurga hizası", value: analysis.axisScore, measurement: `${Math.abs(analysis.spineShift).toFixed(1)}°`, confidence: analysis.confidence },
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
  const tilt = (value: number) => `${Math.abs(value).toFixed(1)}° ölçüldü`;
  const recommendations = [
    {
      score: analysis.shoulderScore,
      recommendation: analysis.shoulderScore < 80
        ? {
          body: `Omuz hattı ${analysis.shoulderScore}/100; ${tilt(analysis.shoulderTilt)}. Omuzlarını zorlamadan gevşet ve sonraki ölçümde aynı açıdan karşılaştır.`,
          initial: "O",
          title: "Omuzları Rahatlat",
        }
        : {
          body: `Omuz hattı ${analysis.shoulderScore}/100 ve eğim ${tilt(analysis.shoulderTilt)}. Bu rahatlığı koru; sonraki ölçümde omuz seviyelerini yeniden karşılaştır.`,
          initial: "O",
          title: "Omuz Çizgisini Koru",
        },
    },
    {
      score: analysis.hipScore,
      recommendation: analysis.hipScore < 80
        ? {
          body: `Kalça dengesi ${analysis.hipScore}/100; eğim ${tilt(analysis.hipTilt)}. Ağırlığını iki ayağa dağıt ve kamera karşısında aynı ayak yerleşimiyle tekrar ölç.`,
          initial: "A",
          title: "Ağırlık Merkezini Düzenle",
        }
        : {
          body: `Kalça dengesi ${analysis.hipScore}/100; eğim ${tilt(analysis.hipTilt)}. Dizlerini kilitlemeden bu dengeyi sürdür ve sonraki ölçümle kıyasla.`,
          initial: "K",
          title: "Kalça Dengesini Koru",
        },
    },
    {
      score: analysis.axisScore,
      recommendation: view === "side"
        ? {
          body: `Yan görünümde merkez ekseni ${analysis.axisScore}/100; sapma ${tilt(analysis.spineShift)}. Kulak, omuz, kalça ve ayak bileğini aynı hatta getir.`,
          initial: "Y",
          title: "Yan Ekseni Kontrol Et",
        }
        : {
          body: `Merkez ekseni ${analysis.axisScore}/100; ölçülen sapma ${tilt(analysis.spineShift)}. Çeneni rahat bırakıp baş ve gövde hizanı koru.`,
          initial: "E",
          title: "Ekseni Ortala",
        },
    },
  ];

  return recommendations
    .sort((first, second) => first.score - second.score)
    .slice(0, 2)
    .map(({ recommendation }) => recommendation);
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
  const shoulderScore = scoreAngularDeviation(Math.abs(shoulderTilt), 3, 18);
  const hipScore = scoreAngularDeviation(Math.abs(hipTilt), 3, 16);
  const shoulderCenter = getMidpoint(leftShoulder, rightShoulder);
  const hipCenter = getMidpoint(leftHip, rightHip);
  const torsoTilt = shoulderCenter && hipCenter
    ? Math.atan2(shoulderCenter.x - hipCenter.x, hipCenter.y - shoulderCenter.y) * 180 / Math.PI
    : 0;
  const headTilt = nose && shoulderCenter && isVisiblePosePoint(nose)
    ? Math.atan2(nose.x - shoulderCenter.x, shoulderCenter.y - nose.y) * 180 / Math.PI
    : torsoTilt;
  const spineShift = Math.max(-30, Math.min(30, torsoTilt * 0.7 + headTilt * 0.3));
  const axisScore = scoreAngularDeviation(Math.abs(spineShift), 3, 18);
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
  return Math.atan2(right.y - left.y, Math.abs(right.x - left.x)) * 180 / Math.PI;
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
