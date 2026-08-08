import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ImageBackground,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line } from "react-native-svg";
import {
  analyzeDynamicMovement,
  analyzeStaticPractice,
  buildShortFlowReferenceFrames,
  getStaticPractice,
  interpolatePractice2Reference,
  shortFlowDefinitions,
  shortFlowStepAt,
  staticPracticeDefinitions,
  staticReferencePoses,
  type Practice2Analysis,
  type Practice2PosePoint,
  type Practice2PoseSample,
} from "../../../../packages/practice2";
import { toDomainShenId } from "../../../../packages/shen-domain";
import { LivingPoseOverlay } from "../../components/living-learning/LivingPoseOverlay";
import { colors, fonts } from "../../constants/theme";
import {
  MediaPipePoseBridge,
  MediaPipePoseBridgeRef,
  PoseLandmark,
} from "../../services/pose/MediaPipePoseBridge";
import { useApp } from "../../store/AppStore";

const names = [
  "nose",
  "left_eye_inner",
  "left_eye",
  "left_eye_outer",
  "right_eye_inner",
  "right_eye",
  "right_eye_outer",
  "left_ear",
  "right_ear",
  "mouth_left",
  "mouth_right",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_pinky",
  "right_pinky",
  "left_index",
  "right_index",
  "left_thumb",
  "right_thumb",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
  "left_heel",
  "right_heel",
  "left_foot_index",
  "right_foot_index",
];
const links = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
] as const;
const DYNAMIC_PREVIEW_MS = 4500;
const CAPTURE_THRESHOLD = 70,
  CAPTURE_HOLD_MS = 1500;
const practiceImages: Record<string, number> = {
  "qi-shi": require("../../assets/practice2/static/01-qi-shi.png"),
  "push-forward": require("../../assets/practice2/static/02-push-forward.png"),
  "raise-and-open": require("../../assets/practice2/static/03-raise-and-open.png"),
  "bend-and-pull": require("../../assets/practice2/static/04-bend-and-pull.png"),
  "push-clouds": require("../../assets/practice2/static/05-push-clouds.png"),
};

export default function Practice2() {
  const { profile, addSession, addShenActivity } = useApp();
  const [mode, setMode] = useState<"static" | "dynamic">("static"),
    [selectedStatic, setSelectedStatic] = useState(0),
    [selectedFlow, setSelectedFlow] = useState(0),
    [permission, requestPermission] = useCameraPermissions(),
    [started, setStarted] = useState(false),
    [running, setRunning] = useState(false),
    [elapsedMs, setElapsedMs] = useState(0),
    [pose, setPose] = useState<Practice2PosePoint[]>([]),
    [imageSize, setImageSize] = useState({ width: 1, height: 1 }),
    [preview, setPreview] = useState({ width: 1, height: 1 }),
    [analysis, setAnalysis] = useState<Practice2Analysis | null>(null),
    [feedback, setFeedback] = useState(
      "Kamerayı açtığında gerçek ölçüm başlayacak.",
    ),
    [captureState, setCaptureState] = useState<
      "idle" | "matching" | "hold" | "saved"
    >("idle"),
    [holdProgress, setHoldProgress] = useState(0);
  const cameraRef = useRef<CameraView | null>(null),
    bridgeRef = useRef<MediaPipePoseBridgeRef | null>(null),
    historyRef = useRef<Practice2PoseSample[]>([]),
    elapsedRef = useRef(0),
    modeRef = useRef(mode),
    lastPhaseRef = useRef(""),
    matchedAtRef = useRef(0),
    capturedRef = useRef(false);
  const selectedPractice = staticPracticeDefinitions[selectedStatic],
    targetPose = staticReferencePoses[selectedPractice.id],
    flow = shortFlowDefinitions[selectedFlow],
    flowDurationMs = DYNAMIC_PREVIEW_MS,
    flowFrames = useMemo(
      () => buildShortFlowReferenceFrames(flow, DYNAMIC_PREVIEW_MS),
      [flow],
    ),
    activeFlowStep = shortFlowStepAt(flow, elapsedMs, flowDurationMs),
    reference = interpolatePractice2Reference(elapsedMs, flowFrames);
  elapsedRef.current = elapsedMs;
  modeRef.current = mode;
  useEffect(() => {
    if (!running) return;
    const tick = mode === "static" ? 1000 : 80,
      timer = setInterval(
        () =>
          setElapsedMs((value) =>
            mode === "static"
              ? value + 1000
              : Math.min(flowDurationMs, value + 80),
          ),
        tick,
      );
    return () => clearInterval(timer);
  }, [flowDurationMs, mode, running]);
  useEffect(() => {
    if (mode === "dynamic" && elapsedMs >= flowDurationMs) setRunning(false);
  }, [elapsedMs, flowDurationMs, mode]);
  useEffect(() => {
    if (mode === "static" && elapsedMs >= selectedPractice.holdDurationMs)
      setRunning(false);
  }, [elapsedMs, mode, selectedPractice.holdDurationMs]);
  useEffect(() => {
    if (
      mode !== "dynamic" ||
      lastPhaseRef.current === activeFlowStep.practiceId
    )
      return;
    lastPhaseRef.current = activeFlowStep.practiceId;
    if (running) void Haptics.selectionAsync();
  }, [activeFlowStep.practiceId, mode, running]);
  useEffect(() => {
    if (!started || !running || !permission?.granted) return;
    let cancelled = false,
      timer: ReturnType<typeof setTimeout> | undefined;
    const capture = async () => {
      if (cancelled || !cameraRef.current) return;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.42,
          skipProcessing: false,
          shutterSound: false,
        });
        if (!photo?.base64) throw new Error("Kare alınamadı");
        const result = await bridgeRef.current?.analyze(photo.base64);
        if (!result) throw new Error("Model hazırlanıyor");
        if (cancelled) return;
        const nextPose = toPose(result.landmarks),
          sample = {
            timestampMs:
              modeRef.current === "static" ? Date.now() : elapsedRef.current,
            keypoints: nextPose,
          };
        setPose(nextPose);
        setImageSize({ width: result.imageWidth, height: result.imageHeight });
        historyRef.current = [...historyRef.current.slice(-49), sample];
        const next =
          modeRef.current === "static"
            ? analyzeStaticPractice(historyRef.current, sample, targetPose)
            : analyzeDynamicMovement(historyRef.current, sample, flowFrames);
        setAnalysis(next);
        const score = next.overallScore ?? 0,
          isStatic = modeRef.current === "static",
          practiceId = isStatic ? selectedPractice.id : flow.id,
          movementName = isStatic
            ? selectedPractice.title
            : `${flow.title} · Akış`;
        if (score >= CAPTURE_THRESHOLD && !capturedRef.current) {
          const now = Date.now();
          if (!matchedAtRef.current) matchedAtRef.current = now;
          const held = now - matchedAtRef.current;
          setCaptureState("hold");
          setHoldProgress(
            Math.min(100, Math.round((held / CAPTURE_HOLD_MS) * 100)),
          );
          setFeedback(
            `Bekle · ${isStatic ? "pozu" : "akışı"} koru. Fotoğrafın hazırlanıyor.`,
          );
          if (held >= CAPTURE_HOLD_MS) {
            const savedPhoto = await cameraRef.current.takePictureAsync({
              base64: true,
              quality: 0.5,
              skipProcessing: false,
              shutterSound: true,
            });
            if (savedPhoto?.base64) {
              capturedRef.current = true;
              const createdAt = new Date().toISOString();
              addSession({
                id: `practice2-${isStatic ? "pose" : "flow"}-${Date.now()}`,
                practiceId,
                date: createdAt,
                duration: 1,
                postureScore: score,
                balanceScore: score,
                flowScore: score,
                corrections: [
                  next.correction ??
                    next.positive ??
                    `${isStatic ? "Poz" : "Akış"} uyumu tamamlandı.`,
                ],
                imageData: `data:image/jpeg;base64,${savedPhoto.base64}`,
                movementName,
                trainerVisible: false,
                source: "practice2",
              });
              addShenActivity({
                id: `activity-practice2-${Date.now()}`,
                shenId: toDomainShenId(profile.selectedShenId),
                type: "practice",
                createdAt,
                minutes: 1,
                completed: true,
                movementQuality: score,
                practiceId,
              });
              setCaptureState("saved");
              setHoldProgress(100);
              setFeedback(
                `${isStatic ? "Poz" : "Akış"} fotoğrafın tarih ve skoruyla galeriye kaydedildi.`,
              );
              setRunning(false);
              void Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            }
          }
        } else if (!capturedRef.current) {
          matchedAtRef.current = 0;
          setCaptureState("matching");
          setHoldProgress(0);
          setFeedback(
            next.correction ??
              next.positive ??
              `Güzel, ${isStatic ? "pozu" : "akışı"} koru.`,
          );
        } else
          setFeedback(
            next.correction ?? next.positive ?? "Güzel, beden hattını koru.",
          );
      } catch (error) {
        if (!cancelled)
          setFeedback(
            error instanceof Error && error.message.includes("hazır")
              ? "Poz modeli hazırlanıyor…"
              : "Tam bedenin görünür olacak kadar geri çekil.",
          );
      }
      if (!cancelled) timer = setTimeout(() => void capture(), 680);
    };
    timer = setTimeout(() => void capture(), 350);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [flowFrames, permission?.granted, running, started, targetPose]);
  const begin = async () => {
    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) return;
    }
    historyRef.current = [];
    matchedAtRef.current = 0;
    capturedRef.current = false;
    setCaptureState("matching");
    setHoldProgress(0);
    setPose([]);
    setAnalysis(null);
    setElapsedMs(0);
    setFeedback("Tam bedenini kadrajda tut.");
    setStarted(true);
    setRunning(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const switchMode = (next: "static" | "dynamic") => {
    setMode(next);
    setStarted(false);
    setRunning(false);
    setElapsedMs(0);
    setAnalysis(null);
    setPose([]);
    setCaptureState("idle");
    setHoldProgress(0);
    matchedAtRef.current = 0;
    capturedRef.current = false;
    historyRef.current = [];
  };
  const layout = (event: LayoutChangeEvent) =>
    setPreview({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  return (
    <View style={s.root}>
      <SafeAreaView edges={["top"]} style={s.safe}>
        <View style={s.header}>
          <View>
            <Text style={s.kicker}>PRATİK2 · GERÇEK ANALİZ</Text>
            <Text style={s.title}>Pratik Modu</Text>
          </View>
          <View style={s.counter}>
            <Text style={s.counterText}>
              {mode === "static"
                ? `${selectedStatic + 1} / 5`
                : `${selectedFlow + 1} / 5`}
            </Text>
          </View>
        </View>
        <View style={s.segment}>
          <Pressable
            onPress={() => switchMode("static")}
            style={[s.segmentButton, mode === "static" && s.segmentActive]}
          >
            <Text
              style={[s.segmentText, mode === "static" && s.segmentTextActive]}
            >
              1 · Statik Pozlar
            </Text>
          </Pressable>
          <Pressable
            onPress={() => switchMode("dynamic")}
            style={[s.segmentButton, mode === "dynamic" && s.segmentActive]}
          >
            <Text
              style={[s.segmentText, mode === "dynamic" && s.segmentTextActive]}
            >
              2 · Kısa Akışlar
            </Text>
          </Pressable>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.content}
        >
          {mode === "static" ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.staticPicker}
              >
                {staticPracticeDefinitions.map((item, index) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedStatic(index);
                      setStarted(false);
                      setRunning(false);
                      setAnalysis(null);
                      setElapsedMs(0);
                      setCaptureState("idle");
                      setHoldProgress(0);
                      matchedAtRef.current = 0;
                      capturedRef.current = false;
                    }}
                    style={[
                      s.staticCard,
                      index === selectedStatic && s.staticCardActive,
                    ]}
                  >
                    <ImageBackground
                      source={practiceImages[item.id]}
                      resizeMode="contain"
                      style={s.staticThumb}
                      imageStyle={s.staticThumbImage}
                    />
                    <View style={s.staticCopy}>
                      <Text numberOfLines={1} style={s.staticName}>
                        {String(item.order).padStart(2, "0")} · {item.title}
                      </Text>
                      <Text style={s.staticSub}>{item.englishTitle}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={s.moduleHead}>
                <View>
                  <Text style={s.moduleTitle}>{selectedPractice.title}</Text>
                  <Text style={s.moduleNote}>
                    Referans pozu eşleştir · {selectedPractice.cameraView}
                  </Text>
                </View>
                <PoseMini pose={targetPose} />
              </View>
              <View style={s.duoStage}>
                <View style={s.teacherPane}>
                  <ImageBackground
                    source={practiceImages[selectedPractice.id]}
                    resizeMode="cover"
                    style={StyleSheet.absoluteFill}
                    imageStyle={s.duoImage}
                  />
                  <View style={s.duoShade} />
                  <Text style={s.paneLabel}>REFERANS</Text>
                  <View style={s.duoReferencePose}>
                    <PoseMini pose={targetPose} />
                  </View>
                </View>
                <View style={s.userPane} onLayout={layout}>
                  {started ? (
                    <CameraView
                      ref={cameraRef}
                      style={StyleSheet.absoluteFill}
                      facing="front"
                      mirror
                      active={running}
                    />
                  ) : (
                    <View style={s.cameraEmpty}>
                      <Ionicons
                        name="body-outline"
                        size={38}
                        color={colors.gold}
                      />
                      <Text style={s.cameraEmptyTitle}>Sen</Text>
                      <Text style={s.cameraEmptyText}>
                        Tam bedeninle kadraja gir.
                      </Text>
                    </View>
                  )}
                  <View pointerEvents="none" style={s.cameraShade} />
                  {started ? (
                    <LivingPoseOverlay
                      pose={pose}
                      width={preview.width}
                      height={preview.height}
                      imageWidth={imageSize.width}
                      imageHeight={imageSize.height}
                    />
                  ) : null}
                  <Text style={[s.paneLabel, s.userPaneLabel]}>SEN</Text>
                  <View style={s.flowScore}>
                    <Text style={s.scoreValue}>
                      {analysis?.overallScore ?? "—"}
                    </Text>
                    <Text style={s.scoreLabel}>UYUM</Text>
                  </View>
                </View>
                <View style={s.duoCue}>
                  <Text style={s.duoCueLabel}>
                    {captureState === "hold"
                      ? "BEKLE"
                      : captureState === "saved"
                        ? "KAYDEDİLDİ"
                        : "POZU EŞLEŞTİR"}
                  </Text>
                  <Text style={s.duoCueText}>
                    {captureState === "hold"
                      ? "Pozu koru; fotoğrafın hazırlanıyor."
                      : captureState === "saved"
                        ? "Poz fotoğrafın Günlük galerisine eklendi."
                        : selectedPractice.shortInstruction}
                  </Text>
                  {captureState === "hold" ? (
                    <View style={s.holdTrack}>
                      <View
                        style={[s.holdFill, { width: `${holdProgress}%` }]}
                      />
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={s.referenceBottom}>
                <Pressable
                  onPress={() => setRunning((value) => !value)}
                  disabled={!started}
                  style={s.play}
                >
                  <Ionicons
                    name={running ? "pause" : "play"}
                    color="#10140F"
                    size={18}
                  />
                </Pressable>
                <View style={s.referenceTrack}>
                  <View
                    style={[
                      s.referenceFill,
                      {
                        width: `${Math.min(100, (elapsedMs / selectedPractice.holdDurationMs) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={s.referenceTime}>
                  {formatElapsed(elapsedMs)} /{" "}
                  {Math.round(selectedPractice.holdDurationMs / 1000)} sn
                </Text>
              </View>
              <View style={s.breath}>
                <View style={s.breathOrb} />
                <View style={{ flex: 1 }}>
                  <Text style={s.breathLabel}>NEFES</Text>
                  <Text style={s.breathText}>
                    {running
                      ? selectedPractice.breathingCue
                      : selectedPractice.shortInstruction}
                  </Text>
                </View>
              </View>
              <Feedback analysis={analysis} fallback={feedback} />
              <Metrics analysis={analysis} />
              <View style={s.actions}>
                <Pressable
                  onPress={() => setRunning(false)}
                  disabled={!started}
                  style={s.secondary}
                >
                  <Text style={s.secondaryText}>Duruşu bitir</Text>
                </Pressable>
                <Pressable onPress={begin} style={s.primary}>
                  <Text style={s.primaryText}>
                    {started ? "Tekrar dene" : "Kamerayı aç"}
                  </Text>
                  <Ionicons name="camera" size={17} color="#10140F" />
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.flowPicker}
              >
                {shortFlowDefinitions.map((item, index) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedFlow(index);
                      setStarted(false);
                      setRunning(false);
                      setAnalysis(null);
                      setElapsedMs(0);
                      setCaptureState("idle");
                      matchedAtRef.current = 0;
                      capturedRef.current = false;
                    }}
                    style={[
                      s.flowCard,
                      index === selectedFlow && s.flowCardActive,
                    ]}
                  >
                    <Text style={s.flowOrder}>
                      {String(item.order).padStart(2, "0")}
                    </Text>
                    <Text style={s.flowTitle}>{item.title}</Text>
                    <Text style={s.flowMeta}>4,5 sn · canlı eşleştirme</Text>
                    <Text style={s.flowFocus}>{item.focus}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={s.moduleHead}>
                <View>
                  <Text style={s.moduleTitle}>{flow.title}</Text>
                  <Text style={s.moduleNote}>
                    Öğretmeni takip et · {flow.focus}
                  </Text>
                </View>
                <Ionicons
                  name="sparkles-outline"
                  size={25}
                  color={colors.gold}
                />
              </View>
              <View style={s.duoStage}>
                <View style={s.teacherPane}>
                  <ImageBackground
                    key={`${flow.id}-${activeFlowStep.practiceId}`}
                    source={practiceImages[activeFlowStep.practiceId]}
                    resizeMode="cover"
                    style={StyleSheet.absoluteFill}
                    imageStyle={s.duoImage}
                  />
                  <View style={s.duoShade} />
                  <Text style={s.paneLabel}>ÖĞRETMEN</Text>
                  <View style={s.duoReferencePose}>
                    <PoseMini pose={reference.keypoints} />
                  </View>
                </View>
                <View style={s.userPane} onLayout={layout}>
                  {started ? (
                    <CameraView
                      ref={cameraRef}
                      style={StyleSheet.absoluteFill}
                      facing="front"
                      mirror
                      active={running}
                    />
                  ) : (
                    <View style={s.cameraEmpty}>
                      <Ionicons
                        name="body-outline"
                        size={38}
                        color={colors.gold}
                      />
                      <Text style={s.cameraEmptyTitle}>Sen</Text>
                      <Text style={s.cameraEmptyText}>
                        Tam bedeninle kadraja gir.
                      </Text>
                    </View>
                  )}
                  <View pointerEvents="none" style={s.cameraShade} />
                  {started ? (
                    <LivingPoseOverlay
                      pose={pose}
                      width={preview.width}
                      height={preview.height}
                      imageWidth={imageSize.width}
                      imageHeight={imageSize.height}
                    />
                  ) : null}
                  <Text style={[s.paneLabel, s.userPaneLabel]}>SEN</Text>
                  <View style={s.flowScore}>
                    <Text style={s.scoreValue}>
                      {analysis?.overallScore ?? "—"}
                    </Text>
                    <Text style={s.scoreLabel}>UYUM</Text>
                  </View>
                </View>
                <View style={s.duoCue}>
                  <Text style={s.duoCueLabel}>
                    {captureState === "hold"
                      ? "BEKLE"
                      : captureState === "saved"
                        ? "KAYDEDİLDİ"
                        : "ŞİMDİ"}
                  </Text>
                  <Text style={s.duoCueText}>
                    {captureState === "hold"
                      ? "Akışı koru; fotoğrafın hazırlanıyor."
                      : captureState === "saved"
                        ? "Akış fotoğrafın Günlük galerisine eklendi."
                        : activeFlowStep.cue}
                  </Text>
                  {captureState === "hold" ? (
                    <View style={s.holdTrack}>
                      <View
                        style={[s.holdFill, { width: `${holdProgress}%` }]}
                      />
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={s.phases}>
                {flow.steps.map((item, index) => {
                  const active = item.practiceId === activeFlowStep.practiceId;
                  return (
                    <View
                      key={`${flow.id}-${item.practiceId}`}
                      style={[s.phase, active && s.phaseActive]}
                    >
                      <Text style={[s.phaseNo, active && s.phaseNoActive]}>
                        {index + 1}
                      </Text>
                      <Text style={[s.phaseText, active && s.phaseTextActive]}>
                        {getStaticPractice(item.practiceId).title}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={s.referenceBottom}>
                <Pressable
                  onPress={() => setRunning((value) => !value)}
                  disabled={!started}
                  style={s.play}
                >
                  <Ionicons
                    name={running ? "pause" : "play"}
                    color="#10140F"
                    size={18}
                  />
                </Pressable>
                <View style={s.referenceTrack}>
                  <View
                    style={[
                      s.referenceFill,
                      { width: `${(elapsedMs / flowDurationMs) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={s.referenceTime}>
                  {(elapsedMs / 1000).toFixed(1)} / 4,5
                </Text>
              </View>
              <Feedback analysis={analysis} fallback={feedback} />
              <Metrics analysis={analysis} />
              <View style={s.actions}>
                <Pressable
                  onPress={() => setRunning(false)}
                  disabled={!started}
                  style={s.secondary}
                >
                  <Text style={s.secondaryText}>Akışı bitir</Text>
                </Pressable>
                <Pressable onPress={begin} style={s.primary}>
                  <Text style={s.primaryText}>
                    {started ? "Tekrar dene" : "Kamerayı aç"}
                  </Text>
                  <Ionicons name="camera" size={17} color="#10140F" />
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <MediaPipePoseBridge ref={bridgeRef} />
    </View>
  );
}

function Feedback({
  analysis,
  fallback,
}: {
  analysis: Practice2Analysis | null;
  fallback: string;
}) {
  return (
    <View style={s.feedback}>
      <Text style={s.panelTitle}>CANLI GERİ BİLDİRİM</Text>
      {analysis?.correction ? (
        <View style={s.feedbackRow}>
          <Ionicons name="warning-outline" color="#D7A85B" size={17} />
          <Text style={s.correction}>{analysis.correction}</Text>
        </View>
      ) : null}
      {analysis?.positive ? (
        <View style={s.feedbackRow}>
          <Ionicons name="checkmark-circle-outline" color="#A9D977" size={17} />
          <Text style={s.positive}>{analysis.positive}</Text>
        </View>
      ) : null}
      {!analysis ? <Text style={s.fallback}>{fallback}</Text> : null}
    </View>
  );
}
function Metrics({ analysis }: { analysis: Practice2Analysis | null }) {
  return (
    <View style={s.metrics}>
      <Text style={s.panelTitle}>METRİK ANALİZİ</Text>
      {analysis?.metrics.map((item) => (
        <View style={s.metric} key={item.id}>
          <View style={s.metricCopy}>
            <Text style={s.metricName}>{item.label}</Text>
            <Text numberOfLines={1} style={s.metricDetail}>
              {item.detail}
            </Text>
          </View>
          {item.available ? (
            <>
              <View style={s.metricTrack}>
                <View
                  style={[s.metricFill, { width: `${item.value ?? 0}%` }]}
                />
              </View>
              <Text style={s.metricValue}>{item.value}%</Text>
            </>
          ) : (
            <Text style={s.unavailable}>Ölçülemiyor</Text>
          )}
        </View>
      )) ?? (
        <Text style={s.fallback}>
          Kamera ölçümü başladığında yalnızca gerçek metrikler gösterilir.
        </Text>
      )}
    </View>
  );
}
function PoseMini({ pose }: { pose: readonly Practice2PosePoint[] }) {
  const get = (name: string) => pose.find((item) => item.name === name),
    visibleNames = new Set<string>(links.flat());
  return (
    <Svg width={76} height={76} viewBox="0 0 100 100">
      {links.map(([a, b]) => {
        const p1 = get(a),
          p2 = get(b);
        return p1 && p2 ? (
          <Line
            key={`${a}-${b}`}
            x1={p1.x * 100}
            y1={p1.y * 100}
            x2={p2.x * 100}
            y2={p2.y * 100}
            stroke="#FFF0BD"
            strokeWidth={1.65}
          />
        ) : null;
      })}
      {pose
        .filter((item) => visibleNames.has(item.name))
        .map((item) => (
          <Circle
            key={item.name}
            cx={item.x * 100}
            cy={item.y * 100}
            r={2.05}
            fill="#F3CF8B"
            stroke="#FFF0BD"
            strokeWidth={0.3}
          />
        ))}
    </Svg>
  );
}
function toPose(landmarks: PoseLandmark[]): Practice2PosePoint[] {
  return landmarks.map((item, index) => ({
    name: names[index] ?? `point-${index}`,
    x: item.x,
    y: item.y,
    z: item.z,
    score: item.visibility,
  }));
}
function formatElapsed(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0F0C" },
  safe: { flex: 1 },
  header: {
    height: 68,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 17,
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: fonts.displayMedium,
    color: colors.cream,
    fontSize: 27,
    marginTop: 2,
  },
  counter: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(198,165,106,.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: {
    fontFamily: fonts.metricStrong,
    color: colors.gold,
    fontSize: 16,
  },
  segment: {
    marginHorizontal: 18,
    height: 52,
    padding: 4,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(198,165,106,.18)",
    backgroundColor: "#111713",
    flexDirection: "row",
  },
  segmentButton: {
    flex: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: { backgroundColor: colors.gold },
  segmentText: {
    fontFamily: fonts.sansStrong,
    color: colors.muted,
    fontSize: 16,
  },
  segmentTextActive: { color: "#10140F" },
  content: { padding: 18, paddingBottom: 118, gap: 12 },
  staticPicker: { gap: 8, paddingRight: 8 },
  staticCard: {
    width: 178,
    height: 70,
    padding: 7,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(242,238,231,.09)",
    backgroundColor: "#171D19",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  staticCardActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(198,165,106,.14)",
  },
  staticThumb: { width: 54, height: 54 },
  staticThumbImage: { borderRadius: 10 },
  staticCopy: { flex: 1, gap: 4 },
  staticName: {
    fontFamily: fonts.sansStrong,
    color: colors.cream,
    fontSize: 16,
  },
  staticSub: { fontFamily: fonts.sans, color: colors.muted, fontSize: 17 },
  flowPicker: { gap: 8, paddingRight: 8 },
  flowCard: {
    width: 174,
    minHeight: 108,
    padding: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(242,238,231,.09)",
    backgroundColor: "#171D19",
    gap: 4,
  },
  flowCardActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(198,165,106,.14)",
  },
  flowOrder: {
    fontFamily: fonts.metricStrong,
    color: colors.gold,
    fontSize: 16,
  },
  flowTitle: {
    fontFamily: fonts.displayMedium,
    color: colors.cream,
    fontSize: 19,
  },
  flowMeta: { fontFamily: fonts.sans, color: colors.muted, fontSize: 17 },
  flowFocus: {
    fontFamily: fonts.sansMedium,
    color: "#D7BE8B",
    fontSize: 17,
    marginTop: 3,
  },
  storyboard: { flexDirection: "row", gap: 7 },
  storyCard: {
    flex: 1,
    height: 142,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(198,165,106,.16)",
  },
  storyImage: { borderRadius: 16 },
  storyShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,6,.46)",
  },
  storyTime: {
    position: "absolute",
    top: 9,
    right: 9,
    fontFamily: fonts.metricStrong,
    color: colors.gold,
    fontSize: 17,
    backgroundColor: "rgba(10,15,12,.66)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  storyCopy: { position: "absolute", left: 9, right: 7, bottom: 9 },
  storyTitle: {
    fontFamily: fonts.displayMedium,
    color: colors.cream,
    fontSize: 16,
  },
  storyCue: {
    fontFamily: fonts.sans,
    color: "#D6D3CC",
    fontSize: 17,
    marginTop: 2,
  },
  moduleHead: {
    height: 80,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(198,165,106,.18)",
    backgroundColor: "#171D19",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  moduleTitle: {
    fontFamily: fonts.displayMedium,
    color: colors.cream,
    fontSize: 24,
  },
  moduleNote: {
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 16,
    marginTop: 3,
  },
  camera: {
    height: 560,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#151A16",
    borderWidth: 1,
    borderColor: "rgba(198,165,106,.2)",
  },
  placeholderShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,6,.28)",
  },
  cameraEmpty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#171D19",
  },
  cameraEmptyTitle: {
    fontFamily: fonts.displayMedium,
    color: colors.cream,
    fontSize: 23,
  },
  cameraEmptyText: {
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 27,
    textAlign: "center",
    maxWidth: 240,
  },
  cameraShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,6,.12)",
  },
  cameraTop: {
    position: "absolute",
    top: 13,
    left: 13,
    right: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  liveLabel: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 17,
    letterSpacing: 1.4,
    backgroundColor: "rgba(10,15,12,.7)",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 99,
    overflow: "hidden",
  },
  score: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 5,
    borderColor: "#A9D977",
    borderRightColor: colors.gold,
    backgroundColor: "rgba(10,15,12,.76)",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: {
    fontFamily: fonts.metricStrong,
    color: colors.cream,
    fontSize: 23,
  },
  scoreLabel: {
    fontFamily: fonts.sansBold,
    color: colors.muted,
    fontSize: 17,
    letterSpacing: 1,
  },
  cameraBottom: {
    position: "absolute",
    left: 13,
    right: 13,
    bottom: 13,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(10,15,12,.75)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  cameraTime: {
    fontFamily: fonts.metricStrong,
    color: colors.cream,
    fontSize: 16,
  },
  cameraLine: {
    height: 3,
    flex: 1,
    borderRadius: 2,
    backgroundColor: "rgba(242,238,231,.12)",
    overflow: "hidden",
  },
  cameraLineFill: { height: "100%", backgroundColor: "#A9D977" },
  breath: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(198,165,106,.18)",
    backgroundColor: "#171D19",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  breathOrb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.25,
    shadowRadius: 9,
  },
  breathLabel: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 17,
    letterSpacing: 1.3,
  },
  breathText: {
    fontFamily: fonts.sansMedium,
    color: colors.cream,
    fontSize: 17,
    marginTop: 3,
  },
  feedback: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(198,165,106,.16)",
    backgroundColor: "#171D19",
    padding: 15,
    gap: 9,
  },
  panelTitle: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 17,
    letterSpacing: 1.4,
  },
  feedbackRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  correction: {
    fontFamily: fonts.sansMedium,
    color: "#D7C39B",
    fontSize: 16,
    flex: 1,
  },
  positive: {
    fontFamily: fonts.sansMedium,
    color: "#A9D977",
    fontSize: 16,
    flex: 1,
  },
  fallback: {
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 27,
  },
  metrics: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(198,165,106,.16)",
    backgroundColor: "#171D19",
    padding: 15,
    gap: 3,
  },
  metric: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(242,238,231,.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  metricCopy: { flex: 1 },
  metricName: {
    fontFamily: fonts.sansStrong,
    color: colors.cream,
    fontSize: 16,
  },
  metricDetail: {
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 17,
    marginTop: 3,
  },
  metricTrack: {
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(242,238,231,.1)",
    overflow: "hidden",
  },
  metricFill: { height: "100%", backgroundColor: "#A9D977" },
  metricValue: {
    width: 29,
    fontFamily: fonts.metricStrong,
    color: colors.cream,
    fontSize: 17,
  },
  unavailable: { fontFamily: fonts.sans, color: colors.muted, fontSize: 17 },
  actions: { flexDirection: "row", gap: 8 },
  secondary: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(242,238,231,.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontFamily: fonts.sansBold,
    color: colors.cream,
    fontSize: 16,
  },
  primary: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  primaryText: { fontFamily: fonts.sansBold, color: "#10140F", fontSize: 16 },
  duoStage: {
    height: 600,
    borderRadius: 24,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(198,165,106,.3)",
    backgroundColor: "#0B100D",
  },
  teacherPane: {
    width: "46%",
    height: "100%",
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "rgba(198,165,106,.24)",
  },
  userPane: {
    width: "54%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "#171D19",
  },
  duoImage: { borderTopLeftRadius: 24, borderBottomLeftRadius: 24 },
  duoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,6,.2)",
  },
  paneLabel: {
    position: "absolute",
    top: 13,
    left: 11,
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 1.2,
    backgroundColor: "rgba(10,15,12,.75)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 99,
    overflow: "hidden",
  },
  userPaneLabel: { color: "#A9D977" },
  duoReferencePose: {
    position: "absolute",
    left: "50%",
    marginLeft: -38,
    top: "19%",
    transform: [{ scale: 1.75 }],
    shadowColor: "#F3CF8B",
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  flowScore: {
    position: "absolute",
    top: 13,
    right: 10,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: "#A9D977",
    borderRightColor: colors.gold,
    backgroundColor: "rgba(10,15,12,.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  duoCue: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 14,
    minHeight: 78,
    padding: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(169,217,119,.35)",
    backgroundColor: "rgba(8,13,10,.88)",
    gap: 4,
  },
  duoCueLabel: {
    fontFamily: fonts.sansBold,
    color: "#A9D977",
    fontSize: 14,
    letterSpacing: 1.25,
  },
  duoCueText: {
    fontFamily: fonts.sansMedium,
    color: colors.cream,
    fontSize: 16,
    lineHeight: 22,
  },
  holdTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(242,238,231,.12)",
  },
  holdFill: { height: "100%", backgroundColor: "#A9D977" },
  reference: {
    height: 290,
    borderRadius: 22,
    overflow: "hidden",
    padding: 14,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(198,165,106,.28)",
  },
  referenceImage: { borderRadius: 22 },
  referenceShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,6,.28)",
  },
  referenceTop: { flexDirection: "row", justifyContent: "space-between" },
  referenceLabel: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 17,
    letterSpacing: 1.2,
  },
  referencePose: {
    position: "absolute",
    left: "50%",
    marginLeft: -38,
    top: "13%",
    transform: [{ scale: 2.15 }],
    shadowColor: "#F3CF8B",
    shadowOpacity: 0.58,
    shadowRadius: 9,
  },
  referenceBottom: {
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(10,15,12,.75)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  play: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  referenceTrack: {
    height: 3,
    flex: 1,
    borderRadius: 2,
    backgroundColor: "rgba(242,238,231,.14)",
    overflow: "hidden",
  },
  referenceFill: { height: "100%", backgroundColor: colors.gold },
  referenceTime: {
    fontFamily: fonts.metricStrong,
    color: colors.cream,
    fontSize: 16,
  },
  phases: { flexDirection: "row", gap: 5 },
  phase: {
    flex: 1,
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(242,238,231,.1)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  phaseActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(198,165,106,.11)",
  },
  phaseNo: {
    fontFamily: fonts.metricStrong,
    color: colors.muted,
    fontSize: 17,
  },
  phaseNoActive: { color: colors.gold },
  phaseText: {
    fontFamily: fonts.sansMedium,
    color: colors.muted,
    fontSize: 17,
  },
  phaseTextActive: { color: colors.cream },
  phaseBreath: {
    fontFamily: fonts.displayMedium,
    color: colors.cream,
    fontSize: 18,
    textAlign: "center",
    paddingVertical: 4,
  },
});
