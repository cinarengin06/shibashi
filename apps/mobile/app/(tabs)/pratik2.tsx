import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
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
import {
  analyzeDynamicMovement,
  analyzeStaticPractice,
  buildShortFlowReferenceFrames,
  getStaticPractice,
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
import { CameraZoomControl } from "../../components/CameraZoomControl";
import { colors } from "../../constants/theme";
import {
  MediaPipePoseBridge,
  MediaPipePoseBridgeRef,
} from "../../services/pose/MediaPipePoseBridge";
import { useApp } from "../../store/AppStore";
import { Feedback, Metrics, PoseMini } from "../../components/practice2/Practice2Support";
import { formatElapsed, toPose } from "../../components/practice2/utils";
import { s } from "../../components/practice2/styles";

const DYNAMIC_PREVIEW_MS = 4500;
const CAPTURE_THRESHOLD = 70,
  CAPTURE_HOLD_MS = 2000;
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
    [cameraZoom, setCameraZoom] = useState(0),
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
    lastMatchedAtRef = useRef(0),
    dynamicAdvanceAllowedRef = useRef(false),
    capturedRef = useRef(false),
    staticAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedPractice = staticPracticeDefinitions[selectedStatic],
    targetPose = staticReferencePoses[selectedPractice.id],
    flow = shortFlowDefinitions[selectedFlow],
    flowDurationMs = DYNAMIC_PREVIEW_MS,
    flowFrames = useMemo(
      () => buildShortFlowReferenceFrames(flow, DYNAMIC_PREVIEW_MS),
      [flow],
    ),
    activeFlowStep = shortFlowStepAt(flow, elapsedMs, flowDurationMs),
    displayReference = staticReferencePoses[activeFlowStep.practiceId];
  elapsedRef.current = elapsedMs;
  modeRef.current = mode;
  useEffect(
    () => () => {
      if (staticAdvanceTimerRef.current)
        clearTimeout(staticAdvanceTimerRef.current);
      void Speech.stop();
    },
    [],
  );
  useEffect(() => {
    if (!running) return;
    const tick = mode === "static" ? 1000 : 80,
      timer = setInterval(
        () =>
          setElapsedMs((value) =>
            mode === "static"
              ? value + 1000
              : dynamicAdvanceAllowedRef.current
                ? Math.min(flowDurationMs, value + 80)
                : value,
          ),
        tick,
      );
    return () => clearInterval(timer);
  }, [flowDurationMs, mode, running]);
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
        const now = Date.now();
        if (score >= CAPTURE_THRESHOLD) lastMatchedAtRef.current = now;
        const matchIsStable =
          score >= CAPTURE_THRESHOLD ||
          (matchedAtRef.current > 0 && now - lastMatchedAtRef.current < 1100);
        if (!isStatic) dynamicAdvanceAllowedRef.current = matchIsStable;
        const readyToCapture =
          isStatic || elapsedRef.current >= flowDurationMs - 120;
        if (matchIsStable && readyToCapture && !capturedRef.current) {
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
              if (isStatic) {
                const hasNext = selectedStatic < staticPracticeDefinitions.length - 1;
                setTimeout(() => {
                  void Speech.stop();
                  void Speech.speak(
                    hasNext
                      ? "Sıradaki akışa geçiyoruz."
                      : "Statik pozlar tamamlandı.",
                    { language: "tr-TR", rate: 0.82, pitch: 0.96 },
                  );
                }, 300);
                if (hasNext) {
                  staticAdvanceTimerRef.current = setTimeout(() => {
                    setSelectedStatic((index) =>
                      Math.min(index + 1, staticPracticeDefinitions.length - 1),
                    );
                    historyRef.current = [];
                    matchedAtRef.current = 0;
                    capturedRef.current = false;
                    setPose([]);
                    setAnalysis(null);
                    setElapsedMs(0);
                    setCaptureState("matching");
                    setHoldProgress(0);
                    setFeedback("Tam bedenini kadrajda tut.");
                    setRunning(true);
                  }, 2300);
                }
              }
            }
          }
        } else if (!capturedRef.current) {
          if (!matchIsStable || readyToCapture) matchedAtRef.current = 0;
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
    if (staticAdvanceTimerRef.current)
      clearTimeout(staticAdvanceTimerRef.current);
    void Speech.stop();
    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) return;
    }
    historyRef.current = [];
    matchedAtRef.current = 0;
    lastMatchedAtRef.current = 0;
    dynamicAdvanceAllowedRef.current = false;
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
    if (staticAdvanceTimerRef.current)
      clearTimeout(staticAdvanceTimerRef.current);
    void Speech.stop();
    setMode(next);
    setStarted(false);
    setRunning(false);
    setElapsedMs(0);
    setAnalysis(null);
    setPose([]);
    setCaptureState("idle");
    setHoldProgress(0);
    matchedAtRef.current = 0;
    lastMatchedAtRef.current = 0;
    dynamicAdvanceAllowedRef.current = false;
    capturedRef.current = false;
    historyRef.current = [];
  };
  const layout = (event: LayoutChangeEvent) =>
    setPreview({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  const leaveStaticCapture = () => {
    if (staticAdvanceTimerRef.current)
      clearTimeout(staticAdvanceTimerRef.current);
    void Speech.stop();
    setStarted(false);
    setRunning(false);
    setElapsedMs(0);
    setAnalysis(null);
    setPose([]);
    setCaptureState("idle");
    setHoldProgress(0);
    matchedAtRef.current = 0;
    lastMatchedAtRef.current = 0;
    dynamicAdvanceAllowedRef.current = false;
    capturedRef.current = false;
    historyRef.current = [];
  };

  if (mode === "static" && started) {
    const score = analysis?.overallScore;
    const holdSeconds = Math.max(1, Math.ceil((100 - holdProgress) / 50));
    return (
      <View style={s.staticLiveRoot}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
          mirror
          active={running}
          zoom={cameraZoom}
          onLayout={layout}
        />
        <CameraZoomControl onChange={setCameraZoom} zoom={cameraZoom} />
        <View pointerEvents="none" style={s.staticLiveShade} />
        <SafeAreaView edges={["top", "bottom"]} style={s.staticLiveOverlay}>
          <View style={s.staticLiveTop}>
            <Pressable onPress={leaveStaticCapture} style={s.staticLiveClose}>
              <Ionicons name="close" color={colors.cream} size={24} />
            </Pressable>
            <View style={s.staticLiveTitleWrap}>
              <Text style={s.staticLiveEyebrow}>STATİK POZ</Text>
              <Text style={s.staticLiveTitle}>{selectedPractice.title}</Text>
            </View>
          </View>

          <View style={s.staticLiveScore}>
            <Text style={[s.staticLiveScoreValue, score !== null && score !== undefined && score >= CAPTURE_THRESHOLD && s.staticLiveScoreReady]}>
              {score === null || score === undefined ? "—" : `${score}%`}
            </Text>
            <Text style={s.staticLiveScoreLabel}>UYUM</Text>
          </View>

          <View style={s.staticLiveReference}>
            <Text style={s.staticLiveReferenceLabel}>BU POZU YAP</Text>
            <ImageBackground
              source={practiceImages[selectedPractice.id]}
              resizeMode="cover"
              style={s.staticLiveReferenceImage}
              imageStyle={s.staticLiveReferenceImageRadius}
            />
            <Text style={s.staticLiveReferenceName}>{selectedPractice.title}</Text>
          </View>

          <View style={[s.staticLiveMessage, captureState === "hold" && s.staticLiveMessageHold, captureState === "saved" && s.staticLiveMessageSaved]}>
            <View style={s.staticLiveMessageIcon}>
              <Ionicons
                name={captureState === "saved" ? "checkmark" : captureState === "hold" ? "camera" : "scan-outline"}
                color={captureState === "saved" || captureState === "hold" ? colors.ink : colors.gold}
                size={21}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.staticLiveMessageTitle}>
                {captureState === "saved"
                  ? "Fotoğraf galerine kaydedildi"
                  : captureState === "hold"
                    ? `${holdSeconds} saniye bekle`
                    : score === null || score === undefined
                      ? "Tam bedeninle kadraja gir"
                      : score >= CAPTURE_THRESHOLD
                        ? "Pozunu koru"
                        : "Referans pozuna yaklaş"}
              </Text>
              <Text style={s.staticLiveMessageText}>
                {captureState === "saved"
                  ? `Skorun %${score ?? 0}. Kayıt tarih ve skoruyla hazır.`
                  : captureState === "hold"
                    ? "Kıpırdama; fotoğraf otomatik çekilecek."
                    : "Yandaki fotoğrafa bak. %70 uyumda çekim kendiliğinden başlar."}
              </Text>
            </View>
            {captureState === "saved" ? (
              <Pressable onPress={leaveStaticCapture} style={s.staticLiveDone}>
                <Text style={s.staticLiveDoneText}>Bitti</Text>
              </Pressable>
            ) : null}
            {captureState === "hold" ? (
              <View style={s.staticLiveHoldTrack}>
                <View style={[s.staticLiveHoldFill, { width: `${holdProgress}%` }]} />
              </View>
            ) : null}
          </View>
        </SafeAreaView>
        <MediaPipePoseBridge ref={bridgeRef} />
      </View>
    );
  }

  if (mode === "static") {
    return (
      <View style={s.root}>
        <SafeAreaView edges={["top"]} style={s.safe}>
          <View style={s.staticSelectHeader}>
            <View>
              <Text style={s.kicker}>STATİK POZ</Text>
              <Text style={s.title}>Bir fotoğraf seç. Aynısını yap.</Text>
            </View>
            <Pressable onPress={() => switchMode("dynamic")} style={s.staticFlowLink}>
              <Text style={s.staticFlowLinkText}>Kısa akışlar</Text>
              <Ionicons name="arrow-forward" color={colors.gold} size={17} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.staticSelectContent} showsVerticalScrollIndicator={false}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.staticPicker}>
              {staticPracticeDefinitions.map((item, index) => (
                <Pressable key={item.id} onPress={() => setSelectedStatic(index)} style={[s.staticCard, index === selectedStatic && s.staticCardActive]}>
                  <ImageBackground source={practiceImages[item.id]} resizeMode="contain" style={s.staticThumb} imageStyle={s.staticThumbImage} />
                  <View style={s.staticCopy}>
                    <Text numberOfLines={1} style={s.staticName}>{String(item.order).padStart(2, "0")} · {item.title}</Text>
                    <Text style={s.staticSub}>{item.englishTitle}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <View style={s.staticHero}>
              <ImageBackground source={practiceImages[selectedPractice.id]} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={s.staticHeroImage} />
              <View style={s.staticHeroShade} />
              <View style={s.staticHeroCopy}>
                <Text style={s.staticHeroLabel}>HEDEF POZ</Text>
                <Text style={s.staticHeroTitle}>{selectedPractice.title}</Text>
                <Text style={s.staticHeroText}>{selectedPractice.shortInstruction}</Text>
              </View>
            </View>
            <View style={s.staticHowItWorks}>
              <Text style={s.staticHowTitle}>Nasıl çalışır?</Text>
              <Text style={s.staticHowText}>Kamera açılır. Referans fotoğraf yanında kalır. Pozun %70’e ulaştığında iki saniye sabit kalırsın; fotoğraf otomatik çekilip galerine kaydedilir.</Text>
            </View>
            <Pressable onPress={begin} style={s.staticStartButton}>
              <Text style={s.staticStartText}>Kamerayı aç ve pozu yap</Text>
              <Ionicons name="camera" color={colors.ink} size={20} />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
        <MediaPipePoseBridge ref={bridgeRef} />
      </View>
    );
  }

  const remainingMode = mode as "static" | "dynamic";
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
              {remainingMode === "static"
                ? `${selectedStatic + 1} / 5`
                : `${selectedFlow + 1} / 5`}
            </Text>
          </View>
        </View>
        <View style={s.segment}>
          <Pressable
            onPress={() => switchMode("static")}
            style={[s.segmentButton, remainingMode === "static" && s.segmentActive]}
          >
            <Text
              style={[s.segmentText, remainingMode === "static" && s.segmentTextActive]}
            >
              1 · Statik Pozlar
            </Text>
          </Pressable>
          <Pressable
            onPress={() => switchMode("dynamic")}
            style={[s.segmentButton, remainingMode === "dynamic" && s.segmentActive]}
          >
            <Text
              style={[s.segmentText, remainingMode === "dynamic" && s.segmentTextActive]}
            >
              2 · Kısa Akışlar
            </Text>
          </Pressable>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.content}
        >
          {remainingMode === "static" ? (
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
                    <>
                    <CameraView
                      ref={cameraRef}
                      style={StyleSheet.absoluteFill}
                      facing="front"
                      mirror
                      active={running}
                      zoom={cameraZoom}
                    />
                    <CameraZoomControl onChange={setCameraZoom} zoom={cameraZoom} />
                    </>
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
                    <PoseMini pose={displayReference} />
                  </View>
                </View>
                <View style={s.userPane} onLayout={layout}>
                  {started ? (
                    <>
                    <CameraView
                      ref={cameraRef}
                      style={StyleSheet.absoluteFill}
                      facing="front"
                      mirror
                      active={running}
                      zoom={cameraZoom}
                    />
                    <CameraZoomControl onChange={setCameraZoom} zoom={cameraZoom} />
                    </>
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
