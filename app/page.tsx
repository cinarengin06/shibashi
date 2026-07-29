"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LivePose3D } from "@/components/tai-chi/LivePose3D";
import { MovementCoach } from "@/components/tai-chi/MovementCoach";
import { LivingLearningScreen } from "@/components/living-learning/LivingLearningScreen";

type TabId = "home" | "practice" | "posture" | "journey" | "learning" | "journal" | "profile";
type ShenId = "hun" | "shen" | "yi" | "po" | "zhi";
type DeviceMode = "desktop" | "iphone" | "ipad";
type PostureRenderMode = "3d" | "2d";
type PostureView = "front" | "side" | "back";
type PostureAssessmentStep = "intro" | "history" | "captured" | "processing" | PostureView | "result";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type Movement = {
  id: number;
  name: string;
  english: string;
  image: string;
  focus: string;
  cue: string;
};

type WarmupLessonId = "wuji" | "warmup" | "kua";
type PracticeLearningMode = "preparation" | "shibashi";
type PracticeAdaptation = "standing" | "seated" | "gentle";

type WarmupLesson = {
  id: WarmupLessonId;
  order: number;
  title: string;
  shortTitle: string;
  focus: string;
  description: string;
  cameraCue: string;
  breathCue: string;
  videoId: string;
};

type NeijingStage = {
  title: string;
  shenId?: ShenId;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  reward: string;
  depth: number;
  text: string;
  benefits: readonly string[];
  dailyUse: string;
  microPractice: string;
};

type InnerJourneyScene = {
  id: string;
  title: string;
  gate: string;
  bodyHint: string;
  encounter: string;
  ritual: string;
  x: number;
  y: number;
};

type PoseKeypoint = {
  name?: string;
  score?: number;
  x: number;
  y: number;
};

type Pose = {
  keypoints?: PoseKeypoint[];
};

type PoseDetector = {
  dispose?: () => void;
  estimatePoses: (input: HTMLVideoElement, config?: { flipHorizontal?: boolean }) => Promise<Pose[]>;
};

const poseConnections: ReadonlyArray<readonly [string, string]> = [
  ["left_ear", "left_eye"],
  ["left_eye", "nose"],
  ["nose", "right_eye"],
  ["right_eye", "right_ear"],
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
  ["left_wrist", "left_pinky"],
  ["left_wrist", "left_index"],
  ["left_wrist", "left_thumb"],
  ["right_wrist", "right_pinky"],
  ["right_wrist", "right_index"],
  ["right_wrist", "right_thumb"],
  ["left_ankle", "left_heel"],
  ["left_heel", "left_foot_index"],
  ["left_ankle", "left_foot_index"],
  ["right_ankle", "right_heel"],
  ["right_heel", "right_foot_index"],
  ["right_ankle", "right_foot_index"],
];

const mediaPipePoseNames = [
  "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer",
  "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder", "left_elbow",
  "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", "right_index",
  "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle",
  "right_ankle", "left_heel", "right_heel", "left_foot_index", "right_foot_index",
] as const;

const postureDisplayPoints = new Set([
  "nose", "left_ear", "right_ear",
  "left_shoulder", "right_shoulder",
  "left_hip", "right_hip",
  "left_knee", "right_knee",
  "left_ankle", "right_ankle",
]);

type PracticeSnapshot = {
  id: string;
  dateKey: string;
  timeLabel: string;
  createdAt: string;
  movementId: number;
  movementName: string;
  score: number;
  shenName: string;
  imageData: string;
};

type MovementAnalysisWindowState = "idle" | "recording" | "complete";

type MovementAnalysisWindowResult = {
  total: number;
  form: number;
  rhythm: number;
  balance: number;
  samples: number;
};

type PostureAnalysisSnapshot = {
  axisScore: number;
  feedback: string;
  flags: string[];
  hipScore: number;
  hipTilt: number;
  shoulderScore: number;
  shoulderTilt: number;
  spineShift: number;
};

type PostureAssessmentCapture = {
  analysis: PostureAnalysisSnapshot;
  createdAt: string;
  imageData: string;
  view: PostureView;
};

type PostureReport = {
  asymmetrySignal: "düşük" | "orta" | "yüksek";
  captures: Record<PostureView, PostureAssessmentCapture>;
  createdAt: string;
  dateKey: string;
  flags: string[];
  id: string;
  score: number;
  summary: string;
  timeLabel: string;
  trainerVisible?: boolean;
  trendText: string;
};

type AvatarPosePoint = {
  name: string;
  score: number;
  x: number;
  y: number;
};

type AvatarPose = {
  points: Map<string, AvatarPosePoint>;
  visibleCount: number;
};

type EnergyScores = {
  jing: number;
  qi: number;
  shen: number;
};

type CoachCueName = "align" | "calibration" | "ok" | "soft" | "start";

type CoachCueRequest = {
  coach: AiCoach;
  force: boolean;
  name: CoachCueName;
  text: string;
};

const movements: Movement[] = [
  {
    id: 1,
    name: "Açılış Formu",
    english: "Açılış ve hizalanma",
    image: "/images/shibashi/01-acilis-formu.jpg",
    focus: "Duruş",
    cue: "Kollar çabayla değil, nefesin taşıdığı kadar yükselsin.",
  },
  {
    id: 2,
    name: "Bağrını Açmak",
    english: "Göğüs hattını yumuşakça açma",
    image: "/images/shibashi/02-bagrini-acmak.jpg",
    focus: "Nefes",
    cue: "Kaburgaları zorlamadan, göğüs hattını genişlet.",
  },
  {
    id: 3,
    name: "Gökkuşakları ile Dans",
    english: "Yumuşak yan akış",
    image: "/images/shibashi/03-gokkusaklari.jpg",
    focus: "Akış",
    cue: "Ağırlığı yavaş bir dalga gibi taşı.",
  },
  {
    id: 4,
    name: "İçten Dışa",
    english: "Merkezden açılıp merkeze dönme",
    image: "/images/shibashi/04-icten-disa.jpg",
    focus: "Merkez",
    cue: "Daireyi yuvarlak ve sessiz tut.",
  },
  {
    id: 5,
    name: "Maymunu İtekle",
    english: "Merkezden yumuşak itiş",
    image: "/images/shibashi/05-maymunu-itekle.jpg",
    focus: "Denge",
    cue: "İtişi merkezden başlat, omuzları yumuşat.",
  },
  {
    id: 6,
    name: "Kayıkta Kürek Çek",
    english: "Kolları kürek gibi dairesel taşıma",
    image: "/images/shibashi/06-kayikta-kurek.jpg",
    focus: "Koordinasyon",
    cue: "Kollar daire çizerken ağırlığı ayakların arasında sessizce taşı.",
  },
  {
    id: 7,
    name: "Balonla Oyna",
    english: "Topu kaldırma ve merkezi koruma",
    image: "/images/shibashi/07-balonla-oynama.jpg",
    focus: "Merkez",
    cue: "Avuçların arasındaki alanı koru; omuzları yukarı çekme.",
  },
  {
    id: 8,
    name: "Ayı Göğe Gönder",
    english: "Topu göğe taşıma",
    image: "/images/shibashi/08-ayi-goge-gonder.jpg",
    focus: "Uzanma",
    cue: "Kollar yükselirken göğsü sıkıştırmadan omurgayı uzat.",
  },
  {
    id: 9,
    name: "Karnın ile İt",
    english: "Merkezden öne yumuşak itiş",
    image: "/images/shibashi/09-karnin-ile-it.jpg",
    focus: "Dan Tian",
    cue: "Ellerden önce alt karın merkezinin yön değiştirdiğini hisset.",
  },
  {
    id: 10,
    name: "Bulutlarla Dans",
    english: "Bulut elleriyle yan akış",
    image: "/images/shibashi/10-bulut-ile-dans.jpg",
    focus: "Akış",
    cue: "Bakış, bel ve eller aynı sakin dalganın içinde yön değiştirsin.",
  },
  {
    id: 11,
    name: "Okyanustan Suyu Göğe Taşı",
    english: "Aşağıdan yukarı genişleyen akış",
    image: "/images/shibashi/11-okyanustan-suyu-goge-tasi.jpg",
    focus: "Nefes",
    cue: "Aşağı inerken gevşe, yükselirken nefesle birlikte bütün bedeni uzat.",
  },
  {
    id: 12,
    name: "Dalgalarla Oyna",
    english: "Öne ve geriye ağırlık aktarımı",
    image: "/images/shibashi/12-dalgalar-ile-oyna.jpg",
    focus: "Ağırlık",
    cue: "Dizleri kilitlemeden ağırlığı dalga gibi öne ve geriye taşı.",
  },
  {
    id: 13,
    name: "Yaban Kazı Kanatlarını Açıyor",
    english: "Kanatları iki yana açma",
    image: "/images/shibashi/13-yaban-kazi-kanat.jpg",
    focus: "Göğüs",
    cue: "Kollar açılırken kürek kemiklerini sıkıştırmadan göğüste alan bırak.",
  },
  {
    id: 14,
    name: "Yumruklama",
    english: "Merkezden kontrollü yumruk",
    image: "/images/shibashi/14-yumruklama.jpg",
    focus: "Güç",
    cue: "Yumruğu omuzdan değil, ayak ve bel hattından yumuşakça gönder.",
  },
  {
    id: 15,
    name: "Yaban Kazı Yükseliyor",
    english: "Kanatlarla yükselme ve alçalma",
    image: "/images/shibashi/15-yaban-kazi-yukseliyor.jpg",
    focus: "Denge",
    cue: "Yükselirken acele etme; bakışı sabit, ayak tabanını canlı tut.",
  },
  {
    id: 16,
    name: "Değirmeni Döndür",
    english: "Büyük dairesel kol hareketi",
    image: "/images/shibashi/16-degirmeni-dondur.jpg",
    focus: "Daire",
    cue: "Daireyi yalnız kollarla değil, bel ve Kua ile birlikte döndür.",
  },
  {
    id: 17,
    name: "Topu Sektir",
    english: "Ritimli el ve adım koordinasyonu",
    image: "/images/shibashi/17-topu-sektirme.jpg",
    focus: "Ritim",
    cue: "El ve karşı ayağı aynı yumuşak ritimde buluştur.",
  },
  {
    id: 18,
    name: "Kapanış Formu",
    english: "Nefesi ve hareketi merkeze toplama",
    image: "/images/shibashi/18-kapanis.jpg",
    focus: "Bütünleme",
    cue: "Avuçlar alçalırken nefesi doğal bırak ve ağırlığı merkeze topla.",
  },
];

const warmupLessons: readonly WarmupLesson[] = [
  {
    id: "wuji",
    order: 1,
    title: "Wuji: Temel Duruş",
    shortTitle: "Wuji",
    focus: "Hizalanma",
    description: "Baş, omuz, pelvis, diz ve ayak tabanını zorlamadan aynı dikey bütünlükte buluştur.",
    cameraCue: "Baş ve ayaklar kadrajda olsun. Dizleri kilitlemeden iki ayağa eşit yerleş.",
    breathCue: "Nefesi düzeltmeye çalışma; burundan doğal akışını izle.",
    videoId: "9K2yhF0kh1g",
  },
  {
    id: "warmup",
    order: 2,
    title: "Isınma: Eklemleri Aç",
    shortTitle: "Isınma",
    focus: "Hareketlilik",
    description: "Kasları ısıt, eklem çevresini rahatlat ve tendonları ana forma nazikçe hazırla.",
    cameraCue: "Hareket açıklığını zorlamadan videodaki yavaş ritmi takip et.",
    breathCue: "Açılırken nefes al, merkeze dönerken nefes ver.",
    videoId: "WmC0lMoFZnA",
  },
  {
    id: "kua",
    order: 3,
    title: "Pelvis, Kua ve Dan Tian",
    shortTitle: "Kua",
    focus: "Merkez",
    description: "Hareketi belden zorlamak yerine pelvis, kalça kıvrımı ve alt karın merkezinden başlat.",
    cameraCue: "Omuzları sakin tut; yön değişimini kalça ve dizlerle birlikte taşı.",
    breathCue: "Merkez açılırken nefes al, ağırlık yerleşirken nefes ver.",
    videoId: "eem4xQX8mfc",
  },
];

const shibashiFullSetVideoId = "y-S29E23AGE";

const movementReferenceImages: Record<number, string> = {
  1: "/images/shibashi-reference-web/ref-open-gate.jpg",
  2: "/images/shibashi-reference-web/ref-red-arms.jpg",
  3: "/images/shibashi-reference-web/ref-twist.jpg",
  4: "/images/shibashi-reference-web/ref-ball-stance.jpg",
  5: "/images/shibashi-reference-web/ref-push-palms.jpg",
  6: "/images/shibashi-reference/06-kayikta-kurek.jpg",
  7: "/images/shibashi-reference/07-balonla-oynama.jpg",
  8: "/images/shibashi-reference/08-ayi-goge-gonder.jpg",
  9: "/images/shibashi-reference/09-karnin-ile-it.jpg",
  10: "/images/shibashi-reference/10-bulut-ile-dans.jpg",
  11: "/images/shibashi-reference/11-okyanustan-suyu-goge-tasi.jpg",
  12: "/images/shibashi-reference/12-dalgalar-ile-oyna.jpg",
  13: "/images/shibashi-reference/13-yaban-kazi-kanat.jpg",
  14: "/images/shibashi-reference/14-yumruklama.jpg",
  15: "/images/shibashi-reference/15-yaban-kazi-yukseliyor.jpg",
  16: "/images/shibashi-reference/16-degirmeni-dondur.jpg",
  17: "/images/shibashi-reference/17-topu-sektirme.jpg",
  18: "/images/shibashi-reference/18-kapanis.jpg",
};

function getMovementReferenceImage(movement: Movement) {
  return movementReferenceImages[movement.id] ?? movement.image;
}

const warmupReferenceImages: Record<WarmupLessonId, string> = {
  wuji: "/images/shibashi-reference/01-acilis-formu.jpg",
  warmup: "/images/shibashi-reference/02-bagrini-acmak.jpg",
  kua: "/images/shibashi-reference/04-icten-disa.jpg",
};

function getWarmupReferenceImage(lessonId: WarmupLessonId) {
  return warmupReferenceImages[lessonId];
}

function getInnerJourneyScene(movementId: number) {
  const index = Math.min(innerJourneyScenes.length - 1, Math.floor(((movementId - 1) / movements.length) * innerJourneyScenes.length));
  return innerJourneyScenes[index] ?? innerJourneyScenes[0];
}

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "home", label: "Bugün", icon: "◉" },
  { id: "practice", label: "Pratik", icon: "◎" },
  { id: "posture", label: "Postür", icon: "↕" },
  { id: "journey", label: "Bagua", icon: "☯" },
  { id: "learning", label: "Öğren", icon: "✦" },
  { id: "journal", label: "Günlük", icon: "◌" },
  { id: "profile", label: "Profil", icon: "☰" },
];

const coachVoiceVersion = "tr-yelda-20260714";

const fiveShen = [
  {
    id: "hun",
    name: "Hun",
    label: "Vizyon ve akış",
    value: 64,
    note: "Bugün geniş bakış açık.",
    organ: "Karaciğer",
    map: "Gözler, yan beden ve yön duygusu",
    point: { x: 41, y: 49 },
    color: "#b8e986",
    color2: "#315f3a",
    image: "/images/shen-river-hun.jpg",
    music: "/videos/shen-music-hun.mp4",
    tone: 196,
    hero: "Vizyonunu genişlet, hareketi büyüyen ormana bağla.",
    dailyName: "Akış Modu",
    dailyPrompt: "Bugün yeni olasılıkları fark etmeye, yön değiştirmeye ve daha geniş bakmaya hazırsın.",
    recommendation: "Bugün keşif, esneklik, spiral hareket ve uzun vadeli yön duygusu öne çıkıyor.",
    bagua: "Zhen",
    baguaText: "Ağaç • Şimşek • Başlatma",
    task: "Bir karar vermeden önce yönünü tek cümleyle yaz.",
    mapStage: 4,
    mapTitle: "Hun Ormanı",
    world: "Orman, rüzgâr, yeşil ışık ve ejderha sisleri",
    essence: "Vizyon • Akış • Büyüme",
    motif: "orman",
    symbol: "木",
    element: "Ağaç • Karaciğer",
    geometry: "Dallanan • asimetrik • yükselen",
    motion: "Büyüme, rüzgâr, esneme",
    sound: "Yaprak, bambu ve hava",
    language: "Keşifçi, vizyoner, esnek",
  },
  {
    id: "shen",
    name: "Shen",
    label: "Bilinç ve neşe",
    value: 48,
    note: "Sakinleşmeye alan aç.",
    organ: "Kalp",
    map: "Göğüs merkezi, bakış ve temas",
    point: { x: 50, y: 38 },
    color: "#e36a9d",
    color2: "#4a1233",
    image: "/images/shen-river-shen.jpg",
    music: "/videos/shen-music-shen.mp4",
    tone: 256,
    hero: "Kalpteki ışığı aç, neşeyi sakin bilinçle taşı.",
    dailyName: "Açıklık Modu",
    dailyPrompt: "Bugün temas kurmak, yumuşamak ve içindeki canlılığı görünür kılmak daha kolay.",
    recommendation: "Bugün neşe ve açıklık veren sosyal, ritmik ve kalp merkezli görevler öne çıkıyor.",
    bagua: "Li",
    baguaText: "Ateş • Işık • Açıklık",
    task: "Bir konuşmada cevap vermeden önce üç nefes bekle.",
    mapStage: 3,
    mapTitle: "Kalp Tapınağı",
    world: "Gün doğumu, altın/kızıl ışık, tapınaklar ve fenerler",
    essence: "Farkındalık • Neşe • Bilinç",
    motif: "ates",
    symbol: "火",
    element: "Ateş • Kalp",
    geometry: "Dağılan ışık • radyal • organik",
    motion: "Kıvılcım ve yayılma",
    sound: "Sıcak drone ve hafif çıtırtı",
    language: "Canlı, ilişkisel, cesaretlendirici",
  },
  {
    id: "yi",
    name: "Yi",
    label: "Odak ve istikrar",
    value: 72,
    note: "Pratik hedefi net.",
    organ: "Dalak",
    map: "Merkez, karın hattı ve odak",
    point: { x: 50, y: 55 },
    color: "#ff9d38",
    color2: "#783c13",
    image: "/images/shen-river-yi.jpg",
    music: "/videos/shen-music-yi.mp4",
    tone: 220,
    hero: "Merkezini kur, ritmi sade ve kararlı tut.",
    dailyName: "Netlik Modu",
    dailyPrompt: "Bugün dağınık olanı sadeleştirmek, plan yapmak ve bir işi sonuna kadar taşımak için iyi bir gün.",
    recommendation: "Bugün plan, tekrar, öğrenme, seri tamamlama ve istikrarlı rutin öne çıkıyor.",
    bagua: "Kun",
    baguaText: "Dağ • Toprak • Merkez",
    task: "Bugünkü pratiğin niyetini tek kelime seç.",
    mapStage: 2,
    mapTitle: "Yi Toprağı",
    world: "Buğday tarlaları, sıcak toprak ve merkez avlusu",
    essence: "Odak • İstikrar • Düşünce",
    motif: "dag",
    symbol: "土",
    element: "Toprak • Dalak",
    geometry: "Çokgen • nötr • modüler",
    motion: "Düşük hız, sabit ritim",
    sound: "Toprak tonu ve yumuşak vuruş",
    language: "Sade, sıralı, uygulanabilir",
  },
  {
    id: "po",
    name: "Po",
    label: "Beden ve duyum",
    value: 58,
    note: "Omuzlarda çözülme bekliyor.",
    organ: "Akciğer",
    map: "Omuzlar, nefes kapısı ve cilt farkındalığı",
    point: { x: 59, y: 42 },
    color: "#8bcde8",
    color2: "#12374d",
    image: "/images/shen-river-po.jpg",
    music: "/videos/shen-music-po.mp4",
    tone: 174,
    hero: "Bedenin duyumunu dinle, bırakış göl gibi yayılsın.",
    dailyName: "Hafifleme Modu",
    dailyPrompt: "Bugün fazlalığı bırakmak, omuzları yumuşatmak ve bedenden gelen küçük sinyalleri duymak öne çıkıyor.",
    recommendation: "Bugün duyum, bırakma, nefes, somatik farkındalık ve sadeleşme öne çıkıyor.",
    bagua: "Dui",
    baguaText: "Göl • Metal • Bırakma",
    task: "Omuzları yumuşatıp bir dakika sadece nefesi izle.",
    mapStage: 7,
    mapTitle: "Po Gölü",
    world: "Sis, göl, beyaz/gri ışık ve sessiz alanlar",
    essence: "Beden • Bırakma • Duyum",
    motif: "gol",
    symbol: "金",
    element: "Metal • Akciğer",
    geometry: "Keskin • metalik • arıtılmış",
    motion: "Net giriş, net çıkış",
    sound: "Metal rezonansı ve boşluk",
    language: "Kısa, bedensel, doğrudan",
  },
  {
    id: "zhi",
    name: "Zhi",
    label: "Derinlik ve irade",
    value: 69,
    note: "Kısa tekrar yeterli.",
    organ: "Böbrek",
    map: "Bel, dizler, ayak tabanı ve kök",
    point: { x: 50, y: 72 },
    color: "#a986e8",
    color2: "#29194a",
    image: "/images/shen-river-zhi.jpg",
    music: "/videos/shen-music-zhi.mp4",
    tone: 146,
    hero: "Derine köklen, iradeyi sessiz süreklilikle taşı.",
    dailyName: "Dayanıklılık Modu",
    dailyPrompt: "Bugün acele etmeden devam etmek, korkuyu küçültmek ve köklenmek seni güçlendirecek.",
    recommendation: "Bugün sabır, süreklilik, korkuyla temas ve köklenme öne çıkıyor.",
    bagua: "Kan",
    baguaText: "Okyanus • Su • Derinlik",
    task: "Günün zor işini küçük, bitirilebilir bir adıma indir.",
    mapStage: 0,
    mapTitle: "Zhi Okyanusu",
    world: "Derin okyanus, gece mavisi, kaplumbağa ve yıldızlı boşluk",
    essence: "İrade • Derinlik • Güç",
    motif: "okyanus",
    symbol: "水",
    element: "Su • Böbrek",
    geometry: "Akışkan • derin • katmanlı",
    motion: "Gelgit, süzülme, derinleşme",
    sound: "Su altı uğultusu ve damla",
    language: "Az, derin, sakin ve kararlı",
  },
] as const satisfies ReadonlyArray<{
  id: ShenId;
  name: string;
  label: string;
  value: number;
  note: string;
  organ: string;
  map: string;
  point: { x: number; y: number };
  color: string;
  color2: string;
  image: string;
  music: string;
  tone: number;
  hero: string;
  dailyName: string;
  dailyPrompt: string;
  recommendation: string;
  bagua: string;
  baguaText: string;
  task: string;
  mapStage: number;
  mapTitle: string;
  world: string;
  essence: string;
  motif: string;
  symbol: string;
  element: string;
  geometry: string;
  motion: string;
  sound: string;
  language: string;
}>;

const neijingStages: readonly NeijingStage[] = [
  {
    title: "Zhi Okyanusu",
    shenId: "zhi",
    x: 50,
    y: 84,
    labelX: 50,
    labelY: 87,
    reward: "+8 Qi",
    depth: 18,
    text: "Köklenme, korkuyla yüzleşme ve devam etme gücü. Pratik burada ayak tabanı, dizler ve bel hattını sakinleştirir.",
    benefits: ["Ayak tabanı farkındalığı", "Bel hattında güven", "Telaş azalınca devam gücü"],
    dailyUse: "Güne başlamadan, toplantı öncesi ya da içinden kaçma isteği geldiğinde zemini yeniden hatırlatır.",
    microPractice: "İki ayağını yere bastır. Dizleri kilitlemeden yumuşat. Üç nefes boyunca ağırlığını topuktan parmaklara gezdir.",
  },
  {
    title: "Alt Dantian",
    x: 75,
    y: 81,
    labelX: 75,
    labelY: 84,
    reward: "+10 Jing",
    depth: 31,
    text: "Günlük enerjinin toplandığı merkez. Hareketin alt bedenden doğduğunu ve nefesle güçlendiğini gösterir.",
    benefits: ["Enerjiyi toparlama", "Merkezden hareket etme", "Yorgunlukta sakin güç"],
    dailyUse: "İşten sonra dağılan enerjiyi toplamaya, bedeni yeniden merkeze çağırmaya yarar.",
    microPractice: "Avuçlarını alt karna yaklaştır. Nefes alırken alan genişlesin, verirken omuzlar ağırlaşsın.",
  },
  {
    title: "Yi Toprağı",
    shenId: "yi",
    x: 52,
    y: 66,
    labelX: 52,
    labelY: 69,
    reward: "+6 Shen",
    depth: 42,
    text: "Niyet, öğrenme ve tekrar alanı. Burada pratik tek seferlik deneme olmaktan çıkıp alışkanlığa dönüşür.",
    benefits: ["Odaklanma", "Planı bitirme", "Zihinsel dağınıklığı sadeleştirme"],
    dailyUse: "Bir işe başlayamıyorsan ya da aynı anda çok şeye bölündüysen zihni tek çizgiye indirir.",
    microPractice: "Bakışını tek noktaya al. Bir sonraki küçük adımı sessizce söyle. Sonra sadece o adıma başla.",
  },
  {
    title: "Kalp Tapınağı",
    shenId: "shen",
    x: 66,
    y: 50,
    labelX: 66,
    labelY: 53,
    reward: "+12 Shen",
    depth: 56,
    text: "Kalp farkındalığı, açıklık ve yumuşak temas. Göğüs hattı zorlanmadan açılır, bakış sakinleşir.",
    benefits: ["Göğüs açıklığı", "İlişkide yumuşama", "Neşe ve temas hissi"],
    dailyUse: "Bir konuşmaya girmeden önce tonu yumuşatır; savunmaya geçmeden bağlantıda kalmayı destekler.",
    microPractice: "Dirsekleri gevşet. Göğsü zorlamadan genişlet. Nefes verirken yüz kaslarını serbest bırak.",
  },
  {
    title: "Hun Ormanı",
    shenId: "hun",
    x: 31,
    y: 47,
    labelX: 31,
    labelY: 50,
    reward: "+9 Qi",
    depth: 67,
    text: "Yön, vizyon ve akış cesareti. Kolların yolu, bakış yönü ve genişleme hissi bu bölgede öne çıkar.",
    benefits: ["Yön duygusu", "Akışa girme", "Karar sonrası hareket"],
    dailyUse: "Önünü göremediğin anlarda bedene rota hissi verir; küçük ama canlı bir ileri hareket başlatır.",
    microPractice: "Bakışını ufka taşı. Kolları yavaşça yana aç. Nefesle birlikte alanın genişlediğini hisset.",
  },
  {
    title: "12 Katlı Pagoda",
    x: 53,
    y: 32,
    labelX: 53,
    labelY: 35,
    reward: "+7 Qi",
    depth: 78,
    text: "Boğaz geçidi nefesin ve ifadenin daralıp açıldığı yerdir. Hareket dili burada sakinleşir.",
    benefits: ["Nefes ritmi", "Sakin ifade", "Boyun ve çene gevşemesi"],
    dailyUse: "Cevap vermeden önce durmak, ses tonunu yumuşatmak ve bedende sıkışan ifadeyi açmak için iyidir.",
    microPractice: "Çeneyi sıkmadan bırak. Nefesi burundan al. Verirken boynun arkasında uzunluk hissi yarat.",
  },
  {
    title: "Kunlun Zirveleri",
    x: 52,
    y: 10,
    labelX: 52,
    labelY: 13,
    reward: "+15 Shen",
    depth: 92,
    text: "Berraklık, üst merkez ve dönüş kapısı. Haritanın zirvesi bitiş değil, daha sakin bir başlangıçtır.",
    benefits: ["Berrak bakış", "Geniş perspektif", "Daha sakin başlangıç"],
    dailyUse: "Yoğun bir günün sonunda olaylara biraz yukarıdan bakmak ve kendini yeniden hizalamak için açılır.",
    microPractice: "Başın tepesinden yukarı hafif bir ip varmış gibi uzan. Omuzları indirmeyi unutma.",
  },
  {
    title: "Po Gölü",
    shenId: "po",
    x: 26,
    y: 69,
    labelX: 26,
    labelY: 72,
    reward: "+6 Qi",
    depth: 84,
    text: "Nefes, beden hafızası ve bırakma alanı. Omuzlar, göğüs kafesi ve cilt farkındalığı yumuşar.",
    benefits: ["Bırakma becerisi", "Omuzlarda hafifleme", "Bedensel sinyalleri duyma"],
    dailyUse: "Fazlalık taşıdığını hissettiğinde, özellikle omuz ve göğüs çevresindeki gerilimi çözmek için çalışır.",
    microPractice: "Omuzları kulaklara doğru kaldır, sonra bırak. Nefes verirken göğüs kafesinin ağırlaştığını hisset.",
  },
];

const innerJourneyScenes: readonly InnerJourneyScene[] = [
  {
    id: "threshold",
    title: "Eşik Koridoru",
    gate: "Kapı 1",
    bodyHint: "Dışarıdan bakınca yalnızca taş bir yol gibi görünür.",
    encounter: "İki altın çizgi nefesin ritmini taşır; yol henüz sana beden olduğunu söylemez.",
    ritual: "Kameradan önce bu eşiğe gir. İlk form sadece yolu açar.",
    x: 18,
    y: 76,
  },
  {
    id: "breath-river",
    title: "Nefes Nehri",
    gate: "Kapı 2",
    bodyHint: "Zemin yumuşar, içeride akan şeyin nefes olduğunu fark etmeye başlarsın.",
    encounter: "Işıklı su hattı göğüs ve karın arasında genişleyip daralır.",
    ritual: "Hareketi büyütmeden önce nefesi büyüt.",
    x: 34,
    y: 64,
  },
  {
    id: "shoulder-arch",
    title: "Omuz Kemerleri",
    gate: "Kapı 3",
    bodyHint: "Tavan kemerleri omuzların eski yüklerini tutan geçitlere dönüşür.",
    encounter: "Kemerlerden geçen ışık, kolların çabayla değil taşıma hissiyle yükselmesini ister.",
    ritual: "Omuzları kaldırmadan kolu kaldır.",
    x: 48,
    y: 53,
  },
  {
    id: "heart-temple",
    title: "Kalp Holü",
    gate: "Kapı 4",
    bodyHint: "Uzakta görünen tapınak artık merkezdeki sıcak alan gibi hissedilir.",
    encounter: "Kapının ardında açıklık, bakış ve yumuşak temas aynı ışıkta toplanır.",
    ritual: "Göğsü zorlamadan alan aç.",
    x: 58,
    y: 43,
  },
  {
    id: "spine-river",
    title: "Omurga Nehri",
    gate: "Kapı 5",
    bodyHint: "Yol yukarı kıvrılır; bunun bir patika değil, iç eksen olduğunu anlarsın.",
    encounter: "Sarmal çizgi ayaktan başa kadar merkezi takip eder.",
    ritual: "Dikleşme çabası değil, eksene dönme hissi.",
    x: 52,
    y: 32,
  },
  {
    id: "mind-lanterns",
    title: "Zihin Fenerleri",
    gate: "Kapı 6",
    bodyHint: "Dağınık ışıklar tek tek hizaya gelir.",
    encounter: "Her fener bir dikkat düğümünü çözer; hareketin sırası netleşir.",
    ritual: "Bir sonraki küçük hareketi seç ve sadece onu tamamla.",
    x: 60,
    y: 24,
  },
  {
    id: "crown-stairs",
    title: "Taç Merdiveni",
    gate: "Kapı 7",
    bodyHint: "Yol artık yukarı değil, içeride derine doğru ilerler.",
    encounter: "Yukarıdaki ışık başın üzerinde değil; sakinleşen bakışın içinde belirir.",
    ritual: "Bakışı sertleştirmeden yön ver.",
    x: 48,
    y: 16,
  },
  {
    id: "inner-sky",
    title: "İç Gökyüzü",
    gate: "Kapı 8",
    bodyHint: "Son kapıda haritanın bedenin içinde yürüyen bir yol olduğu açığa çıkar.",
    encounter: "Nefes, omurga, bakış ve adım tek sahnede birleşir.",
    ritual: "Pratik bittiğinde bir dakika sessiz kal; yolun izini taşı.",
    x: 50,
    y: 8,
  },
];

const aiCoaches = [
  {
    id: "he",
    imageIndex: 0,
    name: "He Xiangu",
    role: "Yumuşak güç ve içsel zarafet",
    shenId: "shen",
    rate: 0.82,
    pitch: 1.13,
    detune: 70,
    filterFrequency: 1450,
    filterGain: 2.4,
    cadenceMs: 15200,
    styleLead: "Yumuşakça.",
    styleClose: "Zarafeti koru.",
  },
  {
    id: "han",
    imageIndex: 1,
    name: "Han Xiangzi",
    role: "Nefes, müzik ve yaratıcı akış",
    shenId: "hun",
    rate: 0.84,
    pitch: 1.06,
    detune: 35,
    filterFrequency: 1180,
    filterGain: 1.4,
    cadenceMs: 14500,
    styleLead: "Nefesi dinle.",
    styleClose: "Akışın sesi yumuşak kalsın.",
  },
  {
    id: "li",
    imageIndex: 2,
    name: "Li Tieguai",
    role: "Dayanıklılık ve şefkatli disiplin",
    shenId: "zhi",
    rate: 0.76,
    pitch: 0.86,
    detune: -120,
    filterFrequency: 760,
    filterGain: 3.2,
    cadenceMs: 16800,
    styleLead: "Sabit kal.",
    styleClose: "Gücünü yere indir.",
  },
  {
    id: "lu",
    imageIndex: 3,
    name: "Lü Dongbin",
    role: "Keskin farkındalık ve ustalık",
    shenId: "po",
    rate: 0.8,
    pitch: 0.98,
    detune: -30,
    filterFrequency: 980,
    filterGain: 2,
    cadenceMs: 15000,
    styleLead: "Net gör.",
    styleClose: "Fazlayı bırak.",
  },
  {
    id: "zhang",
    imageIndex: 4,
    name: "Zhang Guolao",
    role: "Ters bakış ve alışkanlık kırma",
    shenId: "yi",
    rate: 0.74,
    pitch: 0.92,
    detune: -80,
    filterFrequency: 690,
    filterGain: 2.6,
    cadenceMs: 17600,
    styleLead: "Aceleyi tersine çevir.",
    styleClose: "Beklenmeyen yolu seç.",
  },
  {
    id: "lan",
    imageIndex: 5,
    name: "Lan Caihe",
    role: "Özgürlük, oyun ve akış",
    shenId: "hun",
    rate: 0.88,
    pitch: 1.16,
    detune: 105,
    filterFrequency: 1680,
    filterGain: 2.8,
    cadenceMs: 13800,
    styleLead: "Hafifle.",
    styleClose: "Hareket biraz oyun gibi kalsın.",
  },
  {
    id: "cao",
    imageIndex: 6,
    name: "Cao Guojiu",
    role: "Ölçü, etik ve güvenilir yapı",
    shenId: "yi",
    rate: 0.78,
    pitch: 0.94,
    detune: -45,
    filterFrequency: 900,
    filterGain: 1.8,
    cadenceMs: 16200,
    styleLead: "Ölçüyü koru.",
    styleClose: "Form temiz kalsın.",
  },
  {
    id: "zhongli",
    imageIndex: 7,
    name: "Zhongli Quan",
    role: "Sıcak otorite ve dönüşüm",
    shenId: "shen",
    rate: 0.78,
    pitch: 0.88,
    detune: -95,
    filterFrequency: 820,
    filterGain: 3,
    cadenceMs: 15800,
    styleLead: "Sakin güç.",
    styleClose: "Ateşi içeride taşı.",
  },
] as const satisfies ReadonlyArray<{
  cadenceMs: number;
  detune: number;
  filterFrequency: number;
  filterGain: number;
  id: string;
  imageIndex: number;
  name: string;
  pitch: number;
  rate: number;
  role: string;
  shenId: ShenId;
  styleClose: string;
  styleLead: string;
}>;

type AiCoach = (typeof aiCoaches)[number];

export default function RitimKapisiOS() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [introVisible, setIntroVisible] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [userName, setUserName] = useState("");
  const [selectedShenId, setSelectedShenId] = useState<ShenId>("shen");
  const [selectedCoachId, setSelectedCoachId] = useState<AiCoach["id"]>("he");
  const [soundState, setSoundState] = useState<"kapalı" | "açık">("kapalı");
  const [selectedMovement, setSelectedMovement] = useState(0);
  const [practicePhase, setPracticePhase] = useState<"ready" | "calibrate" | "live" | "complete">("ready");
  const [practiceGallery, setPracticeGallery] = useState<PracticeSnapshot[]>([]);
  const [postureReports, setPostureReports] = useState<PostureReport[]>([]);
  const audioRef = useRef<{
    context: AudioContext;
    gain: GainNode;
    sources: AudioScheduledSourceNode[];
  } | null>(null);
  const mediaAudioRef = useRef<HTMLAudioElement | null>(null);
  const mobileFrameRef = useRef<HTMLDivElement | null>(null);
  const movement = movements[selectedMovement];
  const selectedShen = fiveShen.find((shen) => shen.id === selectedShenId) ?? fiveShen[1];
  const selectedCoach = aiCoaches.find((coach) => coach.id === selectedCoachId) ?? aiCoaches[0];
  const completion = useMemo(() => Math.round(((selectedMovement + 1) / 18) * 100), [selectedMovement]);
  const journalUnlocked = practiceGallery.length > 0;
  const journeyUnlocked = practiceGallery.length >= 3 || postureReports.length > 0;
  const visibleTabs = tabs.filter((tab) => tab.id !== "journal" || journalUnlocked).filter((tab) => tab.id !== "journey" || journeyUnlocked);
  const energyScores = useMemo(
    () => getEnergyScores({
      completion,
      practiceGallery,
      postureReports,
      selectedShen,
    }),
    [completion, practiceGallery, postureReports, selectedShen],
  );

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    // Başlangıç rehberi her yeni sayfa açılışında gösterilir.
    window.localStorage.removeItem("ritim-kapisi-onboarding-complete");
    setOnboardingComplete(false);
    const savedUserName = window.localStorage.getItem("ritim-kapisi-user-name");
    if (savedUserName) setUserName(savedUserName);
    const savedShenId = window.localStorage.getItem("ritim-kapisi-selected-shen") as ShenId | null;
    if (savedShenId && fiveShen.some((shen) => shen.id === savedShenId)) {
      setSelectedShenId(savedShenId);
    }
    const savedCoachId = window.localStorage.getItem("ritim-kapisi-selected-coach") as AiCoach["id"] | null;
    if (savedCoachId && aiCoaches.some((coach) => coach.id === savedCoachId)) {
      setSelectedCoachId(savedCoachId);
    }
    const savedGallery = window.localStorage.getItem("ritim-kapisi-practice-gallery");
    if (savedGallery) {
      try {
        setPracticeGallery(JSON.parse(savedGallery) as PracticeSnapshot[]);
      } catch {
        window.localStorage.removeItem("ritim-kapisi-practice-gallery");
      }
    }
    const savedPostureReports = window.localStorage.getItem("ritim-kapisi-posture-reports");
    if (savedPostureReports) {
      try {
        setPostureReports(JSON.parse(savedPostureReports) as PostureReport[]);
      } catch {
        window.localStorage.removeItem("ritim-kapisi-posture-reports");
      }
    }
    void loadPostureReportsFromIndexedDb().then((storedReports) => {
      if (!storedReports.length) return;
      setPostureReports((current) => mergePostureReports(storedReports, current));
    });

    return () => {
      mediaAudioRef.current?.pause();
      audioRef.current?.sources.forEach((source) => {
        try {
          source.stop();
        } catch {
          // The source may already be stopped while switching Shen tracks.
        }
      });
      audioRef.current?.context.close();
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    mobileFrameRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab, deviceMode, onboardingComplete]);

  function savePracticeSnapshot(snapshot: PracticeSnapshot) {
    setPracticeGallery((current) => {
      const nextGallery = [snapshot, ...current].slice(0, 24);
      try {
        window.localStorage.setItem("ritim-kapisi-practice-gallery", JSON.stringify(nextGallery));
      } catch {
        try {
          window.localStorage.setItem("ritim-kapisi-practice-gallery", JSON.stringify(nextGallery.slice(0, 8)));
        } catch {
          return nextGallery.slice(0, 8);
        }
      }
      return nextGallery;
    });
  }

  function savePostureReport(report: PostureReport) {
    void savePostureReportToIndexedDb(report);
    setPostureReports((current) => {
      const nextReports = [report, ...current].slice(0, 18);
      try {
        window.localStorage.setItem("ritim-kapisi-posture-reports", JSON.stringify(nextReports));
      } catch {
        try {
          window.localStorage.setItem("ritim-kapisi-posture-reports", JSON.stringify(nextReports.slice(0, 8)));
        } catch {
          return nextReports.slice(0, 8);
        }
      }
      return nextReports;
    });
  }

  function deletePostureReport(reportId: string) {
    setPostureReports((current) => {
      const nextReports = current.filter((report) => report.id !== reportId);
      persistPostureReportsToLocalStorage(nextReports);
      return nextReports;
    });
    void deletePostureReportFromIndexedDb(reportId);
  }

  function setPostureReportTrainerVisibility(reportId: string, trainerVisible: boolean) {
    setPostureReports((current) => {
      const nextReports = current.map((report) => report.id === reportId ? { ...report, trainerVisible } : report);
      const updatedReport = nextReports.find((report) => report.id === reportId);
      if (updatedReport) void savePostureReportToIndexedDb(updatedReport);
      persistPostureReportsToLocalStorage(nextReports);
      return nextReports;
    });
  }

  function selectShen(shenId: ShenId) {
    setSelectedShenId(shenId);
    if ("vibrate" in navigator) navigator.vibrate(12);
    window.localStorage.setItem("ritim-kapisi-selected-shen", shenId);
    const nextShen = fiveShen.find((shen) => shen.id === shenId);
    if (soundState === "açık" && nextShen) {
      void startShenMusic(nextShen);
    }
  }

  function selectCoach(coachId: AiCoach["id"]) {
    const coach = aiCoaches.find((item) => item.id === coachId);
    if (!coach) return;

    setSelectedCoachId(coach.id);
    window.localStorage.setItem("ritim-kapisi-selected-coach", coach.id);
  }

  function stopShenMusic() {
    mediaAudioRef.current?.pause();
    stopGeneratedShenMusic();
    setSoundState("kapalı");
  }

  function playSelectedShenMusic() {
    void startShenMusic(selectedShen);
  }

  function completeOnboarding() {
    const trimmedName = userName.trim();
    if (trimmedName) window.localStorage.setItem("ritim-kapisi-user-name", trimmedName);
    // Tamamlandığında mevcut oturumda uygulamaya geç; sayfa yeniden
    // açıldığında rehber tekrar başlar.
    setOnboardingComplete(true);
    setActiveTab("home");
  }

  function restartOnboarding() {
    window.localStorage.removeItem("ritim-kapisi-onboarding-complete");
    setIntroVisible(true);
    setOnboardingComplete(false);
    setActiveTab("home");
  }

  async function startShenMusic(shen: (typeof fiveShen)[number]): Promise<boolean> {
    stopGeneratedShenMusic();
    const audio = mediaAudioRef.current ?? new Audio();
    mediaAudioRef.current = audio;

    audio.loop = true;
    audio.muted = false;
    audio.preload = "auto";
    audio.volume = 0.46;

    if (!audio.src.endsWith(shen.music)) {
      audio.pause();
      audio.src = shen.music;
      audio.currentTime = 0;
    }

    try {
      await audio.play();
      setSoundState("açık");
      return true;
    } catch {
      try {
        const generatedStarted = await startGeneratedShenMusic(shen);
        setSoundState(generatedStarted ? "açık" : "kapalı");
        return generatedStarted;
      } catch {
        setSoundState("kapalı");
        return false;
      }
    }
  }

  function stopGeneratedShenMusic() {
    audioRef.current?.sources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // The source may already be stopped while switching Shen tracks.
      }
    });
    audioRef.current?.context.close();
    audioRef.current = null;
  }

  async function startGeneratedShenMusic(shen: (typeof fiveShen)[number]): Promise<boolean> {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    const context = new AudioContextClass();
    if (context.state === "suspended") {
      await context.resume().catch(() => undefined);
    }
    if (context.state !== "running") {
      await context.close().catch(() => undefined);
      return false;
    }
    const masterGain = context.createGain();
    const now = context.currentTime;
    const config = getShenSoundConfig(shen.id);
    const sources: AudioScheduledSourceNode[] = [];

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(config.volume, now + 1.4);
    masterGain.connect(context.destination);

    config.layers.forEach((layer, index) => {
      const oscillator = context.createOscillator();
      const layerGain = context.createGain();
      const filter = context.createBiquadFilter();
      const pan = context.createStereoPanner();
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();

      oscillator.type = layer.wave;
      oscillator.frequency.value = shen.tone * layer.ratio;
      oscillator.detune.value = layer.detune ?? 0;
      filter.type = layer.filterType;
      filter.frequency.value = layer.filter;
      filter.Q.value = layer.q;
      pan.pan.value = layer.pan;
      layerGain.gain.setValueAtTime(layer.gain, now);

      lfo.type = "sine";
      lfo.frequency.value = config.swellRate * (1 + index * 0.18);
      lfoGain.gain.value = layer.gain * config.swellDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(layerGain.gain);

      oscillator.connect(filter);
      filter.connect(layerGain);
      layerGain.connect(pan);
      pan.connect(masterGain);
      oscillator.start(now);
      lfo.start(now);
      sources.push(oscillator, lfo);
    });

    if (config.noise > 0) {
      const noise = createNoiseSource(context);
      const noiseFilter = context.createBiquadFilter();
      const noiseGain = context.createGain();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = config.noiseFrequency;
      noiseFilter.Q.value = config.noiseQ;
      noiseGain.gain.setValueAtTime(config.noise, now);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      sources.push(noise);
    }

    audioRef.current = { context, gain: masterGain, sources };
    return true;
  }

  return (
    <main
      className={`app-shell shen-theme-${selectedShen.id} device-mode-${deviceMode} ${deviceMode === "iphone" ? "phone-mode" : ""} ${deviceMode === "ipad" ? "tablet-mode" : ""}`}
      data-shen={selectedShen.id}
      style={{ "--shen-accent": selectedShen.color, "--shen-accent-2": selectedShen.color2 } as CSSProperties}
    >
      <div className="ambient-field">
        <div className="ambient-line" />
      </div>
      <AmbientParticles selectedShenId={selectedShen.id} />
      <DevicePreviewDock deviceMode={deviceMode} onChange={setDeviceMode} />
      {introVisible ? (
        <IntroSplash
          onClose={() => setIntroVisible(false)}
          deviceMode={deviceMode}
        />
      ) : null}
      <div className={`device-shell ${onboardingComplete ? "" : "onboarding-device-shell"}`}>
        <div className="mobile-frame" ref={mobileFrameRef}>
          <div className="phone-hardware">
            <div className="phone-speaker" />
            <span className="phone-camera" />
          </div>
        {!onboardingComplete ? (
          <OnboardingScreen
            onFinish={completeOnboarding}
            onSelectShen={selectShen}
            onUserNameChange={setUserName}
            selectedShen={selectedShen}
            selectedShenId={selectedShenId}
            userName={userName}
          />
        ) : null}
        {onboardingComplete && activeTab === "home" ? (
          <HomeScreen
            energyScores={energyScores}
            journeyUnlocked={journeyUnlocked}
            onJourney={() => setActiveTab("journey")}
            onPractice={() => setActiveTab("practice")}
            onPosture={() => setActiveTab("posture")}
            onSelectShen={selectShen}
            practiceCount={practiceGallery.length}
            postureCount={postureReports.length}
            selectedShen={selectedShen}
            userName={userName}
          />
        ) : null}
        {onboardingComplete && activeTab === "practice" ? (
          <PracticeScreen
            completion={completion}
            movement={movement}
            musicState={soundState}
            phase={practicePhase}
            selectedCoach={selectedCoach}
            selectedShen={selectedShen}
            onNext={() => {
              setSelectedMovement((current) => (current + 1) % movements.length);
              setPracticePhase("calibrate");
            }}
            onSelectMovement={(movementId) => {
              setSelectedMovement(Math.max(0, Math.min(movements.length - 1, movementId - 1)));
              setPracticePhase("calibrate");
            }}
            onPlayMusic={playSelectedShenMusic}
            onPostureReportCaptured={savePostureReport}
            onSnapshotCaptured={savePracticeSnapshot}
            onStopMusic={stopShenMusic}
            onStart={() => setPracticePhase(practicePhase === "ready" ? "calibrate" : "live")}
            onComplete={() => setPracticePhase("complete")}
            latestPostureReport={postureReports[0]}
          />
        ) : null}
        {onboardingComplete && activeTab === "posture" ? (
          <PostureScreen
            onDeletePostureReport={deletePostureReport}
            latestPostureReport={postureReports[0]}
            onPostureReportCaptured={savePostureReport}
            onSetTrainerVisibility={setPostureReportTrainerVisibility}
            onStopMusic={stopShenMusic}
            postureReports={postureReports}
            selectedShen={selectedShen}
          />
        ) : null}
        {onboardingComplete && activeTab === "journey" ? (
          <JourneyScreen
            onNavigate={setActiveTab}
            onSelectCoach={selectCoach}
            postureCount={postureReports.length}
            practiceCount={practiceGallery.length}
            selectedCoachId={selectedCoachId}
            selectedShen={selectedShen}
            userName={userName}
          />
        ) : null}
        {onboardingComplete && activeTab === "learning" ? <LivingLearningScreen embedded /> : null}
        {onboardingComplete && activeTab === "journal" ? (
          <JournalScreen
            gallery={practiceGallery}
            postureReports={postureReports}
            selectedShen={selectedShen}
          />
        ) : null}
        {onboardingComplete && activeTab === "profile" ? (
          <ProfileScreen
            musicState={soundState}
            onRestartOnboarding={restartOnboarding}
            onSelectShen={selectShen}
            onToggleMusic={soundState === "açık" ? stopShenMusic : playSelectedShenMusic}
            postureReports={postureReports}
            selectedShen={selectedShen}
            selectedShenId={selectedShenId}
            userName={userName}
          />
        ) : null}
        </div>

        {onboardingComplete ? (
          <nav className="bottom-nav" aria-label="Ana gezinme" style={{ "--nav-count": visibleTabs.length + 1 } as CSSProperties}>
            {visibleTabs.map((tab) => (
              <button
                className={`nav-button ${activeTab === tab.id ? "nav-button-active" : ""}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <strong>{tab.icon}</strong>
                {tab.label}
              </button>
            ))}
          </nav>
        ) : null}
      </div>
    </main>
  );
}

function DevicePreviewDock({
  deviceMode,
  onChange,
}: {
  deviceMode: DeviceMode;
  onChange: (mode: DeviceMode) => void;
}) {
  const modes: ReadonlyArray<{ id: DeviceMode; icon: string; label: string }> = [
    { id: "desktop", icon: "▱", label: "Ekran" },
    { id: "iphone", icon: "▯", label: "iPhone 17 Pro" },
    { id: "ipad", icon: "▭", label: "iPad Pro" },
  ];

  return (
    <div className="device-preview-dock" aria-label="Cihaz önizlemesi">
      {modes.map((mode) => (
        <button
          aria-pressed={deviceMode === mode.id}
          className={deviceMode === mode.id ? "device-preview-active" : ""}
          key={mode.id}
          onClick={() => onChange(mode.id)}
          type="button"
        >
          <span>{mode.icon}</span>
          <small>{mode.label}</small>
        </button>
      ))}
    </div>
  );
}

function IntroSplash({
  deviceMode,
  onClose,
}: {
  deviceMode: DeviceMode;
  onClose: () => void;
}) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => setIsClosing(true), 3200);
    const finishTimer = window.setTimeout(onClose, 3700);
    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onClose]);

  function closeSplash() {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(onClose, 420);
  }

  return (
    <div
      aria-label="Shibashi Efe açılış ekranı"
      className={`intro-gate intro-gate-${deviceMode} intro-splash ${isClosing ? "intro-splash-closing" : ""}`}
      role="dialog"
    >
      <div className="intro-device-frame">
        <div className="intro-phone-speaker" />
        <img
          alt="Shibashi Efe — İçsel Yolculuk"
          className="intro-splash-image"
          src="/images/shibashi/shibashi-splash.png"
        />
        <button aria-label="Açılışı geç" className="intro-splash-skip" onClick={closeSplash} type="button">
          <span>Dokun ve başla</span>
          <i aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function OnboardingScreen({
  onFinish,
  onSelectShen,
  onUserNameChange,
  selectedShen,
  selectedShenId,
  userName,
}: {
  onFinish: () => void;
  onSelectShen: (shen: ShenId) => void;
  onUserNameChange: (name: string) => void;
  selectedShen: (typeof fiveShen)[number];
  selectedShenId: ShenId;
  userName: string;
}) {
  const onboardingRef = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(0);
  const [modeChoiceOpen, setModeChoiceOpen] = useState(false);
  const [modeQuizOpen, setModeQuizOpen] = useState(false);
  const [modeQuizQuestion, setModeQuizQuestion] = useState(0);
  const [modeQuizAnswers, setModeQuizAnswers] = useState<ShenId[]>([]);
  const [modeQuizResult, setModeQuizResult] = useState<ShenId | null>(null);
  const [nameError, setNameError] = useState("");
  const modeQuestions: ReadonlyArray<{
    prompt: string;
    options: ReadonlyArray<{ label: string; shenId: ShenId }>;
  }> = [
    {
      prompt: "Şu an sende hangisi baskın?",
      options: [
        { label: "Omuzlarım sıkışık.", shenId: "po" },
        { label: "Zihnim dağınık.", shenId: "yi" },
        { label: "Enerjim düşük.", shenId: "zhi" },
      ],
    },
    {
      prompt: "Bugün neye ihtiyacın var?",
      options: [
        { label: "Yön bulmaya.", shenId: "hun" },
        { label: "Canlanmaya.", shenId: "shen" },
        { label: "Odaklanmaya.", shenId: "yi" },
      ],
    },
    {
      prompt: "Pratikten sonra nasıl hissetmek istersin?",
      options: [
        { label: "Hafiflemiş.", shenId: "po" },
        { label: "Daha dayanıklı.", shenId: "zhi" },
        { label: "Akışta.", shenId: "hun" },
      ],
    },
  ];
  const shenModePrompt: Record<ShenId, { title: string; body: string }> = {
    hun: {
      title: "Bugün hayatında nerede akışa geçelim?",
      body: "Bir şeyi başlatmak, yönünü bulmak ya da zihnindeki fikre hareket vermek için bugünün kapısını seç.",
    },
    shen: {
      title: "Bugün hayatında neyi daha canlı kılalım?",
      body: "İnsanlarla temas, neşe ve kendini saklamadan görünür olmak için bugünün kapısını seç.",
    },
    yi: {
      title: "Bugün hayatında neyi netleştirelim?",
      body: "Dağınık olanı sadeleştirmek, odağını toplamak ve bir işi sonuna kadar taşımak için bugünün kapısını seç.",
    },
    po: {
      title: "Bugün hayatında neyi hafifletelim?",
      body: "Omuzlarında, nefesinde ya da günün yükünde biraz alan açmak için bugünün kapısını seç.",
    },
    zhi: {
      title: "Bugün hayatında nerede köklenelim?",
      body: "Yorgunluk, kaygı ya da devam etmekte zorlandığın bir yerde sessiz güç bulmak için bugünün kapısını seç.",
    },
  };
  const shenLearning: Record<ShenId, { intro: string; detail: string; micro: string }> = {
    hun: {
      intro: "Hun, içinde yön gören ve yeni bir ihtimali hayal eden yanındır. Akış Modu, sıkıştığın yerde başka bir yol fark etmene yardım eder.",
      detail: "Geleneksel 5 Shen yaklaşımında Hun; Ağaç elementi ve Karaciğer ekseniyle ilişkilendirilir. Tai Chi’de bakışın yönü, spiral hareket ve değişime uyum üzerinden hissedilir.",
      micro: "Bugün dene: Önündeki işi yapmadan önce varmak istediğin yönü tek cümleyle söyle.",
    },
    shen: {
      intro: "Shen, fark eden ve hayatla temas kuran yanındır. Açıklık Modu, daha canlı ama sakin bir şekilde görünür olmana alan açar.",
      detail: "Geleneksel 5 Shen yaklaşımında Shen; Ateş elementi ve Kalp ekseniyle ilişkilendirilir. Tai Chi’de yumuşak bakış, açık göğüs hattı ve çevreyle kurulan uyanık temasla anlatılır.",
      micro: "Bugün dene: Bir konuşmadan önce nefes ver, gözlerini yumuşat ve gerçekten karşındakine dön.",
    },
    yi: {
      intro: "Yi, dikkatini bir yerde tutan ve niyetini harekete bağlayan yanındır. Netlik Modu, dağınık enerjiyi tek bir adıma toplar.",
      detail: "Geleneksel 5 Shen yaklaşımında Yi; Toprak elementi ve Dalak ekseniyle ilişkilendirilir. Tai Chi’de merkez, tekrar ve zihnin hareketi nazikçe yönlendirmesiyle çalışılır.",
      micro: "Bugün dene: Yapacağın ilk işi seç ve bitirene kadar yalnızca onunla kal.",
    },
    po: {
      intro: "Po, bedenin şimdi ve burada ne söylediğini duyan yanındır. Hafifleme Modu, tutunduğun gerginliği fark edip bırakmana yardım eder.",
      detail: "Geleneksel 5 Shen yaklaşımında Po; Metal elementi ve Akciğer ekseniyle ilişkilendirilir. Tai Chi’de nefes, sınırlar, dokunma duyusu ve gereksiz kasılmayı bırakma üzerinden görünür olur.",
      micro: "Bugün dene: Omuzlarını kaldır, nefes verirken serbest bırak ve ayak tabanlarını hisset.",
    },
    zhi: {
      intro: "Zhi, seni zorlayarak değil enerjini koruyarak devam ettiren sessiz iradendir. Dayanıklılık Modu, korkuyu küçültüp bir sonraki adımı görünür kılar.",
      detail: "Geleneksel 5 Shen yaklaşımında Zhi; Su elementi ve Böbrek ekseniyle ilişkilendirilir. Tai Chi’de köklenme, acele etmeden ağırlık aktarma ve sakin süreklilik üzerinden çalışılır.",
      micro: "Bugün dene: Zor görünen işi, şimdi tamamlayabileceğin en küçük adıma indir.",
    },
  };
  const steps = [
    {
      eyebrow: "Başlangıç",
      title: "Bu yolculuk kimin için?",
      body: "Sana her gün biraz daha kişisel bir ritim kurabilmemiz için önce adını bilelim.",
      action: "Yolculuğuma başla",
    },
    {
      eyebrow: "Giriş",
      title: "Önce bugünkü ihtiyacını duyalım.",
      body: "RİTİM KAPISI her şeyi bir anda anlatmaz. Günün içinde ihtiyacın olan kısa pratiği verir; yol sen ilerledikçe açılır.",
      action: "Hadi, neye ihtiyacın var bakalım",
    },
    {
      eyebrow: "Günlük Alanın",
      title: "Bugününü tek yerde takip et.",
      body: "Pratiklerin, postür analizlerin ve günün sonunda yazdığın kısa yansıma Günlük ekranında düzenli biçimde birikir.",
      action: "Günlüğümü gör",
    },
    {
      eyebrow: "Yolun",
      title: "Önce pratik, sonra beden, sonra yolculuk.",
      body: "Bugün yalnız ilk akışın açık. İlk pratiğin postür aynasını, düzenli ilerleyişin ise beden içindeki Yolculuğum haritasını açacak.",
      action: "İlk pratiğime başla",
    },
  ];
  const currentStep = steps[step];
  const currentStepTitle = currentStep.title;
  const currentStepBody = currentStep.body;
  const progress = Math.round(((step + 1) / steps.length) * 100);
  const activeModeQuestion = modeQuestions[modeQuizQuestion];
  const modeQuizShen = modeQuizResult ? getShenById(modeQuizResult) : selectedShen;
  const modeQuizLearning = shenLearning[modeQuizShen.id];

  useEffect(() => {
    const frame = onboardingRef.current?.closest(".mobile-frame");
    if (frame instanceof HTMLElement) frame.scrollTop = 0;
  }, [step, modeChoiceOpen, modeQuizOpen, modeQuizQuestion, modeQuizResult]);

  function openModeQuiz() {
    setModeChoiceOpen(true);
    setModeQuizOpen(true);
    setModeQuizQuestion(0);
    setModeQuizAnswers([]);
    setModeQuizResult(null);
  }

  function answerModeQuestion(shenId: ShenId) {
    const nextAnswers = [...modeQuizAnswers.slice(0, modeQuizQuestion), shenId];
    setModeQuizAnswers(nextAnswers);
    if (modeQuizQuestion < modeQuestions.length - 1) {
      setModeQuizQuestion((current) => current + 1);
      return;
    }

    const scores: Record<ShenId, number> = { hun: 0, shen: 0, yi: 0, po: 0, zhi: 0 };
    nextAnswers.forEach((answer, index) => {
      scores[answer] += 1 + index * 0.25;
    });
    const result = (Object.entries(scores) as Array<[ShenId, number]>).sort((a, b) => b[1] - a[1])[0]?.[0] ?? selectedShenId;
    setModeQuizResult(result);
    onSelectShen(result);
  }

  function goBackFromModeQuiz() {
    if (modeQuizResult) {
      setModeQuizResult(null);
      setModeQuizQuestion(modeQuestions.length - 1);
      return;
    }
    if (modeQuizQuestion > 0) {
      setModeQuizQuestion((current) => current - 1);
      setModeQuizAnswers((current) => current.slice(0, -1));
      return;
    }
    setModeQuizOpen(false);
  }

  function confirmModeChoice() {
    onSelectShen(selectedShenId);
    setModeChoiceOpen(false);
    setModeQuizOpen(false);
    setStep(2);
  }

  function goNext() {
    if (step === 0 && !userName.trim()) {
      setNameError("Yolculuğa başlamak için adını yaz.");
      return;
    }

    if (step === steps.length - 1) {
      onFinish();
      return;
    }

    if (step === 1 && !modeChoiceOpen) {
      setModeChoiceOpen(true);
      return;
    }

    setStep((current) => current + 1);
  }

  const modeFlowOpen = step === 1 && modeChoiceOpen;
  const modeQuizResultOpen = modeFlowOpen && modeQuizOpen && Boolean(modeQuizResult);
  const modePickerOpen = modeFlowOpen && !modeQuizOpen;

  return (
    <section className="screen onboarding-screen" ref={onboardingRef}>
      <div className="onboarding-hero">
        <div className="onboarding-progress">
          <span>{step + 1} / {steps.length}</span>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="eyebrow">
          {modeQuizOpen ? "Tai Chi Hocası" : modePickerOpen ? "Günlük modun" : currentStep.eyebrow}
        </span>
        <h1 className="hero-title">
          {modeFlowOpen
            ? modeQuizResultOpen
              ? `Bugünkü modun: ${modeQuizShen.dailyName}`
              : modeQuizOpen
                ? activeModeQuestion.prompt
                : "Bugününü hangi yöne çevirelim?"
            : currentStepTitle}
        </h1>
        <p className="hero-copy">
          {modeFlowOpen
            ? modeQuizResultOpen
              ? `Yanıtların bugün ${modeQuizShen.dailyName.toLocaleLowerCase("tr-TR")} ihtiyacını gösteriyor. Bu modun 5 Shen dilindeki karşılığı ${modeQuizShen.name}.`
              : modeQuizOpen
                ? `Soru ${modeQuizQuestion + 1}/3 • Sana en yakın cevabı seç.`
                : "Modunu kendin seçebilir ya da üç kısa soruyla bugünkü ihtiyacını birlikte bulabiliriz."
            : currentStepBody}
        </p>

        {step === 0 ? (
          <div className="onboarding-name-field">
            <label htmlFor="onboarding-user-name">Bu yolculukta sana nasıl hitap edelim?</label>
            <input
              autoComplete="given-name"
              autoFocus
              id="onboarding-user-name"
              maxLength={32}
              onChange={(event) => {
                onUserNameChange(event.target.value);
                if (nameError) setNameError("");
              }}
              placeholder="Adını yaz"
              type="text"
              value={userName}
            />
            {nameError ? (
              <small role="alert">{nameError}</small>
            ) : (
              <small>Bu isim yolculuğun boyunca sana eşlik edecek; seni bu yolculukta bu isimle anacağız.</small>
            )}
          </div>
        ) : null}

        {modePickerOpen ? (
          <div className="onboarding-mode-choice">
            <div className="onboarding-mode-choice-intro">
              <strong>{shenModePrompt[selectedShenId].title}</strong>
              <span>{shenModePrompt[selectedShenId].body}</span>
            </div>
            <div className="onboarding-shen-picker" aria-label="Bugünün modunu seç">
              {fiveShen.map((shen) => (
                <button
                  aria-pressed={selectedShenId === shen.id}
                  className={`onboarding-shen ${selectedShenId === shen.id ? "onboarding-shen-active" : ""}`}
                  key={shen.id}
                  onClick={() => onSelectShen(shen.id)}
                  style={{ "--shen-card-accent": shen.color } as CSSProperties}
                  type="button"
                >
                  <span>{shen.symbol}</span>
                  <strong>{shen.dailyName}</strong>
                  <small>{shen.name}</small>
                </button>
              ))}
            </div>
            <div className="onboarding-mode-choice-actions">
              <button className="primary-action" onClick={confirmModeChoice} type="button">Modumu seçtim</button>
              <button className="secondary-action" onClick={openModeQuiz} type="button">Neye ihtiyacım var, sen bul</button>
            </div>
          </div>
        ) : null}

        {modeQuizOpen ? (
          modeQuizResultOpen ? (
            <div
              className="onboarding-mode-result"
              style={{ "--shen-card-accent": modeQuizShen.color } as CSSProperties}
            >
              <span>{modeQuizShen.symbol}</span>
              <div>
                <strong>{modeQuizShen.dailyName}</strong>
                <small>5 Shen karşılığı: {modeQuizShen.name}</small>
                <p className="onboarding-shen-intro">{modeQuizLearning.intro}</p>
                <div className="onboarding-shen-micro">
                  <span>Bugün için küçük deney</span>
                  <p>{modeQuizLearning.micro}</p>
                </div>
                <details className="onboarding-shen-depth">
                  <summary>Biraz daha öğren</summary>
                  <p>{modeQuizLearning.detail}</p>
                </details>
              </div>
            </div>
          ) : (
            <div className="onboarding-mode-quiz-options">
              {activeModeQuestion.options.map((option, index) => (
                <button key={option.label} onClick={() => answerModeQuestion(option.shenId)} type="button">
                  <span>{index + 1}</span>
                  <strong>{option.label}</strong>
                </button>
              ))}
            </div>
          )
        ) : null}

        {step === 2 ? (
          <div className="onboarding-daily-preview">
            <article>
              <span>01</span>
              <div><strong>Bugünkü pratikler</strong><small>Tamamladığın hareketler ve canlı uyum skorları</small></div>
            </article>
            <article>
              <span>02</span>
              <div><strong>Postür analizleri</strong><small>Ön, yan ve arka beden hattının tarihsel kaydı</small></div>
            </article>
            <article>
              <span>03</span>
              <div><strong>Günün yansıması</strong><small>Nasıl hissettiğini ve bedenindeki değişimi not et</small></div>
            </article>
          </div>
        ) : null}

        {step === 3 ? (
          <>
            <div className="onboarding-welcome-line">Hazırsın, {userName.trim() || "yol arkadaşım"}. İlk kapı senin ritminle açılacak.</div>
            <div className="onboarding-unlock-roadmap">
            <div className="onboarding-unlock-step onboarding-unlock-active">
              <strong>1</strong>
              <span><b>Bugün</b><small>Hazırlık ve ilk Shibashi akışı</small></span>
            </div>
            <div className="onboarding-unlock-step">
              <strong>2</strong>
              <span><b>İlk pratikten sonra</b><small>Postür aynası ve gelişim kaydı</small></span>
            </div>
            <div className="onboarding-unlock-step">
              <strong>3</strong>
              <span><b>Yol açıldığında</b><small>İnsan haritası ve kalıcı yolculuk rehberi</small></span>
            </div>
            </div>
          </>
        ) : null}

        {step === 99 ? (
          <div className="onboarding-practice-preview">
            <img src={getMovementReferenceImage(movements[0])} alt="Açılış Formu referans hareketi" />
            <div>
              <span className="eyebrow">İlk form</span>
              <strong>Açılış Formu</strong>
              <small>Önce formu gör, sonra ritmini kameraya emanet et.</small>
            </div>
          </div>
        ) : null}

        {modeFlowOpen ? (
          <div className="onboarding-actions onboarding-mode-actions">
            <button
              className="secondary-action"
              onClick={() => (modeQuizOpen ? goBackFromModeQuiz() : setModeChoiceOpen(false))}
              type="button"
            >
              Geri
            </button>
            {modeQuizOpen ? (
              <button
                className="primary-action"
                disabled={!modeQuizResult}
                onClick={confirmModeChoice}
                type="button"
              >
                {modeQuizResult ? "Bu modla devam et" : "Bir cevap seç"}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="onboarding-actions">
            {step > 0 ? (
              <button className="secondary-action" onClick={() => setStep((current) => current - 1)} type="button">Geri</button>
            ) : null}
            <button className="primary-action" onClick={goNext} type="button">{currentStep.action}</button>
          </div>
        )}
      </div>
    </section>
  );
}

function ShenThemeSelector({
  onSelectShen,
  selectedShen,
  selectedShenId,
  soundState,
}: {
  onSelectShen: (shen: ShenId) => void;
  selectedShen: (typeof fiveShen)[number];
  selectedShenId: ShenId;
  soundState: "kapalı" | "açık";
}) {
  return (
    <section className="theme-selector" aria-label="5 Shen tema seçimi">
      <div className="theme-selector-head">
        <div>
          <span className="eyebrow">Bugünkü mod</span>
          <h2>{selectedShen.dailyName}</h2>
        </div>
        <div className="sound-actions">
          <div className="sound-pill">Müzik {soundState}</div>
        </div>
      </div>
      <div className="theme-mode-grid">
        {fiveShen.map((shen) => (
          <button
            className={`theme-mode ${selectedShenId === shen.id ? "theme-mode-active" : ""}`}
            key={shen.id}
            onClick={() => onSelectShen(shen.id)}
            style={
              {
                "--shen-card-accent": shen.color,
                "--shen-card-accent-2": shen.color2,
                "--shen-card-image": `url(${shen.image})`,
              } as CSSProperties
            }
            type="button"
          >
            <span className="theme-swatch" />
            <strong>{shen.dailyName}</strong>
            <small>{shen.name}: {shen.label}</small>
            <em>{shen.dailyPrompt}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function ShenThemeDock({
  onSelectShen,
  selectedShenId,
}: {
  onSelectShen: (shen: ShenId) => void;
  selectedShenId: ShenId;
}) {
  return (
    <div className="theme-dock" aria-label="Hızlı 5 Shen seçici">
      {fiveShen.map((shen) => (
        <button
          aria-label={`${shen.dailyName} seç`}
          className={`dock-button ${selectedShenId === shen.id ? "dock-button-active" : ""}`}
          key={shen.id}
          onClick={() => onSelectShen(shen.id)}
          style={{ "--shen-card-accent": shen.color } as CSSProperties}
          type="button"
        >
          <span>{shen.symbol}</span>
          <small>{shen.dailyName.replace(" Modu", "")}</small>
        </button>
      ))}
    </div>
  );
}

function AmbientParticles({ selectedShenId }: { selectedShenId: ShenId }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const liveCanvas = canvas;
    const liveContext = context;

    let frame = 0;
    let width = 0;
    let height = 0;
    const shen = getShenById(selectedShenId);
    const particleCount = selectedShenId === "shen" ? 74 : selectedShenId === "po" ? 38 : 56;
    let particles: Array<{ alpha: number; phase: number; size: number; vx: number; vy: number; x: number; y: number }> = [];

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      liveCanvas.width = width * ratio;
      liveCanvas.height = height * ratio;
      liveContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: particleCount }, () => ({
        alpha: Math.random() * 0.48 + 0.12,
        phase: Math.random() * Math.PI * 2,
        size: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        x: Math.random() * width,
        y: Math.random() * height,
      }));
    }

    function draw() {
      liveContext.clearRect(0, 0, width, height);
      particles.forEach((particle, index) => {
        particle.phase += 0.012;

        if (selectedShenId === "shen") {
          particle.vy -= 0.002;
          particle.vx += Math.sin(particle.phase) * 0.004;
        } else if (selectedShenId === "hun") {
          particle.vy -= 0.012;
          particle.vx += Math.sin(particle.phase) * 0.011;
        } else if (selectedShenId === "yi") {
          particle.vx *= 0.96;
          particle.vy *= 0.96;
        } else if (selectedShenId === "po") {
          particle.vx = 0.2 + (index % 3) * 0.045;
          particle.vy = -0.035;
        } else {
          particle.vx += Math.sin(particle.phase) * 0.002;
          particle.vy += Math.cos(particle.phase) * 0.003;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < -24) particle.x = width + 24;
        if (particle.x > width + 24) particle.x = -24;
        if (particle.y < -24) particle.y = height + 24;
        if (particle.y > height + 24) particle.y = -24;

        liveContext.globalAlpha = particle.alpha;
        liveContext.fillStyle = shen.color;
        liveContext.beginPath();
        if (selectedShenId === "yi") {
          liveContext.rect(particle.x, particle.y, particle.size * 2.2, particle.size * 2.2);
        } else if (selectedShenId === "po") {
          liveContext.rect(particle.x, particle.y, particle.size * 4.8, 0.8);
        } else {
          liveContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        }
        liveContext.fill();
      });
      liveContext.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [selectedShenId]);

  return <canvas className="ambient-canvas" ref={canvasRef} aria-hidden="true" />;
}

function EnergyRail({
  scores,
  selectedShen,
}: {
  scores: EnergyScores;
  selectedShen: (typeof fiveShen)[number];
}) {
  const metrics = [
    { label: "Jing", value: scores.jing, symbol: "精" },
    { label: "Qi", value: scores.qi, symbol: "氣" },
    { label: "Shen", value: scores.shen, symbol: "神" },
  ];

  return (
    <aside className="energy-rail" aria-label="Canlı Jing Qi Shen değerleri">
      <div className="energy-rail-title">
        <span>{selectedShen.dailyName}</span>
        <strong>Canlı Değerler</strong>
      </div>
      {metrics.map((metric) => (
        <div className="energy-rail-item" key={metric.label}>
          <div>
            <strong>{metric.symbol}</strong>
            <span>{metric.label}</span>
          </div>
          <em>{metric.value}%</em>
          <i>
            <b style={{ height: `${metric.value}%` }} />
          </i>
        </div>
      ))}
    </aside>
  );
}

function getSevenDayGates(selectedShen: (typeof fiveShen)[number]) {
  return [
    {
      day: 1,
      title: "Nefes Kapısı",
      moment: "Sabah ilk temas",
      ritual: "Üç nefes, iki omuz bırakışı, tek niyet.",
      unlock: `${selectedShen.dailyName} tanınır`,
    },
    {
      day: 2,
      title: "Duruş Kapısı",
      moment: "Ayakta beklerken",
      ritual: "Ağırlığı ayaklara indir, çeneyi yumuşat.",
      unlock: "Beden hattı açılır",
    },
    {
      day: 3,
      title: "Omuzları Bırakma",
      moment: "Ekran karşısında",
      ritual: "Kolları nefesle kaldır, omuzları aşağı bırak.",
      unlock: "İş yükü bedenden ayrılır",
    },
    {
      day: 4,
      title: "İşe Giriş",
      moment: "Masaya oturunca",
      ritual: "İlk işi tek satıra indir, sonra hareket et.",
      unlock: "Netlik puanı artar",
    },
    {
      day: 5,
      title: "Stres Düğümü",
      moment: "Cevap vermeden önce",
      ritual: "Avuçları aç, bakışı yumuşat, nefesi uzat.",
      unlock: "Tepki yerine alan açılır",
    },
    {
      day: 6,
      title: "Akşam Eşiği",
      moment: "İşten eve geçerken",
      ritual: "Günün ağırlığını ayaklara bırak.",
      unlock: "Eve geçiş hafifler",
    },
    {
      day: 7,
      title: "Beden Haritası",
      moment: "Haftanın kapanışı",
      ritual: "Yedi kapıyı bir çizgide birleştir.",
      unlock: "İç harita görünür olur",
    },
  ] as const;
}

function getLifeMoments(selectedShen: (typeof fiveShen)[number]) {
  return [
    {
      id: "morning",
      icon: "S",
      title: "Sabah Kapısı",
      choice: "Güne hazırlanmak",
      benefit: "Bedeni uyandır, ritmini kur",
      reason: "Güne aceleyle değil, bedenini ve nefesini duyarak başlamak için.",
      when: "Evden çıkmadan",
      duration: "3 dk",
      ritual: "Ayak tabanını hisset, omuzları indir, bugünün kapısını tek cümleyle seç.",
      reward: `${selectedShen.dailyName} +6`,
      whisper: `Bugüne ${selectedShen.dailyName} ile gir. Kadim karşılığı: ${selectedShen.name}.`,
    },
    {
      id: "work-start",
      icon: "İ",
      title: "İşe Giriş",
      choice: "Dikkatimi toplamak",
      benefit: "Dağınıklığı tek adıma indir",
      reason: "Zihnindeki kalabalığı azaltıp önündeki ilk işe daha net başlayabilmek için.",
      when: "Masaya oturunca",
      duration: "90 sn",
      ritual: "Ekrana bakmadan önce üç nefes al, çeneyi gevşet, ilk işi tek satıra indir.",
      reward: "Netlik +5",
      whisper: "Günün ilk dikkati nereye giderse, ritim oradan kurulur.",
    },
    {
      id: "stress",
      icon: "D",
      title: "Stres Düğümü",
      choice: "Stresi azaltmak",
      benefit: "Nefesi aç, bedeni yumuşat",
      reason: "Tepki vermeden önce sıkışan nefese ve kasılan bedene biraz alan açmak için.",
      when: "Sıkışınca",
      duration: "60 sn",
      ritual: "Cevap vermeden önce avuçları aç, nefesi uzat, bakışı yumuşat.",
      reward: "Qi +8",
      whisper: "Kapı kapanmadı; sadece nefes daraldı. Önce alan aç.",
    },
    {
      id: "after-work",
      icon: "A",
      title: "Akşam Eşiği",
      choice: "İşten çıkabilmek",
      benefit: "Günün yükünü bedenden bırak",
      reason: "İş bitse de bedende kalan gerginliği eve taşımadan bırakabilmek için.",
      when: "İşten sonra",
      duration: "4 dk",
      ritual: "Günün yükünü omuzlardan indir, ağırlığı ayaklara bırak, eve geçişi yavaşlat.",
      reward: "Hafifleme +7",
      whisper: "İş bittiğinde beden hâlâ işi taşımasın.",
    },
    {
      id: "sleep",
      icon: "U",
      title: "Uyku Öncesi",
      choice: "Uykuya hazırlanmak",
      benefit: "Ritmi yavaşlat, günü kapat",
      reason: "Bedeni dinlenmeye geçirip zihnin gün boyunca taşıdığı son düşünceleri bırakmak için.",
      when: "Işıklar azalınca",
      duration: "5 dk",
      ritual: "Bel, diz ve nefesi yumuşat; son düşünceyi kapıya bırak.",
      reward: "Shen +6",
      whisper: "Gece kapısı güçle değil, bırakışla açılır.",
    },
  ] as const;
}

function HomeScreen({
  energyScores,
  journeyUnlocked,
  onJourney,
  onPractice,
  onPosture,
  onSelectShen,
  practiceCount,
  postureCount,
  selectedShen,
  userName,
}: {
  energyScores: EnergyScores;
  journeyUnlocked: boolean;
  onJourney: () => void;
  onPractice: () => void;
  onPosture: () => void;
  onSelectShen: (shenId: ShenId) => void;
  practiceCount: number;
  postureCount: number;
  selectedShen: (typeof fiveShen)[number];
  userName: string;
}) {
  const lifeMoments = getLifeMoments(selectedShen);
  const [selectedLifeMomentId, setSelectedLifeMomentId] = useState<(typeof lifeMoments)[number]["id"]>("morning");
  const [activeEnergyMetric, setActiveEnergyMetric] = useState<EnergyMetricLabel | null>(null);
  const selectedLifeMoment = lifeMoments.find((moment) => moment.id === selectedLifeMomentId) ?? lifeMoments[0];
  const postureUnlocked = true;
  const currentStage = journeyUnlocked ? 3 : postureUnlocked ? 2 : 1;

  return (
    <section className="screen progressive-home">
      <header className="meditation-header">
        <div className="meditation-brand">
          <span>☯</span>
          <div>
            <strong>SHIBASHI</strong>
            <small>5 Shen · İçsel Yolculuk</small>
          </div>
        </div>
        <button aria-label="Bildirimler" className="meditation-notify" type="button">♧<i /></button>
      </header>

      <div className="shen-constellation" aria-label="Shen seçimi">
        {fiveShen.map((shen) => (
          <button
            className={selectedShen.id === shen.id ? "shen-constellation-active" : ""}
            key={shen.id}
            onClick={() => onSelectShen(shen.id)}
            style={{ "--constellation-color": shen.color } as CSSProperties}
            type="button"
          >
            <span>{shen.symbol}</span>
            <strong>{shen.name}</strong>
          </button>
        ))}
      </div>

      <article className="shen-sanctuary" style={{ "--home-image": `url(${selectedShen.image})` } as CSSProperties}>
        <div className="sanctuary-shade" />
        <div className="sanctuary-copy">
          <span className="eyebrow">{selectedShen.element}</span>
          <div className="sanctuary-title">
            <h1>{selectedShen.name} Shen</h1>
            <b>{selectedShen.symbol}</b>
          </div>
          <p className="sanctuary-essence">{selectedShen.essence}</p>
          <p className="sanctuary-prompt">{selectedShen.dailyPrompt}</p>
        </div>

        <div className="energy-orbit" aria-label="Günlük enerji değerleri">
          {[
            { label: "Jing", value: energyScores.jing },
            { label: "Qi", value: energyScores.qi },
            { label: "Shen", value: energyScores.shen },
          ].map((metric) => (
            <button
              className={activeEnergyMetric === metric.label ? "energy-orbit-active" : ""}
              key={metric.label}
              onClick={() => setActiveEnergyMetric((current) => current === metric.label ? null : metric.label as EnergyMetricLabel)}
              type="button"
            >
              <span>{metric.label}</span>
              <strong>{metric.value}<small>%</small></strong>
            </button>
          ))}
        </div>

        <div className="sanctuary-ritual">
          <div className="ritual-mark"><span>☯</span></div>
          <div>
            <span>GÜNLÜK PRATİĞİN</span>
            <strong>18 Hareket · 20 dakika</strong>
          </div>
          <button onClick={onPractice} type="button">Pratiğe Başla <span>→</span></button>
        </div>
      </article>

      <div className="meditation-section-title">
        <div>
          <span className="eyebrow">İçsel haritan</span>
          <h2>Bugünün dengesi</h2>
        </div>
        <span>{selectedShen.dailyName}</span>
      </div>

      <div className="premium-path" aria-label="Uygulama açılım yolu">
        <div className={`progressive-step ${currentStage >= 1 ? "progressive-step-active" : ""}`}>
          <span>✧</span>
          <div><strong>Pratik</strong><small>{practiceCount ? `${practiceCount} akış tamamlandı` : "İlk akışın seni bekliyor"}</small></div>
          <b>Başla</b>
        </div>
        <button
          className={`progressive-step ${postureUnlocked ? "progressive-step-unlocked" : "progressive-step-locked"}`}
          disabled={!postureUnlocked}
          onClick={onPosture}
          type="button"
        >
          <span>↕</span>
          <div><strong>Postür Aynası</strong><small>{postureCount ? `${postureCount} analiz kayıtlı` : "İlk ölçümünü şimdi al"}</small></div>
          <b>Keşfet</b>
        </button>
        <button
          className={`progressive-step ${journeyUnlocked ? "progressive-step-unlocked" : "progressive-step-locked"}`}
          disabled={!journeyUnlocked}
          onClick={onJourney}
          type="button"
        >
          <span>☯</span>
          <div><strong>Yolculuğum</strong><small>İnsan haritan ve kalıcı rehberin</small></div>
          <b>{journeyUnlocked ? "Aç" : "Yakında"}</b>
        </button>
      </div>

      <div className="home-moment-band meditation-moments">
        <div className="home-moment-head">
          <div>
            <span className="eyebrow">Kendine bir an ayır</span>
            <h2>Şimdi neye ihtiyacın var?</h2>
            <p className="home-moment-guidance">Bedeninin sesini dinle. Sana en yakın olanı seç.</p>
          </div>
          <span>{selectedLifeMoment.duration}</span>
        </div>
        <div className="home-moment-options">
          {lifeMoments.slice(0, 3).map((moment) => (
            <button
              className={selectedLifeMomentId === moment.id ? "home-moment-active" : ""}
              key={moment.id}
              onClick={() => setSelectedLifeMomentId(moment.id)}
              type="button"
            >
              <span>{moment.icon}</span>
              <div>
                <strong>{moment.choice}</strong>
                <small>{moment.benefit}</small>
              </div>
            </button>
          ))}
        </div>
        <div className="home-moment-detail-simple">
          <div className="home-moment-answer">
            <span>Bu pratik neden?</span>
            <strong>{selectedLifeMoment.reason}</strong>
            <p><b>{selectedLifeMoment.duration}</b> • {selectedLifeMoment.ritual}</p>
          </div>
          <button className="secondary-action" onClick={onPractice} type="button">
            {selectedLifeMoment.duration} pratiğini başlat
          </button>
        </div>
      </div>
    </section>
  );
}

function LifeMomentsPanel({
  moments,
  onPractice,
  onSelectMoment,
  selectedMoment,
  selectedMomentId,
}: {
  moments: ReturnType<typeof getLifeMoments>;
  onPractice: () => void;
  onSelectMoment: (momentId: ReturnType<typeof getLifeMoments>[number]["id"]) => void;
  selectedMoment: ReturnType<typeof getLifeMoments>[number];
  selectedMomentId: ReturnType<typeof getLifeMoments>[number]["id"];
}) {
  return (
    <div className="glass-card life-moments-card">
      <div className="section-heading" style={{ margin: "0 0 12px" }}>
        <div>
          <span className="eyebrow">Bugünün Yaşam Anları</span>
          <h2>Uygulama seni günün içinde yakalasın.</h2>
        </div>
        <span>{selectedMoment.duration}</span>
      </div>

      <div className="life-moment-grid" aria-label="Gün içi ritüel seçimi">
        {moments.map((moment) => (
          <button
            className={`life-moment-button ${selectedMomentId === moment.id ? "life-moment-button-active" : ""}`}
            key={moment.id}
            onClick={() => onSelectMoment(moment.id)}
            type="button"
          >
            <span>{moment.icon}</span>
            <strong>{moment.title}</strong>
            <small>{moment.when}</small>
          </button>
        ))}
      </div>

      <div className="life-moment-detail">
        <div className="life-moment-orb">{selectedMoment.icon}</div>
        <div>
          <span className="eyebrow">{selectedMoment.when} • {selectedMoment.duration}</span>
          <div className="item-title">{selectedMoment.title}</div>
          <p>{selectedMoment.ritual}</p>
          <div className="life-moment-whisper">{selectedMoment.whisper}</div>
          <div className="reference-meta">
            <span>{selectedMoment.reward}</span>
            <span>Kapı puanı</span>
          </div>
        </div>
      </div>

      <button className="primary-action life-moment-action" onClick={onPractice} type="button">
        Bu Anın Ritüelini Başlat <span>→</span>
      </button>
    </div>
  );
}

function SevenDayPathPanel({
  gates,
  onSelectGate,
  selectedGateIndex,
}: {
  gates: ReturnType<typeof getSevenDayGates>;
  onSelectGate: (index: number) => void;
  selectedGateIndex: number;
}) {
  const selectedGate = gates[selectedGateIndex] ?? gates[0];

  return (
    <div className="glass-card seven-day-card">
      <div className="section-heading" style={{ margin: "0 0 12px" }}>
        <div>
          <span className="eyebrow">İlk 7 Gün Rotası</span>
          <h2>Her gün bir kapı, her kapıda bir davranış.</h2>
        </div>
        <span>{selectedGate.day}. gün</span>
      </div>

      <div className="seven-day-strip" aria-label="Yedi günlük kapı rotası">
        {gates.map((gate, index) => (
          <button
            className={`seven-day-step ${selectedGateIndex === index ? "seven-day-step-active" : ""} ${index === 0 ? "seven-day-step-unlocked" : ""}`}
            key={gate.title}
            onClick={() => onSelectGate(index)}
            type="button"
          >
            <strong>{gate.day}</strong>
            <span>{gate.title}</span>
          </button>
        ))}
      </div>

      <div className="seven-day-detail">
        <div className="seven-day-number">{selectedGate.day}</div>
        <div>
          <span className="eyebrow">{selectedGate.moment}</span>
          <div className="item-title">{selectedGate.title}</div>
          <p>{selectedGate.ritual}</p>
          <div className="life-moment-whisper">{selectedGate.unlock}</div>
        </div>
      </div>
    </div>
  );
}

function PostureScreen({
  latestPostureReport,
  onDeletePostureReport,
  onPostureReportCaptured,
  onSetTrainerVisibility,
  onStopMusic,
  postureReports,
  selectedShen,
}: {
  latestPostureReport?: PostureReport;
  onDeletePostureReport: (reportId: string) => void;
  onPostureReportCaptured: (report: PostureReport) => void;
  onSetTrainerVisibility: (reportId: string, trainerVisible: boolean) => void;
  onStopMusic: () => void;
  postureReports: PostureReport[];
  selectedShen: (typeof fiveShen)[number];
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const scoreTimerRef = useRef<number | null>(null);
  const targetScoreRef = useRef(0);
  const postureStableSinceRef = useRef<number | null>(null);
  const posturePreviousPointsRef = useRef<PoseKeypoint[]>([]);
  const postureAutoCaptureLockRef = useRef(false);
  const postureAnnouncedStepRef = useRef<PostureAssessmentStep | null>(null);
  const postureStepRef = useRef<PostureAssessmentStep>("intro");
  const poseStatusRef = useRef<"bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata">("bekliyor");
  const lastPoseUiUpdateRef = useRef(0);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "ready" | "denied" | "unsupported">("idle");
  const [keypoints, setKeypoints] = useState<PoseKeypoint[]>([]);
  const [movementScore, setMovementScore] = useState(0);
  const [poseStatus, setPoseStatus] = useState<"bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata">("bekliyor");
  const [postureMode, setPostureMode] = useState<PostureRenderMode>("3d");
  const [postureView, setPostureView] = useState<PostureView>("front");
  const [postureStep, setPostureStep] = useState<PostureAssessmentStep>("intro");
  const [postureCaptures, setPostureCaptures] = useState<Partial<Record<PostureView, PostureAssessmentCapture>>>({});
  const [postureResult, setPostureResult] = useState<PostureReport | null>(null);
  const [viewingSavedReport, setViewingSavedReport] = useState(false);
  const [autoCaptureProgress, setAutoCaptureProgress] = useState(0);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [capturedView, setCapturedView] = useState<PostureView | null>(null);
  const captureTransitionRef = useRef<number | null>(null);
  postureStepRef.current = postureStep;

  useEffect(() => {
    scoreTimerRef.current = window.setInterval(() => {
      setMovementScore((current) => {
        const target = targetScoreRef.current;
        const difference = target - current;
        if (Math.abs(difference) < 1) return target;
        return Math.max(0, Math.min(100, current + Math.sign(difference) * Math.min(Math.abs(difference), 3)));
      });
    }, 220);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (scoreTimerRef.current) window.clearInterval(scoreTimerRef.current);
      if (captureTransitionRef.current) window.clearTimeout(captureTransitionRef.current);
      detectorRef.current?.dispose?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraStatus !== "ready") {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      setKeypoints([]);
      if (poseStatusRef.current !== "bekliyor") {
        poseStatusRef.current = "bekliyor";
        setPoseStatus("bekliyor");
      }
      targetScoreRef.current = 0;
      setMovementScore(0);
      drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
      return;
    }

    let cancelled = false;
    void startPostureMoveNetLoop(() => cancelled);

    return () => {
      cancelled = true;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [cameraStatus, selectedShen.color]);

  useEffect(() => {
    postureStableSinceRef.current = null;
    posturePreviousPointsRef.current = [];
    postureAutoCaptureLockRef.current = false;
    setAutoCaptureProgress(0);
    window.scrollTo({ top: 0 });
    document.querySelector<HTMLElement>(".mobile-frame")?.scrollTo({ top: 0 });
  }, [postureStep]);

  useEffect(() => {
    if (
      cameraStatus !== "ready" ||
      poseStatus !== "aktif" ||
      (postureStep !== "front" && postureStep !== "side" && postureStep !== "back")
    ) {
      postureStableSinceRef.current = null;
      posturePreviousPointsRef.current = keypoints;
      setAutoCaptureProgress(0);
      return;
    }

    const previousPoints = posturePreviousPointsRef.current;
    posturePreviousPointsRef.current = keypoints;
    if (!previousPoints.length || getPoseStabilityDistance(previousPoints, keypoints) > 8) {
      postureStableSinceRef.current = Date.now();
      setAutoCaptureProgress(0);
      return;
    }

    postureStableSinceRef.current ??= Date.now();
    const progress = Math.min(100, ((Date.now() - postureStableSinceRef.current) / 5000) * 100);
    setAutoCaptureProgress(progress);

    if (progress >= 100 && !postureAutoCaptureLockRef.current) {
      postureAutoCaptureLockRef.current = true;
      window.setTimeout(captureCurrentPosture, 80);
    }
  }, [cameraStatus, keypoints, poseStatus, postureStep]);

  useEffect(() => {
    if (postureStep !== "front" && postureStep !== "side" && postureStep !== "back") return;
    if (postureAnnouncedStepRef.current === postureStep) return;

    postureAnnouncedStepRef.current = postureStep;
    const instruction =
      postureStep === "front"
        ? "Kameraya dön. Beş saniye sabit kal."
        : postureStep === "side"
          ? "Şimdi yana dön. Beş saniye sabit kal."
          : "Şimdi arkana dön. Beş saniye sabit kal.";
    const timer = window.setTimeout(() => speakCoach(instruction), 300);
    return () => window.clearTimeout(timer);
  }, [postureStep]);

  useEffect(() => {
    if (postureStep !== "processing" || !postureResult) return;
    const timer = window.setTimeout(() => setPostureStep("result"), 2600);
    return () => window.clearTimeout(timer);
  }, [postureResult, postureStep]);

  async function startPostureMoveNetLoop(isCancelled: () => boolean) {
    const video = videoRef.current;
    if (!video) return;

    try {
      poseStatusRef.current = "yükleniyor";
      setPoseStatus("yükleniyor");
      detectorRef.current ??= await createMoveNetDetector();
      poseStatusRef.current = "aktif";
      setPoseStatus("aktif");

      const detect = async () => {
        if (isCancelled() || !videoRef.current || cameraStatus !== "ready") return;

        const poses = await detectorRef.current?.estimatePoses(videoRef.current, { flipHorizontal: false });
        const pose = poses?.[0];
        syncPoseCanvasSize(canvasRef.current, videoRef.current);

        if (!pose?.keypoints?.length) {
          if (poseStatusRef.current !== "beden-yok") {
            poseStatusRef.current = "beden-yok";
            setPoseStatus("beden-yok");
            setKeypoints([]);
          }
          drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
          targetScoreRef.current = 0;
        } else {
          const importantVisible = [
            "nose",
            "left_shoulder",
            "right_shoulder",
            "left_hip",
            "right_hip",
            "left_knee",
            "right_knee",
            "left_ankle",
            "right_ankle",
          ].filter((name) => (pose.keypoints?.find((point) => point.name === name)?.score ?? 0) > 0.35);
          const nextStatus=importantVisible.length>=6?"aktif":"beden-yok";
          if(poseStatusRef.current!==nextStatus){
            poseStatusRef.current=nextStatus;
            setPoseStatus(nextStatus);
          }
          const now=performance.now();
          if(now-lastPoseUiUpdateRef.current>=100){
            lastPoseUiUpdateRef.current=now;
            setKeypoints(pose.keypoints);
          }
          drawPoseCanvas(
            canvasRef.current,
            pose,
            selectedShen.color,
            analyzePosture(
              pose.keypoints,
              80,
              selectedShen.id,
              postureStepRef.current === "front" || postureStepRef.current === "side" || postureStepRef.current === "back" ? postureStepRef.current : "front",
            ),
          );
          targetScoreRef.current = scorePose(pose.keypoints, 1);
        }

        rafRef.current = window.requestAnimationFrame(detect);
      };

      rafRef.current = window.requestAnimationFrame(detect);
    } catch {
      poseStatusRef.current = "hata";
      setPoseStatus("hata");
    }
  }

  async function startPostureCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unsupported");
      return false;
    }

    if (streamRef.current) {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }
      setCameraStatus("ready");
      return true;
    }

    try {
      setCameraStatus("requesting");
      onStopMusic();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: 0.75 },
          frameRate: { ideal: 60, max: 60 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus("ready");
      return true;
    } catch {
      setCameraStatus("denied");
      return false;
    }
  }

  function shutdownPostureCamera() {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
    setCameraStatus("idle");
    setKeypoints([]);
    setPoseStatus("bekliyor");
    targetScoreRef.current = 0;
    setMovementScore(0);
  }

  async function openPostureCamera() {
    setViewingSavedReport(false);
    setPostureResult(null);
    setPostureCaptures({});
    setCaptureFlash(false);
    setCapturedView(null);
    setPostureView("front");
    setPostureStep("front");
    const cameraStarted = await startPostureCamera();
    if (!cameraStarted) {
      setPostureStep("intro");
    }
  }

  function openPostureHistory() {
    shutdownPostureCamera();
    setPostureStep("history");
  }

  function captureCurrentPosture() {
    if (postureStep !== "front" && postureStep !== "side" && postureStep !== "back") return;
    const view = postureStep;
    const analysis = toPostureAnalysisSnapshot(analyzePosture(keypoints, movementScore, selectedShen.id, view));
    const capture = createPostureCapture(videoRef.current, keypoints, view, analysis, selectedShen.color);
    if (!capture) return;

    const nextCaptures = { ...postureCaptures, [view]: capture };
    setPostureCaptures(nextCaptures);
    setCapturedView(view);
    setCaptureFlash(true);
    if (captureTransitionRef.current) window.clearTimeout(captureTransitionRef.current);
    captureTransitionRef.current = window.setTimeout(() => {
      setCaptureFlash(false);

      if (view === "front") {
        setPostureView("side");
        setPostureStep("side");
        return;
      }

      if (view === "side") {
        setPostureView("back");
        setPostureStep("back");
        return;
      }

      if (nextCaptures.front && nextCaptures.side && nextCaptures.back) {
        const report = buildPostureReport(nextCaptures as Record<PostureView, PostureAssessmentCapture>, latestPostureReport);
        setViewingSavedReport(false);
        setPostureResult(report);
        speakCoach("Bitti. Üç görünüm de tamamlandı.");
        setPostureStep("captured");
        shutdownPostureCamera();
      }
    }, 650);
  }

  function completePostureAnalysis() {
    if (!postureResult) return;
    setPostureStep("processing");
  }

  function saveCurrentPostureReport() {
    if (!postureResult) return;
    if (viewingSavedReport) {
      resetPostureAssessment();
      return;
    }
    onPostureReportCaptured(postureResult);
    setPostureStep("intro");
    setPostureResult(null);
    setPostureCaptures({});
    setViewingSavedReport(false);
  }

  function resetPostureAssessment() {
    shutdownPostureCamera();
    if (captureTransitionRef.current) window.clearTimeout(captureTransitionRef.current);
    setCaptureFlash(false);
    setCapturedView(null);
    setPostureStep("intro");
    setPostureResult(null);
    setPostureCaptures({});
    setPostureView("front");
    setViewingSavedReport(false);
  }

  function openSavedPostureReport(report: PostureReport) {
    shutdownPostureCamera();
    setPostureCaptures(report.captures);
    setPostureResult(report);
    setPostureView("front");
    setViewingSavedReport(true);
    setPostureStep("result");
  }

  return (
    <PostureAssessmentScreen
      cameraStatus={cameraStatus}
      canvasRef={canvasRef}
      captureFlash={captureFlash}
      captures={postureCaptures}
      capturedView={capturedView}
      keypoints={keypoints}
      mode={postureMode}
      movementScore={movementScore}
      autoCaptureProgress={autoCaptureProgress}
      onCapture={captureCurrentPosture}
      onClose={resetPostureAssessment}
      onCompleteAnalysis={completePostureAnalysis}
      onModeChange={setPostureMode}
      onOpenCamera={openPostureCamera}
      onRetake={() => void openPostureCamera()}
      onSaveReport={saveCurrentPostureReport}
      onOpenSavedReport={openSavedPostureReport}
      onDeleteSavedReport={onDeletePostureReport}
      onSetTrainerVisibility={onSetTrainerVisibility}
      onShowHistory={openPostureHistory}
      onViewChange={setPostureView}
      poseStatus={poseStatus}
      report={postureResult}
      reportIsSaved={viewingSavedReport}
      savedReports={postureReports}
      selectedShen={selectedShen}
      step={postureStep}
      videoRef={videoRef}
      view={postureView}
    />
  );
}

function PracticeScreen({
  completion,
  latestPostureReport,
  movement,
  musicState,
  phase,
  selectedCoach,
  selectedShen,
  onComplete,
  onNext,
  onPlayMusic,
  onPostureReportCaptured,
  onSelectMovement,
  onSnapshotCaptured,
  onStart,
  onStopMusic,
}: {
  completion: number;
  latestPostureReport?: PostureReport;
  movement: Movement;
  musicState: "kapalı" | "açık";
  phase: "ready" | "calibrate" | "live" | "complete";
  selectedCoach: AiCoach;
  selectedShen: (typeof fiveShen)[number];
  onComplete: () => void;
  onNext: () => void;
  onPlayMusic: () => void;
  onPostureReportCaptured: (report: PostureReport) => void;
  onSelectMovement: (movementId: number) => void;
  onSnapshotCaptured: (snapshot: PracticeSnapshot) => void;
  onStart: () => void;
  onStopMusic: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coachVoiceEngineRef = useRef<{
    buffers: Map<string, AudioBuffer>;
    context: AudioContext;
    current: AudioBufferSourceNode | null;
    gain: GainNode;
  } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const scoreTimerRef = useRef<number | null>(null);
  const coachCueQueueRef = useRef<CoachCueRequest[]>([]);
  const coachCuePlayingRef = useRef(false);
  const coachCueCooldownTimerRef = useRef<number | null>(null);
  const coachCueNextAllowedAtRef = useRef(0);
  const stopMusicRef = useRef(onStopMusic);
  const targetScoreRef = useRef(42);
  const movementScoreRef = useRef(42);
  const practiceLearningModeRef = useRef<PracticeLearningMode>("preparation");
  const activeWarmupIdRef = useRef<WarmupLessonId>("wuji");
  const capturedMovementRef = useRef<string | null>(null);
  const previousPoseRef = useRef<{ keypoints: PoseKeypoint[]; at: number } | null>(null);
  const analysisWindowStateRef = useRef<MovementAnalysisWindowState>("idle");
  const analysisWindowSamplesRef = useRef<LiveMovementMatch[]>([]);
  const analysisWindowStartedAtRef = useRef<number | null>(null);
  const analysisWindowTimerRef = useRef<number | null>(null);
  const [liveFeedback, setLiveFeedback] = useState("Tam bedenini kadraja al ve öğretmeni aynala.");
  const [scoreBreakdown, setScoreBreakdown] = useState({ form: 0, rhythm: 0, balance: 0 });
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "ready" | "denied" | "unsupported">("idle");
  const [keypoints, setKeypoints] = useState<PoseKeypoint[]>([]);
  const [movementScore, setMovementScore] = useState(42);
  const [poseStatus, setPoseStatus] = useState<"bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata">("bekliyor");
  const [snapshotState, setSnapshotState] = useState<"bekliyor" | "kaydedildi">("bekliyor");
  const [voiceStatus, setVoiceStatus] = useState<"sessiz" | "aktif">("sessiz");
  const [coachLine, setCoachLine] = useState("Kamera hazır olunca koçun kısa yönlendirmeler verecek.");
  const [postureMode, setPostureMode] = useState<PostureRenderMode>("3d");
  const [postureView, setPostureView] = useState<PostureView>("front");
  const [postureStep, setPostureStep] = useState<"idle" | "intro" | PostureView | "result">("idle");
  const [postureCaptures, setPostureCaptures] = useState<Partial<Record<PostureView, PostureAssessmentCapture>>>({});
  const [postureResult, setPostureResult] = useState<PostureReport | null>(null);
  const [practiceLearningMode, setPracticeLearningMode] = useState<PracticeLearningMode>("preparation");
  const [activeWarmupId, setActiveWarmupId] = useState<WarmupLessonId>("wuji");
  const [completedWarmups, setCompletedWarmups] = useState<WarmupLessonId[]>([]);
  const [practiceAdaptation, setPracticeAdaptation] = useState<PracticeAdaptation>("standing");
  const [analysisWindowState, setAnalysisWindowState] = useState<MovementAnalysisWindowState>("idle");
  const [analysisWindowProgress, setAnalysisWindowProgress] = useState(0);
  const [analysisWindowResult, setAnalysisWindowResult] = useState<MovementAnalysisWindowResult | null>(null);
  const cueIndexRef = useRef(0);
  const referenceImage = getMovementReferenceImage(movement);
  const innerScene = getInnerJourneyScene(movement.id);
  const isCameraReady = cameraStatus === "ready";
  const activeWarmup = warmupLessons.find((lesson) => lesson.id === activeWarmupId) ?? warmupLessons[0];
  practiceLearningModeRef.current = practiceLearningMode;
  activeWarmupIdRef.current = activeWarmupId;

  useEffect(() => {
    stopMusicRef.current = onStopMusic;
  }, [onStopMusic]);

  useEffect(() => {
    if (practiceLearningMode === "preparation") {
      stopMusicRef.current();
    }
  }, [activeWarmupId, practiceLearningMode]);

  useEffect(() => {
    scoreTimerRef.current = window.setInterval(() => {
      setMovementScore((current) => {
        const target = targetScoreRef.current;
        const difference = target - current;
        if (Math.abs(difference) < 1) {
          movementScoreRef.current = target;
          return target;
        }
        const step = Math.sign(difference) * Math.min(Math.abs(difference), 2);
        const nextScore = Math.max(0, Math.min(100, current + step));
        movementScoreRef.current = nextScore;
        return nextScore;
      });
    }, 240);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (scoreTimerRef.current) window.clearInterval(scoreTimerRef.current);
      detectorRef.current?.dispose?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      coachVoiceEngineRef.current?.current?.stop();
      if (coachCueCooldownTimerRef.current) window.clearTimeout(coachCueCooldownTimerRef.current);
      if (analysisWindowTimerRef.current) window.clearInterval(analysisWindowTimerRef.current);
      coachVoiceEngineRef.current?.context.close();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const savedWarmups = window.localStorage.getItem("ritim-kapisi-warmup-completed");
    if (!savedWarmups) return;

    try {
      const parsed = JSON.parse(savedWarmups) as WarmupLessonId[];
      setCompletedWarmups(parsed.filter((id) => warmupLessons.some((lesson) => lesson.id === id)));
    } catch {
      window.localStorage.removeItem("ritim-kapisi-warmup-completed");
    }
  }, []);

  useEffect(() => {
    targetScoreRef.current = 42;
    movementScoreRef.current = 42;
    capturedMovementRef.current = null;
    setMovementScore(42);
    setSnapshotState("bekliyor");
    previousPoseRef.current = null;
    setLiveFeedback("Tam bedenini kadraja al ve öğretmeni aynala.");
    setScoreBreakdown({ form: 0, rhythm: 0, balance: 0 });
    analysisWindowStateRef.current = "idle";
    analysisWindowSamplesRef.current = [];
    analysisWindowStartedAtRef.current = null;
    if (analysisWindowTimerRef.current) window.clearInterval(analysisWindowTimerRef.current);
    setAnalysisWindowState("idle");
    setAnalysisWindowProgress(0);
    setAnalysisWindowResult(null);
  }, [activeWarmupId, movement.id, practiceLearningMode]);

  useEffect(() => {
    if (practiceLearningMode === "shibashi" && phase === "live" && voiceStatus === "aktif") {
      window.setTimeout(() => {
        playCoachCue("start", `Canlı pratik başladı. Şimdi ${movement.name}. ${movement.cue} ${getMovementBreathCue(movement.id)}`);
      }, 900);
    }
  }, [movement.cue, movement.id, movement.name, phase, practiceLearningMode, voiceStatus]);

  useEffect(() => {
    if (practiceLearningMode !== "shibashi" || phase !== "live" || voiceStatus !== "aktif") return;

    let index = 0;
    const speakMovementCue = () => {
      const currentScore = movementScoreRef.current;
      const cues = [
        "Çok iyi. Nefesi yumuşat. Hareketi acele ettirme.",
        "Omuzları bırak. Dizler kilitlenmesin. Ağırlığı sessizce taşı.",
        `${movement.name}. Referans görsele bak. Aynı akışı yavaşça yakala.`,
        currentScore >= 80 ? "Harika. Yüzde seksenin üstündesin. Bu form kabul." : "Güzel gidiyor. Biraz daha yavaşla ve merkezi koru.",
      ];
      const cueFile = currentScore >= 80 ? "ok" : cueIndexRef.current % 2 === 0 ? "soft" : "align";
      playCoachCue(cueFile, cues[index % cues.length]);
      cueIndexRef.current += 1;
      index += 1;
    };
    const firstCueTimer = window.setTimeout(speakMovementCue, 8600);
    const timer = window.setInterval(speakMovementCue, selectedCoach.cadenceMs);

    return () => {
      window.clearTimeout(firstCueTimer);
      window.clearInterval(timer);
    };
  }, [movement.name, phase, practiceLearningMode, selectedCoach.cadenceMs, selectedCoach.id, voiceStatus]);

  useEffect(() => {
    if (cameraStatus !== "ready") {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      targetScoreRef.current = 42;
      setMovementScore(42);
      setKeypoints([]);
      drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
      setPoseStatus("bekliyor");
      setSnapshotState("bekliyor");
      analysisWindowStateRef.current = "idle";
      analysisWindowSamplesRef.current = [];
      analysisWindowStartedAtRef.current = null;
      if (analysisWindowTimerRef.current) window.clearInterval(analysisWindowTimerRef.current);
      setAnalysisWindowState("idle");
      setAnalysisWindowProgress(0);
      setAnalysisWindowResult(null);
      return;
    }

    let cancelled = false;
    void startMoveNetLoop(() => cancelled);

    return () => {
      cancelled = true;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [cameraStatus]);

  useEffect(() => {
    if (practiceLearningMode !== "shibashi" || cameraStatus !== "ready" || movementScore < 80) return;
    const captureKey = `${movement.id}-${new Date().toLocaleDateString("tr-TR")}`;
    if (capturedMovementRef.current === captureKey) return;

    capturedMovementRef.current = captureKey;
    const snapshot = createPracticeSnapshot(videoRef.current, movement, movementScore, selectedShen.name);
    if (snapshot) {
      onSnapshotCaptured(snapshot);
      setSnapshotState("kaydedildi");
      playCoachCue("ok", "Harika. Yüzde seksenin üstündesin. Bu form kabul edildi ve galeriye kaydedildi.");
    }
  }, [cameraStatus, movement, movementScore, onSnapshotCaptured, practiceLearningMode, selectedShen.name]);

  async function startMoveNetLoop(isCancelled: () => boolean) {
    const video = videoRef.current;
    if (!video) return;

    try {
      setPoseStatus("yükleniyor");
      detectorRef.current ??= await createMoveNetDetector();
      setPoseStatus("aktif");

      const detect = async () => {
        if (isCancelled() || !videoRef.current || cameraStatus !== "ready") return;

        const poses = await detectorRef.current?.estimatePoses(videoRef.current, { flipHorizontal: false });
        const pose = poses?.[0];
        syncPoseCanvasSize(canvasRef.current, videoRef.current);

        if (!pose?.keypoints?.length) {
          setPoseStatus("beden-yok");
          setKeypoints([]);
          drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
          targetScoreRef.current = 18;
        } else {
          setPoseStatus("aktif");
          setKeypoints(pose.keypoints);
          drawPoseCanvas(canvasRef.current, pose, selectedShen.color);
          const now = performance.now();
          const match = scoreLiveMovementMatch(
            pose.keypoints,
            previousPoseRef.current,
            practiceLearningModeRef.current === "preparation" ? activeWarmupIdRef.current : movement.id,
          );
          previousPoseRef.current = { keypoints: pose.keypoints, at: now };
          if (analysisWindowStateRef.current === "recording") {
            analysisWindowSamplesRef.current.push(match);
          }
          targetScoreRef.current = match.total;
          setLiveFeedback(match.feedback);
          setScoreBreakdown({ form: match.form, rhythm: match.rhythm, balance: match.balance });
        }

        rafRef.current = window.requestAnimationFrame(detect);
      };

      rafRef.current = window.requestAnimationFrame(detect);
    } catch {
      setPoseStatus("hata");
    }
  }

  function startMovementAnalysisWindow() {
    if (!isCameraReady || poseStatus !== "aktif") {
      setLiveFeedback("Önce kamerada tam bedenini görünür hale getir.");
      return;
    }

    if (analysisWindowTimerRef.current) window.clearInterval(analysisWindowTimerRef.current);
    analysisWindowStateRef.current = "recording";
    analysisWindowSamplesRef.current = [];
    analysisWindowStartedAtRef.current = performance.now();
    setAnalysisWindowState("recording");
    setAnalysisWindowProgress(0);
    setAnalysisWindowResult(null);
    setLiveFeedback("Üç saniye başladı. Referans hareketi yavaşça aynala.");

    analysisWindowTimerRef.current = window.setInterval(() => {
      const startedAt = analysisWindowStartedAtRef.current ?? performance.now();
      const progress = Math.min(100, ((performance.now() - startedAt) / 3000) * 100);
      setAnalysisWindowProgress(progress);
      if (progress >= 100) finishMovementAnalysisWindow();
    }, 80);
  }

  function finishMovementAnalysisWindow() {
    if (analysisWindowStateRef.current !== "recording") return;
    if (analysisWindowTimerRef.current) window.clearInterval(analysisWindowTimerRef.current);

    const samples = analysisWindowSamplesRef.current;
    analysisWindowStateRef.current = "complete";
    analysisWindowStartedAtRef.current = null;
    setAnalysisWindowProgress(100);

    if (!samples.length) {
      analysisWindowStateRef.current = "idle";
      setAnalysisWindowState("idle");
      setLiveFeedback("Bu üç saniyede bedenin görünmedi. Biraz geri çekilip tekrar dene.");
      return;
    }

    const result = {
      total: Math.round(samples.reduce((sum, item) => sum + item.total, 0) / samples.length),
      form: Math.round(samples.reduce((sum, item) => sum + item.form, 0) / samples.length),
      rhythm: Math.round(samples.reduce((sum, item) => sum + item.rhythm, 0) / samples.length),
      balance: Math.round(samples.reduce((sum, item) => sum + item.balance, 0) / samples.length),
      samples: samples.length,
    } satisfies MovementAnalysisWindowResult;

    setAnalysisWindowResult(result);
    setAnalysisWindowState("complete");
    setLiveFeedback(result.total >= 80 ? "Üç saniyelik akışın referans formuyla iyi buluştu." : "Akışın temeli var. Biraz daha yavaşla ve merkezi koru.");
    playCoachCue(
      result.total >= 80 ? "ok" : "soft",
      `Üç saniyelik analiz tamamlandı. Hareket uyumun yüzde ${result.total}.`,
    );
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unsupported");
      return false;
    }

    if (streamRef.current) {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }
      setCameraStatus("ready");
      return true;
    }

    try {
      setCameraStatus("requesting");
      onStopMusic();

      // Some embedded browsers reject the portrait/framerate hints even though
      // they can open the camera. Retry with progressively simpler constraints.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 720 },
            height: { ideal: 1280 },
            aspectRatio: { ideal: 0.75 },
            frameRate: { ideal: 30, max: 30 },
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "user" },
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          const video = videoRef.current;
          if (!video) return resolve();
          if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            resolve();
            return;
          }
          video.onloadedmetadata = () => resolve();
          window.setTimeout(resolve, 1500);
        });
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraStatus("ready");
      targetScoreRef.current = 42;
      movementScoreRef.current = 42;
      setMovementScore(42);
      setSnapshotState("bekliyor");
      setVoiceStatus("aktif");
      setCoachLine("Kamera açık. Sesli rehber seni 2-3 metre mesafeden yönlendirecek.");
      return true;
    } catch (error) {
      setCameraStatus("denied");
      const errorName = error instanceof DOMException ? error.name : "";
      const message = errorName === "NotAllowedError"
        ? "Kamera izni kapalı. Tarayıcı adres çubuğundaki kamera simgesinden izin verip tekrar dene."
        : "Kamera açılamadı. Başka bir uygulama kamerayı kullanıyor olabilir; tekrar dene.";
      setCoachLine(message);
      speakCoach(message);
      return false;
    }
  }

  async function handlePracticeStart() {
    if (cameraStatus !== "ready") {
      const cameraStarted = await startCamera();
      if (!cameraStarted) return;
      if (phase === "ready") {
        playCoachCueForCoach(
          "calibration",
          "Kalibrasyon başladı. İki-üç metre mesafede dur. Başını ve ayaklarını kadraja al. Hazır olduğunda Canlı Başlat düğmesine bas.",
          selectedCoach,
          true,
        );
        onStart();
      }
      return;
    }

    onStart();
    if (phase === "calibrate") {
      playCoachCueForCoach(
        "start",
        "Canlı başlatıldı. Çok iyi. İki-üç metre mesafeyi koru. Yavaş hareket et; nefesin hareketi taşısın.",
        selectedCoach,
        true,
      );
    }
  }

  function shutdownCamera(completePractice: boolean) {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
    setCameraStatus("idle");
    setKeypoints([]);
    targetScoreRef.current = 42;
    movementScoreRef.current = 42;
    setMovementScore(42);
    setPoseStatus("bekliyor");
    setSnapshotState("bekliyor");
    setVoiceStatus("sessiz");
    stopCoachVoice();
    if (completePractice) {
      onComplete();
    }
  }

  function stopCamera() {
    shutdownCamera(true);
  }

  function beginPostureAssessment() {
    setPostureCaptures({});
    setPostureResult(null);
    setPostureMode("3d");
    setPostureView("front");
    setPostureStep("intro");
    setCoachLine("Önce postür analizi alınacak. Kamerada bütün beden görünmeli.");
  }

  async function openPostureCamera() {
    setPostureStep("front");
    setPostureView("front");
    const cameraStarted = await startCamera();
    if (!cameraStarted) {
      setPostureStep("intro");
      return;
    }
    setCoachLine("Ön görünüm hazır. Ayaklar dahil tam beden kadrajda kalsın.");
    playCoachCueForCoach(
      "calibration",
      "Postür analizi başladı. Kameradan iki-üç metre uzaklaş. Başın ve ayakların aynı anda görünsün.",
      selectedCoach,
      true,
    );
  }

  function captureCurrentPosture() {
    if (postureStep !== "front" && postureStep !== "side" && postureStep !== "back") return;
    const view = postureStep;
    const analysis = toPostureAnalysisSnapshot(analyzePosture(keypoints, movementScore, selectedShen.id, view));
    const capture = createPostureCapture(videoRef.current, keypoints, view, analysis, selectedShen.color);
    if (!capture) {
      setCoachLine("Görüntü alınamadı. Kamerada bütün beden göründüğünde tekrar dene.");
      return;
    }

    const nextCaptures = { ...postureCaptures, [view]: capture };
    setPostureCaptures(nextCaptures);

    if (view === "front") {
      setPostureView("side");
      setPostureStep("side");
      setCoachLine("Şimdi yan görünüm. Telefona yan dön, baş-göğüs-pelvis aynı eksende kalsın.");
      speakPostureTransition("Şimdi yana dön. Başın, göğsün ve pelvisin aynı eksende kalsın.");
      return;
    }

    if (view === "side") {
      setPostureView("back");
      setPostureStep("back");
      setCoachLine("Son kayıt: arka görünüm. Sağ-sol yük dağılımını eşitle ve sabit dur.");
      speakPostureTransition("Şimdi arkanı dön. Başın ve ayakların kadrajda kalsın; iki saniye sabit dur.");
      return;
    }

    if (nextCaptures.front && nextCaptures.side && nextCaptures.back) {
      const report = buildPostureReport(nextCaptures as Record<PostureView, PostureAssessmentCapture>, latestPostureReport);
      setPostureResult(report);
      setPostureStep("result");
      shutdownCamera(false);
      setCoachLine("Postür raporu hazır. Kaydedersen tarihsel gelişim çizgisine eklenecek.");
    }
  }

  function saveCurrentPostureReport() {
    if (!postureResult) return;
    onPostureReportCaptured(postureResult);
    setPostureStep("idle");
    setPostureResult(null);
    setPostureCaptures({});
  }

  function closePostureAssessment() {
    shutdownCamera(false);
    setPostureStep("idle");
    setPostureResult(null);
    setPostureCaptures({});
  }

  function togglePracticeMusic() {
    if (musicState === "açık") {
      onStopMusic();
      return;
    }

    onPlayMusic();
  }

  async function startWarmupTracking() {
    const cameraStarted = await startCamera();
    if (!cameraStarted) return;
    setCoachLine(`${activeWarmup.title} takibi başladı. ${activeWarmup.cameraCue}`);
    playCoachCueForCoach(
      "start",
      `${activeWarmup.title} başladı. İki-üç metre mesafede, başın ve ayakların kadrajda kalsın. ${activeWarmup.cameraCue} ${activeWarmup.breathCue}`,
      selectedCoach,
      true,
    );
  }

  function completeWarmupLesson() {
    const nextCompleted = completedWarmups.includes(activeWarmup.id)
      ? completedWarmups
      : [...completedWarmups, activeWarmup.id];
    setCompletedWarmups(nextCompleted);
    window.localStorage.setItem("ritim-kapisi-warmup-completed", JSON.stringify(nextCompleted));

    const nextLesson = warmupLessons.find((lesson) => !nextCompleted.includes(lesson.id));
    if (nextLesson) {
      setActiveWarmupId(nextLesson.id);
      return;
    }

    setPracticeLearningMode("shibashi");
    setCoachLine("Hazırlık tamam. Şimdi 18 hareketlik Shibashi akışına geçiyoruz.");
  }

  function stopCoachVoice() {
    coachCueQueueRef.current = [];
    coachCuePlayingRef.current = false;
    if (coachCueCooldownTimerRef.current) {
      window.clearTimeout(coachCueCooldownTimerRef.current);
      coachCueCooldownTimerRef.current = null;
    }
    try {
      coachVoiceEngineRef.current?.current?.stop();
    } catch {
      // Source may already be stopped by the browser.
    }
    if (coachVoiceEngineRef.current) {
      coachVoiceEngineRef.current.current = null;
    }
    window.speechSynthesis?.cancel();
  }

  function toggleVoiceCommands() {
    if (voiceStatus === "aktif") {
      setVoiceStatus("sessiz");
      stopCoachVoice();
      setCoachLine("Sesli komutlar kapalı. İstersen tekrar açabilirsin.");
      return;
    }

    setVoiceStatus("aktif");
    playCoachCueForCoach(
      "start",
      `Sesli komutlar açık. ${selectedCoach.name} hazır. Şimdi ${movement.name}: ${movement.cue}`,
      selectedCoach,
      true,
    );
  }

  function playCoachCue(_name: CoachCueName, fallbackText: string) {
    playCoachCueForCoach(_name, fallbackText, selectedCoach);
  }

  function speakPostureTransition(text: string) {
    if (voiceStatus !== "aktif") return;

    coachCueQueueRef.current = [];
    coachVoiceEngineRef.current?.current?.stop();
    window.speechSynthesis?.cancel();
    setCoachLine(`${selectedCoach.name}: ${text}`);
    coachCuePlayingRef.current = true;
    void speakCoachCue(text, selectedCoach).finally(() => {
      coachCuePlayingRef.current = false;
      coachCueNextAllowedAtRef.current = Date.now() + 1800;
    });
  }

  function playCoachCueForCoach(
    name: CoachCueName,
    fallbackText: string,
    coach: AiCoach,
    force = false,
  ) {
    const styledText = styleCoachCue(fallbackText, coach);
    const text = `${coach.name}: ${styledText}`;
    setCoachLine(text);
    if (voiceStatus !== "aktif" && !force) return;

    if (force) {
      coachCueQueueRef.current = [];
      coachCueNextAllowedAtRef.current = Date.now();
    }

    coachCueQueueRef.current = [...coachCueQueueRef.current, { coach, force, name, text: styledText }].slice(-2);
    void pumpCoachCueQueue();
  }

  async function pumpCoachCueQueue() {
    if (coachCuePlayingRef.current) return;
    const nextCue = coachCueQueueRef.current.shift();
    if (!nextCue) return;

    const waitMs = Math.max(0, coachCueNextAllowedAtRef.current - Date.now());
    if (waitMs > 0) {
      coachCueQueueRef.current.unshift(nextCue);
      if (!coachCueCooldownTimerRef.current) {
        coachCueCooldownTimerRef.current = window.setTimeout(() => {
          coachCueCooldownTimerRef.current = null;
          void pumpCoachCueQueue();
        }, waitMs);
      }
      return;
    }

    coachCuePlayingRef.current = true;
    const playedAudio = await playCoachAudioFile(nextCue.name, nextCue.coach);
    if (!playedAudio) {
      await speakCoachCue(nextCue.text, nextCue.coach);
    }
    coachCuePlayingRef.current = false;
    coachCueNextAllowedAtRef.current = Date.now() + getCoachSilenceMs(nextCue.coach, nextCue.name);

    if (coachCueQueueRef.current.length) {
      coachCueCooldownTimerRef.current = window.setTimeout(() => {
        coachCueCooldownTimerRef.current = null;
        void pumpCoachCueQueue();
      }, getCoachSilenceMs(nextCue.coach, nextCue.name));
    }
  }

  async function playCoachAudioFile(name: CoachCueName, coach: AiCoach) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    try {
      if (!coachVoiceEngineRef.current) {
        const context = new AudioContextClass();
        const gain = context.createGain();
        gain.gain.value = 1;
        gain.connect(context.destination);
        coachVoiceEngineRef.current = {
          buffers: new Map(),
          context,
          current: null,
          gain,
        };
      }

      const engine = coachVoiceEngineRef.current;
      if (engine.context.state === "suspended") {
        await engine.context.resume();
      }

      const src = `/audio/coach/tr/${name}.m4a?v=${coachVoiceVersion}`;
      let buffer = engine.buffers.get(src);
      if (!buffer) {
        const response = await fetch(src);
        const data = await response.arrayBuffer();
        buffer = await engine.context.decodeAudioData(data.slice(0));
        engine.buffers.set(src, buffer);
      }

      engine.current?.stop();
      const source = engine.context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = Math.max(0.68, Math.min(0.94, coach.rate));
      if ("detune" in source) {
        source.detune.value = coach.detune;
      }
      const toneFilter = engine.context.createBiquadFilter();
      toneFilter.type = "peaking";
      toneFilter.frequency.value = coach.filterFrequency;
      toneFilter.Q.value = 0.72;
      toneFilter.gain.value = coach.filterGain;
      source.connect(toneFilter);
      toneFilter.connect(engine.gain);
      source.start();
      engine.current = source;
      await new Promise<void>((resolve) => {
        const fallbackTimer = window.setTimeout(resolve, Math.min(9000, ((buffer?.duration ?? 3) / source.playbackRate.value) * 1000 + 900));
        source.onended = () => {
          window.clearTimeout(fallbackTimer);
          if (engine.current === source) engine.current = null;
          resolve();
        };
      });
      return true;
    } catch {
      return false;
    }
  }

  if (postureStep !== "idle") {
    return (
      <PostureAssessmentScreen
        cameraStatus={cameraStatus}
        canvasRef={canvasRef}
        captures={postureCaptures}
        keypoints={keypoints}
        mode={postureMode}
        movementScore={movementScore}
        onCapture={captureCurrentPosture}
        onClose={closePostureAssessment}
        onModeChange={setPostureMode}
        onOpenCamera={openPostureCamera}
        onRetake={() => {
          setPostureCaptures({});
          setPostureResult(null);
          setPostureStep("intro");
          setPostureView("front");
        }}
        onSaveReport={saveCurrentPostureReport}
        onViewChange={setPostureView}
        poseStatus={poseStatus}
        report={postureResult}
        selectedShen={selectedShen}
        step={postureStep}
        videoRef={videoRef}
        view={postureView}
      />
    );
  }

  if (practiceLearningMode === "preparation") {
    return (
      <WarmupStudio
        activeLesson={activeWarmup}
        cameraStatus={cameraStatus}
        canvasRef={canvasRef}
        completedLessons={completedWarmups}
        movementScore={movementScore}
        liveFeedback={liveFeedback}
        pose={keypoints}
        analysisWindowProgress={analysisWindowProgress}
        analysisWindowResult={analysisWindowResult}
        analysisWindowState={analysisWindowState}
        scoreBreakdown={scoreBreakdown}
        onCompleteLesson={completeWarmupLesson}
        onEnterShibashi={() => setPracticeLearningMode("shibashi")}
        onOpenCamera={startWarmupTracking}
        onSelectLesson={setActiveWarmupId}
        poseStatus={poseStatus}
        onStartMovementAnalysis={startMovementAnalysisWindow}
        selectedShen={selectedShen}
        videoRef={videoRef}
      />
    );
  }

  return (
    <section className="screen practice-screen">
      <div className={`movement-card ${isCameraReady ? "movement-card-live" : "movement-card-prep"}`}>
        <div className={`camera-stage ${isCameraReady ? "camera-stage-live" : "camera-stage-prep"}`}>
          {!isCameraReady ? (
            <InnerGatePracticeFrame
              completion={completion}
              movement={movement}
              referenceImage={referenceImage}
              scene={innerScene}
              selectedShen={selectedShen}
            />
          ) : null}
          <video
            className={`camera-preview ${isCameraReady ? "camera-preview-active" : ""}`}
            muted
            playsInline
            ref={videoRef}
          />
          <canvas className="camera-pose-canvas" ref={canvasRef} />
          {isCameraReady ? (
              <div className="camera-overlay">
                <div className="scan-frame" />
                <div className="camera-framing-guide">
                  <strong>Baş + ayaklar</strong>
                  <span>2-3 metre • tam beden</span>
                </div>
                <div className="camera-pill">{getCameraStatus(cameraStatus, phase)}</div>
              <div className="pose-pill">{getPoseStatusText(poseStatus)}</div>
              <div className={`score-badge ${movementScore >= 80 ? "score-badge-ok" : ""}`}>
                <strong>{movementScore}%</strong>
                <span>{movementScore >= 80 ? "UYUMLU" : "HAREKET UYUMU"}</span>
              </div>
              <div className="practice-live-feedback">{liveFeedback}</div>
              <div className="practice-score-breakdown">
                <span>Form <b>{scoreBreakdown.form}</b></span>
                <span>Ritim <b>{scoreBreakdown.rhythm}</b></span>
                <span>Denge <b>{scoreBreakdown.balance}</b></span>
              </div>
              {snapshotState === "kaydedildi" ? <div className="snapshot-pill">Galeriye kaydedildi</div> : null}
              <div className="distance-pill">Boydan kadraj için 2-3 metre geri çekil</div>
            </div>
          ) : null}
        </div>
        <div className="movement-body">
          <div className="practice-mode-row">
            <button onClick={() => setPracticeLearningMode("preparation")} type="button">Hazırlığa dön</button>
            <a href={`https://www.youtube.com/watch?v=${shibashiFullSetVideoId}`} onClick={onStopMusic} rel="noreferrer" target="_blank">Tam set videosu ↗</a>
          </div>
          <div>
            <span className="eyebrow">Hareket {movement.id} / 18</span>
            <h1 className="hero-title" style={{ fontSize: "1.9rem" }}>
              {movement.name}
            </h1>
            <p className="hero-copy">{movement.english}</p>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${completion}%` }} />
          </div>
          {!isCameraReady ? (
            <InnerJourneyStatus completion={completion} scene={innerScene} selectedShen={selectedShen} />
          ) : null}
          {isCameraReady ? (
            <div className="reference-panel practice-reference-panel">
              <img src={referenceImage} alt={`${movement.name} referans hareketi`} />
              <div>
                <span className="eyebrow">Foto Referans</span>
                <h2>{movement.name}</h2>
                <p>{movement.cue}</p>
                <div className="reference-meta">
                  <span>{movement.focus}</span>
                  <span>{movementScore >= 80 ? "OK için yeterli" : "%80 hedef"}</span>
                </div>
              </div>
            </div>
          ) : null}
          <div className="breath-sync-card">
            <span>Nefes • hareket senkronu</span>
            <strong>{getMovementBreathCue(movement.id)}</strong>
          </div>
          {isCameraReady ? (
            <div className="practice-status-card">
              <div>
                <span className="eyebrow">Canlı Takip</span>
                <strong>{getPracticeMessage(phase)}</strong>
              </div>
              <span>{movementScore}%</span>
            </div>
          ) : null}
          {isCameraReady ? (
          <MovementAnalysisWindow
            accent={selectedShen.color}
            movementName={movement.name}
            pose={keypoints}
            referenceImage={referenceImage}
            onStart={startMovementAnalysisWindow}
            progress={analysisWindowProgress}
            result={analysisWindowResult}
              state={analysisWindowState}
            />
          ) : null}
          {isCameraReady ? <PracticeGuideCompanion coach={selectedCoach} coachLine={coachLine} voiceStatus={voiceStatus} /> : null}
          <div className={`practice-actions ${isCameraReady ? "practice-actions-live" : "practice-actions-ready"}`}>
            <button className={`${isCameraReady ? "secondary-action" : "primary-action"} practice-control-button practice-camera-button`} onClick={handlePracticeStart} type="button">
              {cameraStatus === "requesting" ? "İzin Bekleniyor" : isCameraReady && phase !== "ready" ? "Canlı Başlat" : "Kamerayı Aç"}
            </button>
            {!isCameraReady ? (
              <button className="secondary-action practice-control-button practice-music-button" onClick={togglePracticeMusic} type="button">
                Müzik {musicState === "açık" ? "Kapat" : "Aç"}
              </button>
            ) : null}
            {isCameraReady ? (
              <>
                <button className={`secondary-action ${voiceStatus === "aktif" ? "voice-action-active" : ""}`} onClick={toggleVoiceCommands} type="button">
                  {voiceStatus === "aktif" ? "Sesli Komut Kapat" : "Sesli Komut Aç"}
                </button>
                <button className="secondary-action" onClick={stopCamera} type="button">
                  Tamamla
                </button>
                <button className="primary-action practice-next-action" onClick={onNext} type="button">
                  Sıradaki Hareket
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <MovementLibraryShowcase activeMovementId={movement.id} onSelectMovement={onSelectMovement} />
    </section>
  );
}

function MovementLibraryShowcase({
  activeMovementId,
  onSelectMovement,
}: {
  activeMovementId: number;
  onSelectMovement: (movementId: number) => void;
}) {
  const [filter, setFilter] = useState<"all" | "beginner" | "flow" | "balance">("all");
  const visibleMovements = movements.filter((item) => {
    if (filter === "beginner") return item.id <= 6;
    if (filter === "flow") return [3, 6, 7, 10, 11, 12, 16, 17].includes(item.id);
    if (filter === "balance") return [4, 5, 9, 13, 15, 18].includes(item.id);
    return true;
  });

  return (
    <section className="movement-library-showcase">
      <div className="section-heading movement-library-heading">
        <div>
          <span className="eyebrow">Hareket Kütüphanesi</span>
          <h2>18 hareket, tek bir akış.</h2>
        </div>
        <span>{visibleMovements.length} hareket</span>
      </div>
      <div className="movement-library-filters" aria-label="Hareket filtreleri">
        {([
          ["all", "Tümü"],
          ["beginner", "Başlangıç"],
          ["flow", "Akış"],
          ["balance", "Denge"],
        ] as const).map(([id, label]) => (
          <button className={filter === id ? "active" : ""} key={id} onClick={() => setFilter(id)} type="button">{label}</button>
        ))}
      </div>
      <div className="movement-library-row">
        {visibleMovements.map((item) => (
          <button
            className={`movement-library-card ${activeMovementId === item.id ? "movement-library-card-active" : ""}`}
            key={item.id}
            onClick={() => onSelectMovement(item.id)}
            type="button"
          >
            <img src={getMovementReferenceImage(item)} alt="" />
            <span className="movement-library-shade" />
            <div>
              <small>{String(item.id).padStart(2, "0")} · {item.focus}</small>
              <strong>{item.name}</strong>
              <em>{item.english}</em>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function WarmupStudio({
  activeLesson,
  cameraStatus,
  canvasRef,
  completedLessons,
  movementScore,
  liveFeedback,
  analysisWindowProgress,
  analysisWindowResult,
  analysisWindowState,
  pose,
  scoreBreakdown,
  onCompleteLesson,
  onEnterShibashi,
  onOpenCamera,
  onSelectLesson,
  onStartMovementAnalysis,
  poseStatus,
  selectedShen,
  videoRef,
}: {
  activeLesson: WarmupLesson;
  cameraStatus: "idle" | "requesting" | "ready" | "denied" | "unsupported";
  canvasRef: RefObject<HTMLCanvasElement | null>;
  completedLessons: WarmupLessonId[];
  movementScore: number;
  liveFeedback: string;
  analysisWindowProgress: number;
  analysisWindowResult: MovementAnalysisWindowResult | null;
  analysisWindowState: MovementAnalysisWindowState;
  pose: PoseKeypoint[];
  scoreBreakdown: { form: number; rhythm: number; balance: number };
  onCompleteLesson: () => void;
  onEnterShibashi: () => void;
  onOpenCamera: () => void;
  onSelectLesson: (id: WarmupLessonId) => void;
  onStartMovementAnalysis: () => void;
  poseStatus: "bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata";
  selectedShen: (typeof fiveShen)[number];
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const isCameraReady = cameraStatus === "ready";
  const allWarmupsComplete = completedLessons.length === warmupLessons.length;
  return (
    <section className="screen warmup-studio">
      <header className="warmup-header">
        <div>
          <span className="eyebrow">Shibashi Öncesi Hazırlık</span>
          <h1>Önce bedeni forma hazırla.</h1>
          <p>Sana önerdiğimiz sırada ilerle: Wuji duruşu, eklem ısınması ve Kua merkezi. Sonra 18 harekete geç.</p>
        </div>
        <div className="warmup-progress">
          <strong>{completedLessons.length}/3</strong>
          <span>hazırlık tamam</span>
        </div>
      </header>

      <div className="warmup-layout">
        <nav className="warmup-lesson-rail" aria-label="Hazırlık dersleri">
          {warmupLessons.map((lesson) => (
            <button
              className={activeLesson.id === lesson.id ? "warmup-lesson-active" : ""}
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              type="button"
            >
              <span>{completedLessons.includes(lesson.id) ? "✓" : lesson.order}</span>
              <div>
                <strong>{lesson.shortTitle}</strong>
                <small>{lesson.focus}</small>
              </div>
            </button>
          ))}
          <button className="warmup-skip" onClick={onEnterShibashi} type="button">
            <span>18</span>
            <div>
              <strong>Shibashi</strong>
              <small>Ana form</small>
            </div>
          </button>
        </nav>

        <main className="warmup-main">
          <div className="warmup-title-row">
            <div>
              <span className="eyebrow">Ders {activeLesson.order} • {activeLesson.focus}</span>
              <h2>{activeLesson.title}</h2>
              <p>{activeLesson.description}</p>
            </div>
            <span className="warmup-shen-chip">Bugün: {selectedShen.dailyName}</span>
          </div>

          <div className="warmup-follow-grid">
            <div className="warmup-video-stage">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                src={`https://www.youtube-nocookie.com/embed/${activeLesson.videoId}?rel=0&modestbranding=1`}
                title={`${activeLesson.title} - Qigong İzmir`}
              />
              <span>Qigong İzmir • Öğretmen videosu</span>
            </div>

            {activeLesson.id === "warmup" ? (
              <div className="warmup-camera-stage warmup-camera-stage-coach">
                <MovementCoach />
              </div>
            ) : (
              <div className={`warmup-camera-stage ${isCameraReady ? "warmup-camera-live" : ""}`}>
                <video className={`camera-preview ${isCameraReady ? "camera-preview-active" : ""}`} muted playsInline ref={videoRef} />
                <canvas className="camera-pose-canvas" ref={canvasRef} />
                {!isCameraReady ? (
                  <div className="warmup-camera-placeholder">
                    <strong>Videoyu izle, sonra aynala.</strong>
                    <span>
                      {cameraStatus === "denied"
                        ? "Kamera izni kapalı ya da kamera başka bir uygulamada kullanılıyor. İzni açıp tekrar dene."
                        : cameraStatus === "unsupported"
                          ? "Bu tarayıcı kamera erişimini desteklemiyor. Safari veya Chrome ile tekrar aç."
                          : "Kamerayı açınca bedenin videonun yanında canlı olarak takip edilir."}
                    </span>
                    <button onClick={onOpenCamera} type="button">
                      {cameraStatus === "requesting" ? "Kamera izni bekleniyor" : cameraStatus === "denied" ? "Tekrar Dene" : "Kamerayı Aç"}
                    </button>
                  </div>
                ) : (
                  <div className="warmup-camera-overlay">
                    <div className="warmup-camera-distance">2-3 metre • baş ve ayaklar kadrajda</div>
                    <div className={`warmup-live-score ${movementScore >= 80 ? "warmup-live-score-ok" : ""}`}>
                      <strong>{movementScore}</strong>
                      <span>/100 uyum</span>
                    </div>
                    <span>{getPoseStatusText(poseStatus)}</span>
                    <div className="live-match-feedback">{liveFeedback}</div>
                    <div className="live-match-breakdown">
                      <span>Form <b>{scoreBreakdown.form}</b></span>
                      <span>Ritim <b>{scoreBreakdown.rhythm}</b></span>
                      <span>Denge <b>{scoreBreakdown.balance}</b></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="warmup-guidance-row">
            <div>
              <span>BEDEN İPUCU</span>
              <strong>{activeLesson.cameraCue}</strong>
            </div>
            <div>
              <span>NEFES İPUCU</span>
              <strong>{activeLesson.breathCue}</strong>
            </div>
          </div>

          <MovementAnalysisWindow
            accent={selectedShen.color}
            movementName={activeLesson.title}
            pose={pose}
            referenceImage={getWarmupReferenceImage(activeLesson.id)}
            disabled={!isCameraReady}
            onStart={onStartMovementAnalysis}
            progress={analysisWindowProgress}
            result={analysisWindowResult}
            state={analysisWindowState}
          />

          <div className="warmup-actions warmup-actions-end">
            <button onClick={onCompleteLesson} type="button">
              {allWarmupsComplete ? "18 Harekete Geç" : completedLessons.includes(activeLesson.id) ? "Sonraki Derse Geç" : "Dersi Tamamla"}
            </button>
          </div>
        </main>
      </div>
    </section>
  );
}

function MovementAnalysisWindow({
  accent,
  disabled = false,
  movementName,
  onStart,
  pose,
  progress,
  referenceImage,
  result,
  state,
}: {
  accent: string;
  disabled?: boolean;
  movementName: string;
  onStart: () => void;
  pose: PoseKeypoint[];
  progress: number;
  referenceImage: string;
  result: MovementAnalysisWindowResult | null;
  state: MovementAnalysisWindowState;
}) {
  const isRecording = state === "recording";
  const isComplete = state === "complete" && result;

  return (
    <section className={`movement-analysis-window movement-analysis-window-${state}`}>
      <div className="movement-analysis-window-visual">
        <div className="movement-analysis-window-reference">
          <img src={referenceImage} alt={`${movementName} hareket referansı`} />
          <span>Referans</span>
        </div>
        <div className="movement-analysis-window-3d">
          <LivePose3D accent={accent} active={isRecording || pose.length > 0} pose={pose} />
          <span>Canlı 3D ayna</span>
        </div>
      </div>
      <div className="movement-analysis-window-copy">
        <span className="eyebrow">3 Saniyelik Analiz</span>
        <strong>
          {isRecording ? "Hareketi şimdi aynala." : isComplete ? "Kısa hareket tamamlandı." : "Kısa hareketi aynala."}
        </strong>
        <small>
          {isRecording
            ? "Form, ritim ve denge ölçülüyor. Akışı yavaş ve kesintisiz tut."
            : "Videodaki hareketi izlerken üç saniyelik akışını seçili referansla karşılaştır."}
        </small>
      </div>
      <button disabled={disabled || isRecording} onClick={onStart} type="button">
        {isRecording ? `${Math.max(1, Math.ceil(3 - (progress / 100) * 3))} sn ölçülüyor` : isComplete ? "Tekrar analiz" : "3 sn analiz et"}
      </button>
      {isRecording ? (
        <div className="movement-analysis-window-progress" aria-label="Analiz ilerlemesi">
          <i style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {isComplete ? (
        <div className="movement-analysis-window-result">
          <strong>%{result.total}</strong>
          <span>Form {result.form} · Ritim {result.rhythm} · Denge {result.balance}</span>
        </div>
      ) : null}
    </section>
  );
}

function PracticeGuideCompanion({
  coach,
  coachLine,
  voiceStatus,
}: {
  coach: AiCoach;
  coachLine: string;
  voiceStatus: "sessiz" | "aktif";
}) {
  return (
    <div className="practice-guide-companion">
      <span className={`coach-portrait coach-portrait-${coach.imageIndex}`} />
      <div>
        <span className="eyebrow">Yolculuk Rehberi</span>
        <strong>{coach.name} sana eşlik ediyor.</strong>
        <small>{voiceStatus === "aktif" ? coachLine : `${coach.role}. Sesli komutları açınca bu tonla yönlendirecek.`}</small>
      </div>
    </div>
  );
}

function InnerGatePracticeFrame({
  completion,
  movement,
  referenceImage,
  scene,
  selectedShen,
}: {
  completion: number;
  movement: Movement;
  referenceImage: string;
  scene: InnerJourneyScene;
  selectedShen: (typeof fiveShen)[number];
}) {
  return (
    <div
      className="inner-gate-frame"
      style={
        {
          "--inner-progress": `${completion}%`,
          "--inner-node-x": `${scene.x}%`,
          "--inner-node-y": `${scene.y}%`,
          "--shen-card-accent": selectedShen.color,
        } as CSSProperties
      }
    >
      <img className="inner-gate-image" src="/images/inner-gate-path.png" alt="İç yol kapısı" />
      <div className="inner-gate-shade" />
      <div className="inner-gate-path-glow">
        <span />
      </div>
      <div className="inner-gate-node">
        <i />
      </div>
      <div className="inner-gate-copy">
        <span className="eyebrow">Bugünkü İç Yol</span>
        <h2>{scene.title}</h2>
        <p>{scene.encounter}</p>
      </div>
      <div className="inner-gate-form-card">
        <img src={referenceImage} alt={`${movement.name} form referansı`} />
        <div>
          <span className="eyebrow">İlk Form</span>
          <strong>{movement.name}</strong>
          <small>{movement.cue}</small>
        </div>
      </div>
      <div className="inner-gate-meta">
        <span>{scene.gate}</span>
        <strong>{completion}%</strong>
      </div>
    </div>
  );
}

function InnerJourneyStatus({
  completion,
  scene,
  selectedShen,
}: {
  completion: number;
  scene: InnerJourneyScene;
  selectedShen: (typeof fiveShen)[number];
}) {
  return (
    <div className="inner-journey-status">
      <div>
        <span className="eyebrow">Kapıya Giriş</span>
        <strong>{scene.gate}: {scene.title}</strong>
        <p>{scene.bodyHint}</p>
      </div>
      <div className="inner-journey-mini-map" aria-hidden="true">
        {innerJourneyScenes.map((item) => (
          <span
            className={item.id === scene.id ? "inner-mini-active" : ""}
            key={item.id}
            style={{ "--dot-accent": item.id === scene.id ? selectedShen.color : "rgba(246, 239, 228, 0.38)" } as CSSProperties}
          />
        ))}
      </div>
      <div className="inner-journey-ritual">
        <span>{completion}% yol</span>
        <p>{scene.ritual}</p>
      </div>
    </div>
  );
}

function PostureEntryCard({ latestReport, onStart }: { latestReport?: PostureReport; onStart: () => void }) {
  return (
    <div className="posture-entry-card">
      <div>
        <span className="eyebrow">Postür Analizi</span>
        <strong>{latestReport ? `Son rapor: ${latestReport.score}` : "İlk canlı pratikten önce postürünü alalım."}</strong>
        <p>
          {latestReport
            ? `${latestReport.dateKey} • ${latestReport.trendText}`
            : "Kamera tam beden kadrajı kuracak; ön, yan ve arka görünümden ayrı kayıt alacağız."}
        </p>
      </div>
      <button className="secondary-action practice-control-button" onClick={onStart} type="button">
        {latestReport ? "Yeniden Analiz" : "Postür Analizi"}
      </button>
    </div>
  );
}

function PostureAssessmentScreen({
  autoCaptureProgress,
  cameraStatus,
  canvasRef,
  captureFlash = false,
  captures,
  capturedView = null,
  keypoints,
  mode,
  movementScore,
  onCapture,
  onClose,
  onCompleteAnalysis,
  onModeChange,
  onOpenCamera,
  onDeleteSavedReport,
  onOpenSavedReport,
  onRetake,
  onSaveReport,
  onSetTrainerVisibility,
  onShowHistory,
  onViewChange,
  poseStatus,
  report,
  reportIsSaved = false,
  savedReports = [],
  selectedShen,
  step,
  videoRef,
  view,
}: {
  autoCaptureProgress?: number;
  cameraStatus: "idle" | "requesting" | "ready" | "denied" | "unsupported";
  canvasRef: RefObject<HTMLCanvasElement | null>;
  captureFlash?: boolean;
  captures: Partial<Record<PostureView, PostureAssessmentCapture>>;
  capturedView?: PostureView | null;
  keypoints: PoseKeypoint[];
  mode: PostureRenderMode;
  movementScore: number;
  onCapture: () => void;
  onClose: () => void;
  onCompleteAnalysis?: () => void;
  onModeChange: (mode: PostureRenderMode) => void;
  onOpenCamera: () => void;
  onDeleteSavedReport?: (reportId: string) => void;
  onOpenSavedReport?: (report: PostureReport) => void;
  onRetake: () => void;
  onSaveReport: () => void;
  onSetTrainerVisibility?: (reportId: string, trainerVisible: boolean) => void;
  onShowHistory?: () => void;
  onViewChange: (view: PostureView) => void;
  poseStatus: "bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata";
  report: PostureReport | null;
  reportIsSaved?: boolean;
  savedReports?: PostureReport[];
  selectedShen: (typeof fiveShen)[number];
  step: PostureAssessmentStep;
  videoRef: RefObject<HTMLVideoElement | null>;
  view: PostureView;
}) {
  const activeView = step === "front" || step === "side" || step === "back" ? step : view;
  const activeLabel = activeView === "front" ? "Ön" : activeView === "side" ? "Yan" : "Arka";
  const captureCount = (["front", "side", "back"] as const).filter((item) => captures[item]).length;
  const canCapture = cameraStatus === "ready" && poseStatus === "aktif";
  const liveAnalysis = analyzePosture(keypoints, movementScore, selectedShen.id, activeView);
  const postureScore = getPostureOverallScore(liveAnalysis);
  const postureReady = cameraStatus === "ready" && poseStatus === "aktif";
  const autoCaptureInstruction =
    activeView === "front" ? "Kameraya dön ve düz dur" : activeView === "side" ? "Şimdi yan dön" : "Şimdi arkanı dön";
  const guidanceText =
    step === "intro"
      ? "Kamerayı açınca tam beden kadrajına geçeceğiz. Ayaklar ve baş aynı anda görünmeli."
      : activeView === "front"
        ? "Kameraya dön. Ayaklar paralel, kollar rahat, gözler karşıda."
        : activeView === "side"
          ? "Yan dön. Baş, göğüs ve pelvis aynı dikey hatta kalsın."
          : "Arkanı dön. Sağ-sol yükünü eşitle ve sabit kal.";

  if (step === "intro") {
    return (
      <PostureAssessmentLanding
        hasReports={savedReports.length > 0}
        onClose={onClose}
        onShowHistory={onShowHistory}
        onStart={onOpenCamera}
      />
    );
  }

  if (step === "history") {
    return (
      <PostureHistoryScreen
        onBack={onClose}
        onDeleteReport={onDeleteSavedReport}
        onOpenReport={onOpenSavedReport}
        onSetTrainerVisibility={onSetTrainerVisibility}
        onStart={onOpenCamera}
        reports={savedReports}
      />
    );
  }

  if (
    autoCaptureProgress !== undefined &&
    (step === "front" || step === "side" || step === "back")
  ) {
    return (
      <PostureAutoCaptureScreen
        activeView={activeView}
        analysis={liveAnalysis}
        autoCaptureProgress={autoCaptureProgress}
        cameraStatus={cameraStatus}
        canvasRef={canvasRef}
        captureCount={captureCount}
        captureFlash={captureFlash}
        capturedView={capturedView}
        onCapture={onCapture}
        onClose={onClose}
        onRestart={onRetake}
        poseStatus={poseStatus}
        score={postureScore}
        selectedShen={selectedShen}
        videoRef={videoRef}
      />
    );
  }

  if (step === "captured" && report) {
    return (
      <PostureCaptureReadyScreen
        onClose={onClose}
        onComplete={onCompleteAnalysis ?? (() => undefined)}
        onRetake={onRetake}
        report={report}
      />
    );
  }

  if (step === "processing" && report) {
    return <PostureProcessingScreen report={report} />;
  }

  if (step === "result" && report) {
    return (
      <PostureResultDashboard
        onClose={onClose}
        onRetake={onRetake}
        onSave={onSaveReport}
        report={report}
        reportIsSaved={reportIsSaved}
        selectedShen={selectedShen}
      />
    );
  }

  return (
    <section className="screen posture-assessment-screen posture-analysis-screen">
      <div className="posture-analysis-shell">
        <header className="posture-analysis-topbar">
          <button className="posture-back-button" onClick={onClose} type="button" aria-label="Postür analizinden çık">
            ‹
          </button>
          <div>
            <h1>Postür Analizi</h1>
            <p>Tai Chi 24 Form - Hareket 3</p>
          </div>
          <button className="posture-save-button" disabled={autoCaptureProgress !== undefined || !canCapture} onClick={onCapture} type="button">
            {autoCaptureProgress !== undefined ? "Otomatik Çekim" : `${activeLabel} Kaydet`}
            <span aria-hidden="true">{autoCaptureProgress !== undefined ? "●" : "↓"}</span>
          </button>
        </header>

        <div className="posture-analysis-grid">
          <PostureScorePanel analysis={liveAnalysis} ready={postureReady} score={postureScore} selectedShen={selectedShen} />

          <main className="posture-analysis-stage-card">
            <div className="posture-stage-tabs" aria-label="Postür kayıt adımları">
              {([
                ["front", "Ön Görünüm"],
                ["side", "Yan Görünüm"],
                ["back", "Arka Görünüm"],
              ] as const).map(([item, label]) => (
                <button
                  className={`${activeView === item ? "posture-tab-active" : ""} ${captures[item] ? "posture-tab-done" : ""}`}
                  key={item}
                  onClick={() => onViewChange(item)}
                  disabled={autoCaptureProgress !== undefined}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="posture-camera-full posture-analysis-stage">
              <video
                className={`camera-preview ${cameraStatus === "ready" ? "camera-preview-active" : ""}`}
                muted
                playsInline
                ref={videoRef}
              />
              <canvas className="camera-pose-canvas" ref={canvasRef} />
              <PostureCaptureFlash visible={captureFlash} capturedView={capturedView} />
              {cameraStatus === "ready" || cameraStatus === "requesting" ? (
                <div className="camera-overlay posture-analysis-overlay">
                  <div className="scan-frame posture-scan-frame" />
                  <div className="camera-pill">{cameraStatus === "requesting" ? "Kamera izni bekleniyor" : getCameraStatus(cameraStatus, "calibrate")}</div>
                  <div className="pose-pill">{getPoseStatusText(poseStatus)}</div>
                  <div className="distance-pill">Baş, eller ve ayaklar kadrajda</div>
                </div>
              ) : null}
              {cameraStatus !== "ready" && cameraStatus !== "requesting" ? (
                <div className="posture-camera-placeholder posture-analysis-placeholder">
                  <span className="eyebrow">Postür Kurulumu</span>
                  <h2>Telefonu 2-3 metre uzağa koy.</h2>
                  <p>Ön, yan ve arka görünümden ayrı kayıt alacağız. Bu ekran teşhis değil; postür gelişimini takip eden bir ayna.</p>
                  <button className="posture-placeholder-action" onClick={onOpenCamera} type="button">
                    Kamerayı Aç
                  </button>
                  <PostureSkeleton2D analysis={liveAnalysis} selectedShen={selectedShen} view={activeView} />
                </div>
              ) : null}
              {cameraStatus === "ready" ? (
                <div className="posture-quality-legend">
                  <span><i className="legend-good" /> İyi {getPostureQualityCounts(liveAnalysis).good}</span>
                  <span><i className="legend-mid" /> Orta {getPostureQualityCounts(liveAnalysis).mid}</span>
                  <span><i className="legend-fix" /> Düzelt {getPostureQualityCounts(liveAnalysis).fix}</span>
                </div>
              ) : null}
              {cameraStatus === "ready" && autoCaptureProgress !== undefined ? (
                <div className="posture-auto-capture-card">
                  <div
                    className="posture-auto-capture-ring"
                    style={{ "--capture-progress": `${Math.max(2, autoCaptureProgress) * 3.6}deg` } as CSSProperties}
                  >
                    <strong>{autoCaptureProgress >= 100 ? "✓" : Math.max(1, Math.ceil(5 - autoCaptureProgress / 20))}</strong>
                  </div>
                  <span>{poseStatus === "aktif" ? autoCaptureInstruction : "Tam bedenini kadraja al"}</span>
                  <small>{autoCaptureProgress >= 100 ? "Görüntü alındı" : "5 saniye sabit kalınca otomatik çekilecek"}</small>
                </div>
              ) : null}
              <button className="posture-stage-mode-button" onClick={() => onModeChange(mode === "3d" ? "2d" : "3d")} type="button">
                {mode.toUpperCase()}
              </button>
            </div>

            <div className="posture-stage-controls">
              {autoCaptureProgress === undefined ? (
                <button className="posture-play-button" onClick={onCapture} disabled={!canCapture} type="button">
                  {activeLabel} Görünümü Al
                </button>
              ) : null}
              <div className="posture-stage-progress">
                <span>{captureCount}/3 görünüm</span>
                <i>
                  <b style={{ width: `${Math.max(8, ((captureCount + (autoCaptureProgress ?? 0) / 100) / 3) * 100)}%` }} />
                </i>
                <small>{`${activeLabel} kayıt`}</small>
              </div>
              <button className="posture-minor-button" onClick={onClose} type="button">
                Kapat
              </button>
            </div>
          </main>

          <PostureFeedbackPanel analysis={liveAnalysis} guidanceText={guidanceText} ready={postureReady} selectedShen={selectedShen} view={activeView} />
        </div>

        <PostureInsightStrip analysis={liveAnalysis} ready={postureReady} selectedShen={selectedShen} />
      </div>
    </section>
  );
}

function PostureAssessmentLanding({
  hasReports,
  onClose,
  onShowHistory,
  onStart,
}: {
  hasReports: boolean;
  onClose: () => void;
  onShowHistory?: () => void;
  onStart: () => void;
}) {
  return (
    <section className="screen posture-flow-screen posture-landing-screen">
      <div className="posture-flow-shell posture-landing-shell">
        <button className="posture-back-button" onClick={onClose} type="button" aria-label="Postür ekranından çık">‹</button>
        <div className="posture-landing-content">
          <span className="eyebrow">Beden Hattın</span>
          <h1>Postürünün bugünkü izini çıkar.</h1>
          <p>Ön, yan ve arka görünümünü beş saniyelik sakin duruşlarla ölçelim; zaman içindeki değişimi birlikte görelim.</p>
          <div className="posture-landing-actions">
            <button className="posture-landing-primary" onClick={onStart} type="button">
              <span>Postür Analizini Başlat</span>
              <i aria-hidden="true">→</i>
            </button>
            {onShowHistory ? (
              <button className="posture-landing-secondary" onClick={onShowHistory} type="button">
                <span>Geçmiş Postür Analizlerim</span>
                <small>{hasReports ? "Kayıtlarını karşılaştır" : "Henüz kayıt yok"}</small>
              </button>
            ) : null}
          </div>
        </div>
        <div className="posture-landing-figure" aria-hidden="true">
          <FlatPostureIllustration />
          <span className="posture-landing-figure-label">Nötr duruş · üç açıdan izlenecek</span>
        </div>
      </div>
    </section>
  );
}

function FlatPostureIllustration() {
  const joints = [
    [180,92],[142,142],[218,142],[124,220],[236,220],[112,296],[248,296],
    [151,278],[209,278],[151,388],[209,388],[151,506],[209,506],
  ];
  return (
    <svg className="posture-flat-illustration" viewBox="0 0 360 600" role="img" aria-label="Düz beden hizalama görseli">
      <defs>
        <linearGradient id="posture-flat-body" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--shen-accent)" stopOpacity=".2" />
          <stop offset=".55" stopColor="#f2eee5" stopOpacity=".13" />
          <stop offset="1" stopColor="var(--shen-accent-2)" stopOpacity=".28" />
        </linearGradient>
        <filter id="posture-flat-glow"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <ellipse cx="180" cy="548" rx="112" ry="18" fill="var(--shen-accent)" opacity=".09" />
      <line className="posture-flat-axis posture-flat-axis-glow" x1="180" x2="180" y1="48" y2="540" />
      <line className="posture-flat-axis" x1="180" x2="180" y1="48" y2="540" />
      <line className="posture-flat-level" x1="86" x2="274" y1="142" y2="142" />
      <line className="posture-flat-level" x1="104" x2="256" y1="278" y2="278" />
      <path className="posture-flat-body" d="M180 66c-29 0-46 22-43 49 2 19 13 34 26 42l-15 39-25 71-20 46 22 10 30-61 2 113-20 143h28l15-107 15 107h28l-20-143 2-113 30 61 22-10-20-46-25-71-15-39c13-8 24-23 26-42 3-27-14-49-43-49Z" />
      <path className="posture-flat-spine" d="M180 149C174 197 186 229 180 278S186 347 180 389" />
      <path className="posture-flat-connection" d="M142 142 124 220 112 296M218 142 236 220 248 296M151 278 151 388 151 506M209 278 209 388 209 506" />
      {joints.map(([cx,cy],index)=><circle className="posture-flat-joint" cx={cx} cy={cy} key={index} r="7" />)}
      <text className="posture-flat-caption" x="180" y="576">BAŞ · OMUZ · KALÇA · DİZ · AYAK BİLEĞİ</text>
    </svg>
  );
}

function PostureAutoCaptureScreen({
  activeView,
  analysis,
  autoCaptureProgress,
  cameraStatus,
  canvasRef,
  captureCount,
  captureFlash,
  capturedView,
  onCapture,
  onClose,
  onRestart,
  poseStatus,
  score,
  selectedShen,
  videoRef,
}: {
  activeView: PostureView;
  analysis: ReturnType<typeof analyzePosture>;
  autoCaptureProgress: number;
  cameraStatus: "idle" | "requesting" | "ready" | "denied" | "unsupported";
  canvasRef: RefObject<HTMLCanvasElement | null>;
  captureCount: number;
  captureFlash: boolean;
  capturedView: PostureView | null;
  onCapture: () => void;
  onClose: () => void;
  onRestart: () => void;
  poseStatus: "bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata";
  score: number;
  selectedShen: (typeof fiveShen)[number];
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const viewLabel = activeView === "front" ? "Ön" : activeView === "side" ? "Yan" : "Arka";
  const instruction =
    cameraStatus === "requesting"
      ? "Kamera izni bekleniyor"
      : poseStatus !== "aktif"
        ? "Başını ve ayaklarını aynı anda kadraja al"
        : activeView === "front"
        ? "Önüne dön ve düz dur"
          : activeView === "side"
            ? "Şimdi yana dön"
            : "Şimdi arkana dön";
  const secondsLeft = Math.max(1, Math.ceil(5 - autoCaptureProgress / 20));
  const angleSteps = [
    ["front", "Ön"],
    ["side", "Yan"],
    ["back", "Arka"],
  ] as const;
  const metrics = getPostureMetricList(analysis);
  const scoreLabel = score >= 82 ? "İyi" : score >= 68 ? "Orta" : "Dikkat";
  const live = cameraStatus === "ready" && poseStatus === "aktif";

  return (
    <section className="screen posture-capture-screen posture-live-screen">
      <div className="posture-capture-shell posture-live-shell">
        <header className="posture-live-topbar">
          <button className="posture-live-icon-button" onClick={onClose} type="button" aria-label="Postür çekiminden çık">←</button>
          <div>
            <strong>POSTÜR ANALİZİ</strong>
            <span>11 temel nokta görünür · 33 nokta analiz edilir</span>
          </div>
          <button className="posture-live-icon-button posture-live-help" type="button" aria-label="Postür analizi yardımı">?</button>
        </header>

        <div className="posture-live-camera">
          <video className={`camera-preview ${cameraStatus === "ready" ? "camera-preview-active" : ""}`} muted playsInline ref={videoRef} />
          <canvas className="camera-pose-canvas" ref={canvasRef} />
          <PostureCaptureFlash visible={captureFlash} capturedView={capturedView} />
          <div className={`posture-live-badge ${live ? "posture-live-badge-active" : ""}`}>
            <i /> {live ? "CANLI" : cameraStatus === "requesting" ? "HAZIRLANIYOR" : "BEDEN BEKLENİYOR"}
          </div>
          <div className="posture-live-color-legend" aria-label="Hizalama renkleri">
            <span><i className="good" />Dengeli</span>
            <span><i className="mid" />İzle</span>
            <span><i className="fix" />Düzelt</span>
          </div>
          <div className="posture-live-angle-steps" aria-label="Postür çekim sırası">
            {angleSteps.map(([item, label], index) => (
              <span className={activeView === item ? "posture-capture-step-active" : capturesStepClass(item, activeView)} key={item}>
                <i>{index + 1}</i>
                <b>{label}</b>
              </span>
            ))}
          </div>
          {cameraStatus !== "ready" ? <div className="posture-live-camera-wait">Kamera hazırlanıyor...</div> : null}

          <div className="posture-live-callout posture-live-callout-shoulder">
            <span>Omuz hizası</span>
            <strong>{analysis.shoulderScore >= 82 ? "Dengeli" : "Hafif düşük"}</strong>
          </div>
          <div className="posture-live-callout posture-live-callout-spine">
            <span>Omurga</span>
            <strong>{analysis.axisScore >= 82 ? "Hizalı" : "Hafif sola eğim"}</strong>
          </div>
          <div className="posture-live-callout posture-live-callout-hip">
            <span>Kalça hizası</span>
            <strong>{analysis.hipScore >= 78 ? "Dengede" : "Kontrol et"}</strong>
          </div>
          <div className="posture-live-callout posture-live-callout-weight">
            <span>Ağırlık dağılımı</span>
            <strong>%46 – %54 · Dengeli</strong>
          </div>

          <div className="posture-live-tools" aria-label="Analiz araçları">
            <button onClick={onRestart} type="button"><b>↻</b><span>Yeniden<br />Başlat</span></button>
            <button disabled={!live} onClick={onCapture} type="button"><b>▣</b><span>Fotoğraf<br />Çek</span></button>
            <button type="button"><b>▻</b><span>Video<br />Kaydet</span></button>
            <button type="button"><b>☼</b><span>İpuçları</span></button>
          </div>

          <div className="posture-live-guide" aria-live="polite">
            <div
              className="posture-auto-capture-ring"
              style={{ "--capture-progress": `${Math.max(2, autoCaptureProgress) * 3.6}deg` } as CSSProperties}
            >
              <strong>{poseStatus === "aktif" ? secondsLeft : "•"}</strong>
            </div>
            <div>
              <span className="posture-capture-guide-kicker">{captureCount + 1} / 3 · {viewLabel} görünüm</span>
              <strong>{instruction}</strong>
              <span>{poseStatus === "aktif" ? "5 saniye sabit kal; görüntü otomatik alınacak." : "Tam beden göründüğünde sayaç başlayacak."}</span>
            </div>
          </div>
        </div>

        <section className="posture-live-results">
          <div className="posture-live-overall">
            <span>GENEL SKOR</span>
            <div
              className="posture-live-score-ring"
              style={{ "--score-value": `${live ? score : 8}`, "--shen-accent": selectedShen.color } as CSSProperties}
            >
              <strong>{live ? score : "--"}</strong>
              <small>/100</small>
            </div>
            <b>{live ? scoreLabel : "Hazırlanıyor"}</b>
            <p>{live ? "Duruşun genel olarak dengede." : "Tam bedenini kadraja al."}</p>
          </div>
          <div className="posture-live-detail">
            <span>DETAYLI ANALİZ</span>
            {metrics.map((metric) => (
              <div className={`posture-live-metric posture-live-metric-${getMetricTone(metric.value)}`} key={metric.label}>
                <i>{metric.icon}</i>
                <div>
                  <label>{metric.label}<b>{live ? `${metric.measurement} · ${getMetricTone(metric.value) === "good" ? "İyi" : getMetricTone(metric.value) === "mid" ? "İzle" : "Düzelt"}` : "--"}</b></label>
                  <span><em style={{ width: `${live ? metric.value : 0}%` }} /></span>
                  <small>Ölçüm güveni %{metric.confidence}</small>
                </div>
              </div>
            ))}
            <div className="posture-live-confidence"><b>11</b><span>temel postür noktası görünür<br /><small>33 nokta arka planda analiz edilir</small></span></div>
          </div>
        </section>
      </div>
    </section>
  );
}

function capturesStepClass(item: PostureView, activeView: PostureView) {
  const order: PostureView[] = ["front", "side", "back"];
  return order.indexOf(item) < order.indexOf(activeView) ? "posture-capture-step-done" : "";
}

function PostureCaptureFlash({ visible, capturedView }: { visible: boolean; capturedView: PostureView | null }) {
  if (!visible) return null;
  const label = capturedView === "front" ? "Ön" : capturedView === "side" ? "Yan" : "Arka";

  return (
    <>
      <div className="posture-capture-flash" aria-hidden="true" />
      <div className="posture-capture-shutter-frame" aria-hidden="true" />
      <div className="posture-capture-toast" role="status">
        <span aria-hidden="true">✓</span>
        <div>
          <strong>{label} görünüm kaydedildi</strong>
          <small>Postür görüntüsü alındı</small>
        </div>
      </div>
    </>
  );
}

function PostureCaptureReadyScreen({
  onClose,
  onComplete,
  onRetake,
  report,
}: {
  onClose: () => void;
  onComplete: () => void;
  onRetake: () => void;
  report: PostureReport;
}) {
  return (
    <section className="screen posture-capture-screen">
      <div className="posture-capture-shell posture-capture-ready-shell">
        <header className="posture-capture-topbar">
          <button className="posture-back-button" onClick={onClose} type="button" aria-label="Postür analizinden çık">‹</button>
          <div>
            <span className="eyebrow">Üç Görünüm Hazır</span>
            <strong>Çekim tamamlandı</strong>
          </div>
          <div className="posture-capture-score posture-capture-score-live">
            <strong>{report.score}</strong><span>/100</span>
          </div>
        </header>
        <div className="posture-capture-ready-images">
          {(["front", "side", "back"] as const).map((view) => (
            <figure key={view}>
              <img src={report.captures[view].imageData} alt={`${view === "front" ? "Ön" : view === "side" ? "Yan" : "Arka"} postür kaydı`} />
              <figcaption>{view === "front" ? "Ön" : view === "side" ? "Yan" : "Arka"}</figcaption>
            </figure>
          ))}
        </div>
        <div className="posture-capture-ready-actions">
          <div>
            <span className="eyebrow">Hazırsan devam et</span>
            <p>Ayrıntılı skorların ve kişisel önerilerin bir sonraki ekranda hazırlanacak.</p>
          </div>
          <button className="posture-capture-retake" onClick={onRetake} type="button">Yeniden Çek</button>
          <button className="posture-capture-complete" onClick={onComplete} type="button">Analizi Tamamla <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </section>
  );
}

function PostureHistoryScreen({
  onBack,
  onDeleteReport,
  onOpenReport,
  onSetTrainerVisibility,
  onStart,
  reports,
}: {
  onBack: () => void;
  onDeleteReport?: (reportId: string) => void;
  onOpenReport?: (report: PostureReport) => void;
  onSetTrainerVisibility?: (reportId: string, trainerVisible: boolean) => void;
  onStart: () => void;
  reports: PostureReport[];
}) {
  return (
    <section className="screen posture-flow-screen posture-history-screen">
      <div className="posture-flow-shell">
        <header className="posture-flow-topbar">
          <button className="posture-back-button" onClick={onBack} type="button" aria-label="Postür girişine dön">‹</button>
          <div>
            <span className="eyebrow">Zaman Çizgin</span>
            <h1>Geçmiş Postür Analizlerim</h1>
          </div>
          <button className="posture-result-retake-button" onClick={onStart} type="button">Yeni Analiz</button>
        </header>
        <PostureSavedReportsGallery
          onDeleteReport={onDeleteReport}
          onOpenReport={onOpenReport ?? (() => undefined)}
          onSetTrainerVisibility={onSetTrainerVisibility}
          reports={reports}
        />
      </div>
    </section>
  );
}

function PostureProcessingScreen({ report }: { report: PostureReport }) {
  return (
    <section className="screen posture-flow-screen posture-processing-screen">
      <div className="posture-flow-shell posture-processing-shell">
        <div className="posture-processing-visual" aria-hidden="true">
          {(["front", "side", "back"] as const).map((view, index) => (
            <div key={view} style={{ "--processing-index": index } as CSSProperties}>
              <img src={report.captures[view].imageData} alt="" />
              <span>{view === "front" ? "Ön" : view === "side" ? "Yan" : "Arka"}</span>
            </div>
          ))}
          <i className="posture-processing-scan" />
        </div>
        <div className="posture-processing-copy">
          <span className="eyebrow">Üç görünüm birleşiyor</span>
          <h1>Postürünüz analiz ediliyor.</h1>
          <p>Omuz, omurga, kalça ve denge hattın karşılaştırılıyor. Lütfen bekleyin.</p>
          <div className="posture-processing-progress"><i /></div>
          <small>MoveNet eklem noktaları eşleştiriliyor</small>
        </div>
      </div>
    </section>
  );
}

function PostureResultDashboard({
  onClose,
  onRetake,
  onSave,
  report,
  reportIsSaved,
  selectedShen,
}: {
  onClose: () => void;
  onRetake: () => void;
  onSave: () => void;
  report: PostureReport;
  reportIsSaved: boolean;
  selectedShen: (typeof fiveShen)[number];
}) {
  const [activeView, setActiveView] = useState<PostureView>("front");
  const [mode, setMode] = useState<PostureRenderMode>("3d");
  const [isReviewPlaying, setIsReviewPlaying] = useState(false);
  const compositeAnalysis = getPostureReportCompositeAnalysis(report);
  const capture = report.captures[activeView];
  const viewAnalysis = {
    ...compositeAnalysis,
    ...capture.analysis,
    breathScore: compositeAnalysis.breathScore,
    feedback: report.summary,
    flags: report.flags,
    lean: Math.max(-10, Math.min(10, capture.analysis.spineShift / 3.4 + capture.analysis.shoulderTilt / 4.2)),
  };
  const quality = getPostureQualityCounts(viewAnalysis);
  const activeLabel = activeView === "front" ? "Ön" : activeView === "side" ? "Yan" : "Arka";

  return (
    <section className="screen posture-assessment-screen posture-analysis-screen posture-result-dashboard">
      <div className="posture-analysis-shell">
        <header className="posture-analysis-topbar">
          <button className="posture-back-button" onClick={onClose} type="button" aria-label="Postür raporundan çık">
            ‹
          </button>
          <div>
            <h1>Postür Analizi</h1>
            <p>Tai Chi 24 Form - Hareket 3 • {report.dateKey} {report.timeLabel}</p>
          </div>
          <div className="posture-result-top-actions">
            <button className="posture-result-retake-button" onClick={onRetake} type="button">
              Yeniden Al
            </button>
            <button className="posture-save-button" disabled={reportIsSaved} onClick={onSave} type="button">
              {reportIsSaved ? "Kayıtlı" : "Analizi Kaydet"}
              <span aria-hidden="true">{reportIsSaved ? "✓" : "↓"}</span>
            </button>
          </div>
        </header>

        <div className="posture-analysis-grid posture-result-grid">
          <PostureScorePanel analysis={compositeAnalysis} ready score={report.score} selectedShen={selectedShen} />

          <main className="posture-analysis-stage-card posture-result-stage-card">
            <div className="posture-stage-tabs" aria-label="Kayıt görünümü seçimi">
              {([
                ["front", "Ön Görünüm"],
                ["side", "Yan Görünüm"],
                ["back", "Arka Görünüm"],
              ] as const).map(([item, label]) => (
                <button className={activeView === item ? "posture-tab-active" : ""} key={item} onClick={() => setActiveView(item)} type="button">
                  {label}
                </button>
              ))}
            </div>

            <div className={`posture-result-capture-stage posture-result-capture-${mode} ${isReviewPlaying ? "posture-result-review-playing" : ""}`}>
              <img src={capture.imageData} alt={`${activeLabel} postür analizi`} />
              <div className="posture-result-depth-grid" aria-hidden="true" />
              <div className="posture-result-center-axis" aria-hidden="true" />
              <div className="posture-quality-legend posture-result-quality-legend">
                <span><i className="legend-good" /> İyi {quality.good}</span>
                <span><i className="legend-mid" /> Orta {quality.mid}</span>
                <span><i className="legend-fix" /> Düzelt {quality.fix}</span>
              </div>
              <button className="posture-stage-mode-button posture-result-mode-button" onClick={() => setMode(mode === "3d" ? "2d" : "3d")} type="button">
                {mode.toUpperCase()}
              </button>
              <div className="posture-result-view-badge">
                <strong>{activeLabel} görünüm</strong>
                <span>{mode === "3d" ? "Derinlik ve eksen katmanı" : "MoveNet eklem katmanı"}</span>
              </div>
            </div>

            <div className="posture-result-timeline">
              <button onClick={() => setIsReviewPlaying((playing) => !playing)} type="button" aria-label={isReviewPlaying ? "İncelemeyi durdur" : "İncelemeyi oynat"}>
                {isReviewPlaying ? "Ⅱ" : "▶"}
              </button>
              <span>00:12</span>
              <i><b className={isReviewPlaying ? "posture-timeline-running" : ""} /></i>
              <span>00:25</span>
              <small>Kare 128 / 250</small>
            </div>

            <div className="posture-result-capture-strip" aria-label="Üç açıdan postür kayıtları">
              {(["front", "side", "back"] as const).map((item) => (
                <button className={activeView === item ? "posture-result-capture-active" : ""} key={item} onClick={() => setActiveView(item)} type="button">
                  <img src={report.captures[item].imageData} alt="" />
                  <span>{item === "front" ? "Ön" : item === "side" ? "Yan" : "Arka"}</span>
                </button>
              ))}
            </div>
          </main>

          <div className="posture-result-feedback-stack">
            <PostureFeedbackPanel
              analysis={viewAnalysis}
              guidanceText={report.summary}
              ready
              selectedShen={selectedShen}
              view={activeView}
            />
            <div className="posture-result-medical-note">
              Bu bir medikal teşhis değildir. Belirgin ağrı, uyuşma veya skolyoz şüphesi varsa fizyoterapist ya da hekim değerlendirmesi gerekir.
            </div>
          </div>
        </div>

        <PostureInsightStrip analysis={compositeAnalysis} ready selectedShen={selectedShen} />
      </div>
    </section>
  );
}

function PostureSavedReportsGallery({
  onDeleteReport,
  onOpenReport,
  onSetTrainerVisibility,
  reports,
}: {
  onDeleteReport?: (reportId: string) => void;
  onOpenReport: (report: PostureReport) => void;
  onSetTrainerVisibility?: (reportId: string, trainerVisible: boolean) => void;
  reports: PostureReport[];
}) {
  const [actionMessage, setActionMessage] = useState<{ id: string; text: string } | null>(null);

  async function handleShare(report: PostureReport) {
    const result = await sharePostureReport(report);
    if (!result) return;
    setActionMessage({ id: report.id, text: result });
    window.setTimeout(() => setActionMessage((current) => current?.id === report.id ? null : current), 3200);
  }

  function handleDelete(report: PostureReport) {
    if (!onDeleteReport) return;
    const confirmed = window.confirm(`${report.dateKey} tarihli postür analizini silmek istediğine emin misin?`);
    if (confirmed) onDeleteReport(report.id);
  }

  return (
    <section className="posture-saved-gallery" aria-label="Kayıtlı postür analizleri">
      <div className="posture-saved-gallery-heading">
        <div>
          <span className="eyebrow">Postür Arşivi</span>
          <h2>Kayıtlı analizlerin</h2>
        </div>
        <span>{reports.length} kayıt</span>
      </div>

      {reports.length ? (
        <div className="posture-saved-gallery-grid">
          {reports.map((report) => (
            <article key={report.id}>
              <button className="posture-saved-report-open" onClick={() => onOpenReport(report)} type="button">
                <div className="posture-saved-gallery-images">
                  {(["front", "side", "back"] as const).map((view) => (
                    <img
                      alt={`${report.dateKey} ${view === "front" ? "ön" : view === "side" ? "yan" : "arka"} postür kaydı`}
                      key={view}
                      src={report.captures[view].imageData}
                    />
                  ))}
                </div>
                <div className="posture-saved-gallery-meta">
                  <span>
                    <strong>{report.dateKey}</strong>
                    <small>{report.timeLabel} • {report.trendText}</small>
                  </span>
                  <b>{report.score}</b>
                </div>
                <span className="posture-saved-gallery-open">Analizi aç <i aria-hidden="true">›</i></span>
              </button>
              <div className="posture-saved-report-actions">
                <label>
                  <input
                    checked={report.trainerVisible ?? false}
                    disabled={!onSetTrainerVisibility}
                    onChange={(event) => onSetTrainerVisibility?.(report.id, event.target.checked)}
                    type="checkbox"
                  />
                  <span>Eğitmene açık</span>
                </label>
                <button onClick={() => void handleShare(report)} type="button">Paylaş</button>
                <button className="posture-report-delete" disabled={!onDeleteReport} onClick={() => handleDelete(report)} type="button">Sil</button>
              </div>
              {actionMessage?.id === report.id ? <div className="posture-report-action-message">{actionMessage.text}</div> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="posture-saved-gallery-empty">
          İlk ön, yan ve arka kaydını tamamladığında fotoğrafların burada tarihleriyle görünecek.
        </div>
      )}
    </section>
  );
}

function PostureScorePanel({
  analysis,
  ready,
  score,
  selectedShen,
}: {
  analysis: ReturnType<typeof analyzePosture>;
  ready: boolean;
  score: number;
  selectedShen: (typeof fiveShen)[number];
}) {
  const metrics = getPostureMetricList(analysis);
  const scoreLabel = !ready ? "Kurulum" : score >= 82 ? "İyi" : score >= 68 ? "Orta" : "Düzelt";

  return (
    <aside className="posture-score-column">
      <div className="posture-score-ring-card">
        <div
          className="posture-score-ring"
          style={{ "--score-value": `${ready ? score : 12}`, "--shen-accent": selectedShen.color } as CSSProperties}
        >
          <strong>{ready ? score : "--"}</strong>
          <span>/100</span>
        </div>
        <p>Genel Skor</p>
        <b>{scoreLabel}</b>
      </div>

      <div className="posture-score-list">
        {metrics.map((metric) => (
          <article className={`posture-score-item posture-score-${getMetricTone(metric.value)}`} key={metric.label}>
            <span className="posture-score-icon">{metric.icon}</span>
            <div>
              <strong>{metric.label}</strong>
              <i>
                <b style={{ width: `${ready ? metric.value : 0}%` }} />
              </i>
            </div>
            <em>{ready ? `${metric.value}/100` : "--"}</em>
          </article>
        ))}
      </div>
    </aside>
  );
}

function PostureFeedbackPanel({
  analysis,
  guidanceText,
  ready,
  selectedShen,
  view,
}: {
  analysis: ReturnType<typeof analyzePosture>;
  guidanceText: string;
  ready: boolean;
  selectedShen: (typeof fiveShen)[number];
  view: PostureView;
}) {
  const corrections = getPostureCorrections(analysis, ready);
  const recommendations = getPostureRecommendations(analysis, view);

  return (
    <aside className="posture-feedback-column">
      <article className="posture-feedback-card posture-feedback-good">
        <span className="posture-feedback-title">Genel Geri Bildirim</span>
        <p>{ready ? analysis.feedback : guidanceText}</p>
      </article>

      <article className="posture-feedback-card posture-feedback-warning">
        <span className="posture-feedback-title">Düzeltilecek Noktalar</span>
        <div className="posture-correction-row">
          <div className="posture-mini-body" aria-hidden="true">
            <PostureSkeleton2D analysis={analysis} selectedShen={selectedShen} view={view} />
          </div>
          <p>{corrections[0]}</p>
        </div>
      </article>

      <article className="posture-feedback-card posture-feedback-improve">
        <span className="posture-feedback-title">Önerilen İyileştirmeler</span>
        <div className="posture-recommendation-list">
          {recommendations.map((item) => (
            <div className="posture-recommendation" key={item.title}>
              <span>{item.initial}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="posture-see-all" type="button">
          Tüm Önerileri Gör
          <span aria-hidden="true">›</span>
        </button>
      </article>
    </aside>
  );
}

function PostureInsightStrip({
  analysis,
  ready,
  selectedShen,
}: {
  analysis: ReturnType<typeof analyzePosture>;
  ready: boolean;
  selectedShen: (typeof fiveShen)[number];
}) {
  const insights = [
    {
      label: "Nefes",
      title: ready && analysis.breathScore > 76 ? "Nefes hareketle uyumlu." : "Nefesi hareketten önce başlat.",
      tone: "green",
    },
    {
      label: "Yin & Yang Dengesi",
      title: ready && analysis.hipScore > 76 ? "Ağırlık dağılımı sakin." : "Sağ-sol ağırlığını eşitle.",
      tone: "blue",
    },
    {
      label: "Enerji Akışı",
      title: ready && analysis.axisScore > 76 ? "Eksen akıyor, devam et." : `${selectedShen.dailyName} için merkezi toparla.`,
      tone: "gold",
    },
  ];

  return (
    <div className="posture-insight-strip">
      {insights.map((item) => (
        <article className={`posture-insight posture-insight-${item.tone}`} key={item.label}>
          <span>{item.label.slice(0, 1)}</span>
          <div>
            <strong>{item.label}</strong>
            <p>{item.title}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function PostureReportPanel({
  onClose,
  onRetake,
  onSave,
  report,
  selectedShen,
}: {
  onClose: () => void;
  onRetake: () => void;
  onSave: () => void;
  report: PostureReport;
  selectedShen: (typeof fiveShen)[number];
}) {
  const signalClass =
    report.asymmetrySignal === "yüksek"
      ? "posture-signal-high"
      : report.asymmetrySignal === "orta"
        ? "posture-signal-mid"
        : "posture-signal-low";

  return (
    <aside className="posture-report-panel">
      <div className="posture-step-head">
        <span className="eyebrow">Postür Raporu</span>
        <strong>{report.score} genel hizalanma</strong>
        <p>{report.summary}</p>
      </div>
      <div className={`posture-signal ${signalClass}`}>
        <span>Asimetri sinyali</span>
        <strong>{report.asymmetrySignal}</strong>
      </div>
      <div className="posture-report-views">
        {(["front", "side", "back"] as const).map((item) => (
          <article key={item}>
            <img src={report.captures[item].imageData} alt={`${item} postür kaydı`} />
            <span>{item === "front" ? "Ön" : item === "side" ? "Yan" : "Arka"}</span>
          </article>
        ))}
      </div>
      <div className="avatar-metrics">
        <AvatarMetric label="Ön" value={report.captures.front.analysis.axisScore} />
        <AvatarMetric label="Yan" value={report.captures.side.analysis.axisScore} />
        <AvatarMetric label="Arka" value={report.captures.back.analysis.axisScore} />
      </div>
      <div className="posture-flags">
        {report.flags.map((flag) => (
          <span key={flag}>{flag}</span>
        ))}
      </div>
      <div className="avatar-feedback">
        Bu medikal teşhis değildir. Belirgin ağrı, uyuşma veya skolyoz şüphesi varsa fizyoterapist ya da hekim değerlendirmesi gerekir.
      </div>
      <div className="posture-assessment-actions">
        <button className="primary-action" onClick={onSave} style={{ "--shen-accent": selectedShen.color } as CSSProperties} type="button">
          Raporu Kaydet
        </button>
        <button className="secondary-action" onClick={onRetake} type="button">
          Yeniden Al
        </button>
        <button className="secondary-action" onClick={onClose} type="button">
          Kapat
        </button>
      </div>
    </aside>
  );
}

function PostureReportFigure({ report, selectedShen }: { report: PostureReport; selectedShen: (typeof fiveShen)[number] }) {
  const composite = getPostureReportCompositeAnalysis(report);

  return (
    <div className="posture-report-figure">
      <span className="eyebrow">3D Birleşik Postür</span>
      <div className="avatar-stage avatar-stage-2d">
        <div className="avatar-orbit avatar-orbit-a" />
        <div className="avatar-orbit avatar-orbit-b" />
        <PostureSkeleton2D analysis={composite} selectedShen={selectedShen} view="front" />
      </div>
      <div className="posture-report-footnote">Ön + yan + arka kayıtlar tek postür çizgisine indirgenmiştir.</div>
    </div>
  );
}

function getPostureReportCompositeAnalysis(report: PostureReport): ReturnType<typeof analyzePosture> {
  const front = report.captures.front.analysis;
  const side = report.captures.side.analysis;
  const back = report.captures.back.analysis;

  return {
    ...front,
    axisScore: report.score,
    breathScore: Math.round((report.score + front.axisScore + side.axisScore) / 3),
    feedback: report.summary,
    flags: report.flags,
    hipScore: Math.round((front.hipScore + side.hipScore + back.hipScore) / 3),
    hipTilt: (front.hipTilt + back.hipTilt) / 2,
    lean: Math.max(-10, Math.min(10, (front.spineShift + side.spineShift) / 4)),
    shoulderScore: Math.round((front.shoulderScore + side.shoulderScore + back.shoulderScore) / 3),
    shoulderTilt: (front.shoulderTilt + back.shoulderTilt) / 2,
    spineShift: Math.max(-20, Math.min(20, (front.spineShift + side.spineShift + back.spineShift) / 3)),
  };
}

function PostureAvatar({
  keypoints,
  mode,
  movementScore,
  onModeChange,
  onViewChange,
  poseStatus,
  selectedShen,
  view,
}: {
  keypoints: PoseKeypoint[];
  mode: PostureRenderMode;
  movementScore: number;
  onModeChange: (mode: PostureRenderMode) => void;
  onViewChange: (view: PostureView) => void;
  poseStatus: "bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata";
  selectedShen: (typeof fiveShen)[number];
  view: PostureView;
}) {
  const livePose = normalizePoseForAvatar(keypoints, view);
  const avatarReady = poseStatus === "aktif" && Boolean(livePose);
  const analysis = analyzePosture(keypoints, movementScore, selectedShen.id, view);
  const viewLabel = view === "front" ? "Ön" : view === "side" ? "Yan" : "Arka";

  return (
    <div
      className={`posture-avatar-panel posture-avatar-${mode} posture-view-${view} ${avatarReady ? "posture-avatar-live" : ""}`}
      style={
        {
          "--avatar-lean": `${analysis.lean}deg`,
          "--avatar-yaw": view === "side" ? "62deg" : view === "back" ? "180deg" : "0deg",
          "--avatar-spine-shift": `${analysis.spineShift}px`,
        } as CSSProperties
      }
    >
      <div className="posture-avatar-head">
        <div>
          <span className="eyebrow">MoveNet Postür Aynası</span>
          <strong>{avatarReady ? `${viewLabel} görünümde canlı beden` : "Tam beden kadrajı bekleniyor"}</strong>
        </div>
        <span className="avatar-score">{avatarReady ? analysis.axisScore : "..."}</span>
      </div>

      <div className="posture-controls" aria-label="Postür görünüm seçimi">
        <div className="posture-toggle-group">
          {(["3d", "2d"] as const).map((item) => (
            <button className={mode === item ? "posture-toggle-active" : ""} key={item} onClick={() => onModeChange(item)} type="button">
              {item.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="posture-toggle-group posture-view-toggle">
          {([
            ["front", "Ön"],
            ["side", "Yan"],
            ["back", "Arka"],
          ] as const).map(([item, label]) => (
            <button className={view === item ? "posture-toggle-active" : ""} key={item} onClick={() => onViewChange(item)} type="button">
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`avatar-stage avatar-stage-${mode}`} aria-label={`${mode.toUpperCase()} ${viewLabel.toLocaleLowerCase("tr-TR")} postür görünümü`}>
        {mode === "3d" ? (
          <>
            <div className="avatar-orbit avatar-orbit-a" />
            <div className="avatar-orbit avatar-orbit-b" />
            {livePose ? (
              <PostureLiveSkeleton mode="3d" pose={livePose} selectedShen={selectedShen} view={view} />
            ) : (
              <svg className="avatar-body" viewBox="0 0 220 300" role="img" aria-label="Hareketli 3D postür avatarı">
                <defs>
                  <linearGradient id="avatarLine" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor={selectedShen.color} />
                    <stop offset="100%" stopColor="#fff4c8" />
                  </linearGradient>
                </defs>
                <ellipse className="avatar-shadow" cx="110" cy="268" rx="60" ry="13" />
                <path className="avatar-axis" d="M110 30 L110 254" />
                <path className="avatar-flow-path" d={`M50 244 C96 216 ${92 + analysis.spineShift} 170 ${126 + analysis.spineShift} 142 C154 118 150 78 120 50`} />
                <circle className="avatar-head-dot" cx="112" cy="48" r="18" />
                <path className="avatar-spine" d={`M112 68 C${108 + analysis.spineShift * 0.4} 96 ${107 + analysis.spineShift} 122 ${112 + analysis.spineShift} 150 C${118 + analysis.spineShift} 181 116 207 108 236`} />
                <path className="avatar-limb avatar-arm-left" d={`M107 92 C84 ${98 + analysis.shoulderTilt * 0.18} 66 113 50 136`} />
                <path className="avatar-limb avatar-arm-right" d={`M116 94 C139 ${93 - analysis.shoulderTilt * 0.18} 158 84 176 68`} />
                <path className="avatar-limb avatar-forearm-left" d="M50 136 C67 147 86 150 105 143" />
                <path className="avatar-limb avatar-forearm-right" d="M176 68 C187 79 191 92 188 106" />
                <path className="avatar-limb avatar-leg-left" d={`M109 154 C88 ${180 + analysis.hipTilt * 0.16} 72 207 56 240`} />
                <path className="avatar-limb avatar-leg-right" d={`M115 154 C142 ${174 - analysis.hipTilt * 0.16} 161 200 178 236`} />
                {[
                  [112, 48],
                  [108, 92 + analysis.shoulderTilt * 0.12],
                  [116, 94 - analysis.shoulderTilt * 0.12],
                  [50, 136],
                  [176, 68],
                  [105, 143],
                  [188, 106],
                  [109, 154 + analysis.hipTilt * 0.1],
                  [115, 154 - analysis.hipTilt * 0.1],
                  [56, 240],
                  [178, 236],
                ].map(([x, y]) => (
                  <circle className="avatar-joint" cx={x} cy={y} key={`${x}-${y}`} r="4.5" />
                ))}
                <circle className="avatar-core" cx={112 + analysis.spineShift * 0.3} cy="142" r="9" />
              </svg>
            )}
          </>
        ) : livePose ? (
          <PostureLiveSkeleton mode="2d" pose={livePose} selectedShen={selectedShen} view={view} />
        ) : (
          <PostureSkeleton2D analysis={analysis} selectedShen={selectedShen} view={view} />
        )}
      </div>

      <div className="avatar-metrics posture-metrics">
        <AvatarMetric label="Omuz" value={analysis.shoulderScore} />
        <AvatarMetric label="Kalça" value={analysis.hipScore} />
        <AvatarMetric label="Eksen" value={analysis.axisScore} />
      </div>
      <div className="posture-flags">
        {analysis.flags.map((flag) => (
          <span key={flag}>{flag}</span>
        ))}
      </div>
      <div className="avatar-feedback">
        {avatarReady ? analysis.feedback : "Kamerayı açınca MoveNet tam beden eklemlerini okuyacak. Boydan kadraj için telefonu biraz geriye al."}
      </div>
    </div>
  );
}

function PostureLiveSkeleton({
  mode,
  pose,
  selectedShen,
  view,
}: {
  mode: PostureRenderMode;
  pose: AvatarPose;
  selectedShen: (typeof fiveShen)[number];
  view: PostureView;
}) {
  const gradientId = `livePostureLine-${selectedShen.id}-${mode}-${view}`;
  const centerTop = getAvatarPoint(pose, "nose") ?? getAvatarPoint(pose, "left_eye") ?? getAvatarPoint(pose, "right_eye");
  const shoulderLeft = getAvatarPoint(pose, "left_shoulder");
  const shoulderRight = getAvatarPoint(pose, "right_shoulder");
  const hipLeft = getAvatarPoint(pose, "left_hip");
  const hipRight = getAvatarPoint(pose, "right_hip");
  const shoulderCenter = shoulderLeft && shoulderRight ? getAvatarMidpoint(shoulderLeft, shoulderRight) : undefined;
  const hipCenter = hipLeft && hipRight ? getAvatarMidpoint(hipLeft, hipRight) : undefined;
  const spinePoints = [centerTop, shoulderCenter, hipCenter].filter(Boolean) as AvatarPosePoint[];
  const className = mode === "3d" ? "avatar-body avatar-live-body" : "posture-skeleton-2d avatar-live-body avatar-live-body-2d";

  return (
    <svg className={className} viewBox="0 0 220 300" role="img" aria-label="Canlı MoveNet postür aynası">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={selectedShen.color} />
          <stop offset="100%" stopColor="#fff4c8" />
        </linearGradient>
      </defs>
      <ellipse className="avatar-shadow" cx="110" cy="270" rx="62" ry="13" />
      <line className="posture-center-line" x1="110" x2="110" y1="24" y2="266" />
      {spinePoints.length >= 2 ? (
        <path
          className="avatar-flow-path live-spine-guide"
          d={spinePoints
            .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
            .join(" ")}
        />
      ) : null}
      {poseConnections.map(([startName, endName]) => {
        const start = getAvatarPoint(pose, startName);
        const end = getAvatarPoint(pose, endName);
        if (!start || !end) return null;

        return (
          <line
            className="avatar-live-limb"
            key={`${startName}-${endName}`}
            stroke={`url(#${gradientId})`}
            x1={start.x}
            x2={end.x}
            y1={start.y}
            y2={end.y}
          />
        );
      })}
      {Array.from(pose.points.values()).map((point) => (
        <circle
          className={point.name === "nose" ? "avatar-head-dot avatar-live-head" : "avatar-joint avatar-live-joint"}
          cx={point.x}
          cy={point.y}
          key={point.name}
          r={point.name === "nose" ? 8.5 : 4.8}
        />
      ))}
      {hipCenter ? <circle className="avatar-core" cx={hipCenter.x} cy={hipCenter.y - 10} r="8" /> : null}
      <text className="posture-view-label" x="110" y="288">
        Canlı {view === "front" ? "ön" : view === "side" ? "yan" : "arka"} ayna
      </text>
    </svg>
  );
}

function normalizePoseForAvatar(keypoints: PoseKeypoint[], view: PostureView): AvatarPose | null {
  const visiblePoints = keypoints.filter((keypoint): keypoint is PoseKeypoint & { name: string } => Boolean(keypoint.name && isVisiblePosePoint(keypoint)));
  const bodyPoints = visiblePoints.filter((point) => !point.name.includes("eye") && !point.name.includes("ear"));
  if (bodyPoints.length < 4) return null;

  const xs = bodyPoints.map((point) => point.x);
  const ys = bodyPoints.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sourceWidth = Math.max(120, maxX - minX);
  const sourceHeight = Math.max(180, maxY - minY);
  const targetWidth = view === "side" ? 74 : 154;
  const targetHeight = 242;
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const usedWidth = sourceWidth * scale;
  const usedHeight = sourceHeight * scale;
  const offsetX = 110 - usedWidth / 2;
  const offsetY = 34 + (targetHeight - usedHeight) / 2;
  const points = new Map<string, AvatarPosePoint>();

  visiblePoints.forEach((point) => {
    let x = offsetX + (point.x - minX) * scale;
    const y = offsetY + (point.y - minY) * scale;

    if (view === "side") {
      x = 110 + (x - 110) * 0.44;
    } else if (view === "back") {
      x = 220 - x;
    }

    points.set(point.name, {
      name: point.name,
      score: point.score ?? 0,
      x: Math.max(18, Math.min(202, x)),
      y: Math.max(22, Math.min(274, y)),
    });
  });

  return {
    points,
    visibleCount: points.size,
  };
}

function getAvatarPoint(pose: AvatarPose, name: string): AvatarPosePoint | undefined {
  return pose.points.get(name);
}

function getAvatarMidpoint(first: AvatarPosePoint, second: AvatarPosePoint): AvatarPosePoint {
  return {
    name: `${first.name}-${second.name}`,
    score: Math.min(first.score, second.score),
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function PostureSkeleton2D({
  analysis,
  selectedShen,
  view,
}: {
  analysis: ReturnType<typeof analyzePosture>;
  selectedShen: (typeof fiveShen)[number];
  view: PostureView;
}) {
  const compressed = view === "side";
  const shoulderLeftX = compressed ? 102 : view === "back" ? 150 : 70;
  const shoulderRightX = compressed ? 118 : view === "back" ? 70 : 150;
  const hipLeftX = compressed ? 104 : view === "back" ? 140 : 82;
  const hipRightX = compressed ? 116 : view === "back" ? 80 : 138;
  const shoulderLeftY = 90 + analysis.shoulderTilt * 0.22;
  const shoulderRightY = 90 - analysis.shoulderTilt * 0.22;
  const hipLeftY = 168 + analysis.hipTilt * 0.18;
  const hipRightY = 168 - analysis.hipTilt * 0.18;
  const spineX = 110 + analysis.spineShift;
  const headX = 110 + analysis.spineShift * 0.45;

  return (
    <svg className="posture-skeleton-2d" viewBox="0 0 220 300" role="img" aria-label="2D postür çizgisi">
      <defs>
        <linearGradient id="posture2dLine" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={selectedShen.color} />
          <stop offset="100%" stopColor="#fff4c8" />
        </linearGradient>
      </defs>
      <line className="posture-center-line" x1="110" x2="110" y1="24" y2="266" />
      <path className="posture-curve-band" d={`M${headX} 58 C${108 + analysis.spineShift * 0.6} 98 ${spineX} 132 ${spineX} 170 C${spineX - analysis.spineShift * 0.4} 206 108 230 108 254`} />
      <circle className="posture-head" cx={headX} cy="45" r="16" />
      <line className="posture-bone" x1={shoulderLeftX} x2={shoulderRightX} y1={shoulderLeftY} y2={shoulderRightY} />
      <line className="posture-bone posture-hip-line" x1={hipLeftX} x2={hipRightX} y1={hipLeftY} y2={hipRightY} />
      <path className="posture-bone" d={`M${shoulderLeftX} ${shoulderLeftY} C${compressed ? 84 : 48} 118 ${compressed ? 84 : 44} 154 ${compressed ? 98 : 68} 184`} />
      <path className="posture-bone" d={`M${shoulderRightX} ${shoulderRightY} C${compressed ? 136 : 172} 118 ${compressed ? 136 : 176} 154 ${compressed ? 122 : 152} 184`} />
      <path className="posture-bone" d={`M${hipLeftX} ${hipLeftY} C${compressed ? 96 : 72} 204 ${compressed ? 96 : 62} 232 ${compressed ? 104 : 72} 264`} />
      <path className="posture-bone" d={`M${hipRightX} ${hipRightY} C${compressed ? 124 : 148} 204 ${compressed ? 124 : 158} 232 ${compressed ? 116 : 148} 264`} />
      {[
        [headX, 45],
        [shoulderLeftX, shoulderLeftY],
        [shoulderRightX, shoulderRightY],
        [hipLeftX, hipLeftY],
        [hipRightX, hipRightY],
        [compressed ? 98 : 68, 184],
        [compressed ? 122 : 152, 184],
        [compressed ? 104 : 72, 264],
        [compressed ? 116 : 148, 264],
      ].map(([x, y]) => (
        <circle className="posture-node" cx={x} cy={y} key={`${x}-${y}`} r="5" />
      ))}
      <text className="posture-view-label" x="110" y="288">
        {view === "front" ? "Ön hat" : view === "side" ? "Yan eksen" : "Arka hat"}
      </text>
    </svg>
  );
}

function AvatarMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="avatar-metric">
      <span>{label}</span>
      <i>
        <b style={{ width: `${value}%` }} />
      </i>
      <strong>{value}</strong>
    </div>
  );
}

function getPostureOverallScore(analysis: ReturnType<typeof analyzePosture>) {
  const values = [analysis.axisScore, analysis.shoulderScore, analysis.hipScore, analysis.breathScore].filter((value) => value > 0);
  if (!values.length) return 0;

  return Math.round((analysis.axisScore * 1.2 + analysis.shoulderScore + analysis.hipScore + analysis.breathScore * 0.72) / 3.92);
}

function getPostureMetricList(analysis: ReturnType<typeof analyzePosture>) {
  const postureScore = getPostureOverallScore(analysis);
  const balanceScore = Math.round((analysis.axisScore + analysis.hipScore + analysis.shoulderScore) / 3);

  return [
    { icon: "D", label: "Genel duruş", value: postureScore, measurement: `${Math.max(0.5, (100 - postureScore) * 0.12).toFixed(1)}°`, confidence: 94 },
    { icon: "O", label: "Omuz farkı", value: analysis.shoulderScore, measurement: `${Math.abs(analysis.shoulderTilt).toFixed(1)}°`, confidence: 93 },
    { icon: "S", label: "Gövde ekseni", value: analysis.axisScore, measurement: `${Math.abs(analysis.spineShift).toFixed(1)}°`, confidence: 92 },
    { icon: "K", label: "Kalça farkı", value: analysis.hipScore, measurement: `${Math.abs(analysis.hipTilt).toFixed(1)}°`, confidence: 91 },
    { icon: "G", label: "Diz ve denge", value: balanceScore, measurement: `${Math.max(0.8, (100 - balanceScore) * 0.15).toFixed(1)}°`, confidence: 88 },
    { icon: "N", label: "Nefes uyumu", value: analysis.breathScore, measurement: `%${analysis.breathScore}`, confidence: 86 },
  ];
}

function getMetricTone(value: number) {
  if (value >= 80) return "good";
  if (value >= 62) return "mid";
  return "fix";
}

function getPostureQualityCounts(analysis: ReturnType<typeof analyzePosture>) {
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

function getPostureCorrections(analysis: ReturnType<typeof analyzePosture>, ready: boolean) {
  if (!ready) {
    return ["Kamerayı açınca önce ayaklar ve baş aynı anda görünmeli. Analiz tam beden görünmeden başlamaz."];
  }

  const corrections = analysis.flags
    .filter((flag) => flag.includes("eğiliyor") || flag.includes("kaçıyor") || flag.includes("yana") || flag.includes("Ayakları"))
    .map((flag) => {
      if (flag.includes("Omuz")) return "Omuz çizgisinde fark var. Omuzlarını aşağı bırak ve göğsü zorlamadan aç.";
      if (flag.includes("Kalça")) return "Kalça hattı kayıyor. Ağırlığı iki ayağa daha eşit dağıt.";
      if (flag.includes("Merkez")) return "Baş ve gövde merkezden uzaklaşıyor. Tepeyi yukarı, kuyruk sokumunu aşağı düşün.";
      return "Ayaklar kadraj dışında kalıyor. Telefonu biraz daha geriye al.";
    });

  return corrections.length ? corrections : ["Belirgin bir alarm yok. Nefesi bozma; hareketin yumuşaklığını koru."];
}

function getPostureRecommendations(analysis: ReturnType<typeof analyzePosture>, view: PostureView) {
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

function analyzePosture(keypoints: PoseKeypoint[], movementScore: number, shenId: ShenId, view: PostureView) {
  const visibleCount = keypoints.filter((keypoint) => (keypoint.score ?? 0) > 0.35).length;
  if (visibleCount < 6) {
    return {
      axisScore: 0,
      breathScore: 0,
      feedback: "MoveNet bekleniyor.",
      flags: ["Kamera bekleniyor", "Tam beden kadrajı gerekli", "Ayaklar görünmeli", "2-3 metre geri çekil"],
      hipScore: 0,
      hipTilt: 0,
      lean: 0,
      shoulderScore: 0,
      shoulderTilt: 0,
      spineShift: 0,
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

  const shoulderTilt = getSignedPairTilt(leftShoulder, rightShoulder);
  const hipTilt = getSignedPairTilt(leftHip, rightHip);
  const shoulderScore = Math.round(Math.max(34, Math.min(98, 100 - Math.abs(shoulderTilt) * 2.2)));
  const hipScore = Math.round(Math.max(34, Math.min(98, 100 - Math.abs(hipTilt) * 2.4)));
  const shoulderCenter = getMidpoint(leftShoulder, rightShoulder);
  const hipCenter = getMidpoint(leftHip, rightHip);
  const headDeviation = nose && shoulderCenter && isVisiblePosePoint(nose) ? nose.x - shoulderCenter.x : 0;
  const torsoDeviation = shoulderCenter && hipCenter ? shoulderCenter.x - hipCenter.x : 0;
  const spineShift = Math.max(-20, Math.min(20, headDeviation * 0.035 + torsoDeviation * 0.045));
  const axisScore = Math.round(Math.max(32, Math.min(98, 100 - Math.abs(spineShift) * 2.8)));
  const lean = Math.max(-10, Math.min(10, shoulderTilt / 2.1 + spineShift / 4.5));
  const fullBodyReady = [leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle].every((point) => isVisiblePosePoint(point));
  const breathScore = Math.max(46, Math.min(97, movementScore + (shenId === "po" ? 8 : 2)));
  const flags = [
    Math.abs(shoulderTilt) > 8 ? "Omuz hattı eğiliyor" : "Omuz hattı sakin",
    Math.abs(hipTilt) > 8 ? "Kalça çizgisi kaçıyor" : "Kalça dengeli",
    Math.abs(spineShift) > 8 ? "Merkez ekseni yana kayıyor" : "Eksen merkezde",
    fullBodyReady ? "Tam beden görünür" : "Ayakları da kadraja al",
  ];

  const viewCue =
    view === "front"
      ? "Ön görünümde omuz ve kalça çizgisini yatay tut."
      : view === "side"
        ? "Yan görünümde baş, göğüs ve pelvis aynı eksende kalsın."
        : "Arka görünümde sağ-sol yük dağılımını eşitle.";
  const feedback =
    axisScore > 82 && shoulderScore > 78 && hipScore > 78
      ? `${viewCue} Şu an postür çizgin oldukça temiz; nefesi bozmadan devam et.`
      : `${viewCue} ${Math.abs(spineShift) > 8 ? "Baş ve gövdeyi merkeze çağır." : "Omuzları yumuşat ve dizleri kilitleme."}`;

  return {
    axisScore,
    breathScore,
    feedback,
    flags,
    hipScore,
    hipTilt,
    lean,
    shoulderScore,
    shoulderTilt,
    spineShift,
  };
}

function getAvatarLean(keypoints: PoseKeypoint[]) {
  const leftShoulder = keypoints.find((keypoint) => keypoint.name === "left_shoulder");
  const rightShoulder = keypoints.find((keypoint) => keypoint.name === "right_shoulder");
  if (!leftShoulder || !rightShoulder || (leftShoulder.score ?? 0) < 0.3 || (rightShoulder.score ?? 0) < 0.3) return 0;

  return Math.max(-7, Math.min(7, (leftShoulder.y - rightShoulder.y) / 10));
}

function getSignedPairTilt(left?: PoseKeypoint, right?: PoseKeypoint) {
  if (!isVisiblePosePoint(left) || !isVisiblePosePoint(right)) return 0;
  return Math.max(-24, Math.min(24, left.y - right.y));
}

function getMidpoint(left?: PoseKeypoint, right?: PoseKeypoint) {
  if (!isVisiblePosePoint(left) || !isVisiblePosePoint(right)) return undefined;
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
  };
}

function HumanMap({
  selectedShen,
  sidePanel,
}: {
  selectedShen: (typeof fiveShen)[number];
  sidePanel?: ReactNode;
}) {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(selectedShen.mapStage);
  const [gateInfoOpen, setGateInfoOpen] = useState(false);
  const activeStage = neijingStages[activeStageIndex] ?? neijingStages[selectedShen.mapStage];
  const mapProgress = Math.round(((activeStageIndex + 1) / neijingStages.length) * 100);
  const journeyScore = mapProgress;
  const bodyRevealed = journeyScore >= 100;
  const personalFeedback = getPersonalMapFeedback(activeStage, selectedShen, activeStageIndex, bodyRevealed);
  const activeGateTone = activeStage.shenId ? getShenById(activeStage.shenId) : selectedShen;

  function selectStage(index: number, openInfo = true) {
    setActiveStageIndex(index);
    if (openInfo) {
      setGateInfoOpen(true);
    }
  }

  function moveGate(direction: 1 | -1) {
    const nextIndex = (activeStageIndex + direction + neijingStages.length) % neijingStages.length;
    selectStage(nextIndex);
  }

  return (
    <div className="glass-card human-map-card neijing-card cut-safe-card">
      <div className="section-heading cut-safe-heading" style={{ margin: "0 0 12px" }}>
        <h2>{bodyRevealed ? "Beden Haritası Uyandı" : "Kapılar Yolu"}</h2>
        <span>{bodyRevealed ? "100 puan tamamlandı" : `${journeyScore} / 100 puan`}</span>
      </div>
      <div className={`neijing-map-shell ${sidePanel ? "neijing-map-shell-with-panel" : ""}`}>
        <div
          className={`neijing-map ${bodyRevealed ? "neijing-map-revealed" : "neijing-map-locked"}`}
          aria-label={bodyRevealed ? `Beden haritası, seçili alan ${selectedShen.mapTitle}` : `Kapılar yolu, seçili kapı ${activeStage.title}`}
          style={
            {
              "--journey-progress": `${mapProgress}%`,
            } as CSSProperties
          }
        >
          <img className="neijing-map-image" src="/images/neijing-map.jpg" alt="" />
          <div className="map-sensor map-sensor-left" aria-hidden="true">
            <span>{selectedShen.dailyName.replace(" Modu", "")}</span>
            <strong>{selectedShen.name}</strong>
            <i style={{ height: `${Math.max(28, selectedShen.value)}%` }} />
          </div>
          <div className="map-sensor map-sensor-right" aria-hidden="true">
            <span>{journeyScore}</span>
            <strong>Puan</strong>
            <i style={{ height: `${journeyScore}%` }} />
          </div>
          <svg className="neijing-flow" viewBox="0 0 464 832" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <mask id="river-progress-mask">
                <path
                  d="M220 760 C238 704 300 650 250 574 C204 504 284 448 236 382 C192 320 266 264 232 198 C206 148 226 112 246 78"
                  pathLength={100}
                  stroke="white"
                  strokeLinecap="round"
                  strokeWidth="22"
                  style={{ strokeDasharray: 100, strokeDashoffset: 100 - mapProgress }}
                />
              </mask>
            </defs>
            <path className="river-bed" d="M220 760 C238 704 300 650 250 574 C204 504 284 448 236 382 C192 320 266 264 232 198 C206 148 226 112 246 78" />
            <path
              className="river-progress"
              d="M220 760 C238 704 300 650 250 574 C204 504 284 448 236 382 C192 320 266 264 232 198 C206 148 226 112 246 78"
              pathLength={100}
              style={{ strokeDasharray: 100, strokeDashoffset: 100 - mapProgress }}
            />
            <path
              className="river-spark"
              d="M220 760 C238 704 300 650 250 574 C204 504 284 448 236 382 C192 320 266 264 232 198 C206 148 226 112 246 78"
              mask="url(#river-progress-mask)"
              pathLength={100}
            />
            <path className="flow-b" d="M245 78 C296 154 304 221 276 288 C248 354 304 403 276 468 C248 532 300 590 250 676 C235 704 222 728 220 758" />
          </svg>
          <div
            className="map-boat"
            style={{ left: `${activeStage.x}%`, top: `${activeStage.y}%` }}
            aria-hidden="true"
          >
            ◢
          </div>
          {neijingStages.map((stage, index) => (
            <div key={stage.title}>
              <button
                aria-label={`${stage.title} bölgesini seç`}
                className={`neijing-hotspot ${activeStageIndex === index ? "neijing-hotspot-active" : ""}`}
                onClick={() => selectStage(index)}
                style={{ left: `${stage.x}%`, top: `${stage.y}%` }}
                type="button"
              >
                {index + 1}
              </button>
            </div>
          ))}
          {gateInfoOpen ? (
            <div className="gate-info-card" role="dialog" aria-label={`${activeStage.title} bilgileri`}>
              <div className="gate-info-topline">
                <span className="eyebrow">Kapı {activeStageIndex + 1}</span>
                <button className="gate-info-close" onClick={() => setGateInfoOpen(false)} type="button" aria-label="Kapı bilgisini kapat">
                  ×
                </button>
              </div>
              <div className="gate-info-title-row">
                <div>
                  <h3>{activeStage.title}</h3>
                  <p>{activeGateTone.dailyName} · {activeGateTone.name}</p>
                </div>
                <strong>{activeStage.reward}</strong>
              </div>
              <p className="gate-info-text">{activeStage.text}</p>
              <div className="gate-benefit-grid">
                {activeStage.benefits.map((benefit) => (
                  <span key={benefit}>{benefit}</span>
                ))}
              </div>
              <div className="gate-life-note">
                <span>Günlük hayatta</span>
                <p>{activeStage.dailyUse}</p>
              </div>
              <div className="gate-life-note gate-practice-note">
                <span>Mini pratik</span>
                <p>{activeStage.microPractice}</p>
              </div>
              <div className="gate-info-actions">
                <button className="secondary-action compact-action" onClick={() => moveGate(-1)} type="button">
                  Önceki
                </button>
                <button className="primary-action compact-action" onClick={() => moveGate(1)} type="button">
                  Sonraki Kapı
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="neijing-side-stack">
          {sidePanel}
          <div className="human-map-copy neijing-copy">
            <div className="neijing-detail-head">
              <span className="eyebrow">{bodyRevealed ? "İç harita" : "Kapı sınavı"}</span>
              <span className="neijing-reward">{activeStage.reward}</span>
            </div>
            <div className="item-title">{activeStage.title}</div>
            <div className="map-journey-strip">
              <span>Şu an</span>
              <strong>{activeStageIndex + 1}</strong>
              <span>sonraki kapı</span>
              <strong>{activeStageIndex === neijingStages.length - 1 ? "✓" : activeStageIndex + 2}</strong>
            </div>
            <div className="item-subtitle">{personalFeedback}</div>
            <div className={`map-reveal-note ${bodyRevealed ? "map-reveal-note-open" : ""}`}>
              {bodyRevealed
                ? "Yol tamamlandı: artık haritadaki kapıları nefes, dikkat ve duruş hattı olarak okuyorsun."
                : "Harita baştan açık. Puanın sadece bugün hangi kapıda yürüdüğünü ve hangi beceriyi çalıştığını gösterir."}
            </div>
            <div className="map-progress-meta">
              <span>Kapı {activeStageIndex + 1} / {neijingStages.length}</span>
              <strong>{journeyScore} puan</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${journeyScore}%` }} />
            </div>
            <button className="secondary-action map-action" onClick={() => selectStage((activeStageIndex + 1) % neijingStages.length)} type="button">
              Sonraki Kapı
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShenLivePanel({ selectedShen }: { selectedShen: (typeof fiveShen)[number] }) {
  return (
    <div className="mode-console shen-live-panel">
      <div className="live-row">
        <div className="live-mode">
          <span className="pulse-dot" />
          {selectedShen.dailyName.toUpperCase()} canlı
        </div>
        <span className="mode-symbol">{selectedShen.symbol}</span>
      </div>
      <div className="mode-orb">
        <div className="orb-center">
          <strong>{selectedShen.dailyName}</strong>
          <span>5 Shen: {selectedShen.name} • {selectedShen.essence}</span>
        </div>
      </div>
      <div className="daily-mode-feedback">
        {selectedShen.dailyPrompt} Bu rehberin kadim adı {selectedShen.name}; bugün kapılarını bu hat üzerinden açacak.
      </div>
      <div className="trait-grid">
        <div className="trait">
          <small>Geometri</small>
          {selectedShen.geometry}
        </div>
        <div className="trait">
          <small>Hareket</small>
          {selectedShen.motion}
        </div>
        <div className="trait">
          <small>Ses</small>
          {selectedShen.sound}
        </div>
        <div className="trait">
          <small>Dil</small>
          {selectedShen.language}
        </div>
      </div>
    </div>
  );
}

function getPersonalMapFeedback(stage: NeijingStage, selectedShen: (typeof fiveShen)[number], stageIndex: number, bodyRevealed: boolean) {
  const tone = stage.shenId ? getShenById(stage.shenId) : selectedShen;
  const nextStep = stageIndex < neijingStages.length - 1 ? neijingStages[stageIndex + 1]?.title : "üst kapı";
  const gateCue = stageIndex <= selectedShen.mapStage
    ? "Bu kapıda gereken temel beceriyi kazanmış görünüyorsun."
    : "Bu kapı henüz hazırlık istiyor; önce nefes, ritim ve dikkat hattını sakinleştir.";

  if (!bodyRevealed) {
    return `${gateCue} Bugünkü ${selectedShen.dailyName} içinde ${tone.label.toLocaleLowerCase("tr-TR")} becerisi üzerinden ilerliyorsun. Geleneksel karşılığı: ${selectedShen.name}. Bir sonraki geçiş: ${nextStep}.`;
  }

  return `${gateCue} ${stage.text} Artık bu kapının bedenindeki karşılığını da görüyorsun. Bugünkü ${selectedShen.dailyName}, 5 Shen içinde ${selectedShen.name} hattına denk geliyor. Bir sonraki geçiş: ${nextStep}.`;
}


function polarPoint(cx: number, cy: number, radius: number, angleDegrees: number) {
  const angle = ((angleDegrees - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function annularSectorPath(
  startAngle: number,
  endAngle: number,
  innerRadius = 118,
  outerRadius = 238,
  cx = 260,
  cy = 260,
) {
  const outerStart = polarPoint(cx, cy, outerRadius, endAngle);
  const outerEnd = polarPoint(cx, cy, outerRadius, startAngle);
  const innerStart = polarPoint(cx, cy, innerRadius, startAngle);
  const innerEnd = polarPoint(cx, cy, innerRadius, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

const baguaDirections = [
  { id: "qian", trigram: "☰", name: "Qian", title: "Gök", module: "AI Koç", tab: "practice" as TabId, cue: "Vizyonunu netleştir; rehberinle bugünün pratiğini seç.", accent: "#f3cf8b", image: "/images/shen-universe.jpg" },
  { id: "dui", trigram: "☱", name: "Dui", title: "Göl", module: "Paylaşım", tab: "journal" as TabId, cue: "Deneyimini adlandır; bugünün yansımasını kaydet.", accent: "#d9bd80", image: "/images/shen-river-yi.jpg" },
  { id: "li", trigram: "☲", name: "Li", title: "Ateş", module: "Pratik", tab: "practice" as TabId, cue: "Canlılığı harekete geçir; kısa bir Shibashi akışı başlat.", accent: "#ff7a18", image: "/images/shen-mode-hun.jpg" },
  { id: "zhen", trigram: "☳", name: "Zhen", title: "Gök Gürültüsü", module: "Postür", tab: "posture" as TabId, cue: "Uyan ve hizalan; beden eksenini yeniden kontrol et.", accent: "#f4a340", image: "/images/shen-river-hun.jpg" },
  { id: "xun", trigram: "☴", name: "Xun", title: "Rüzgâr", module: "Günlük", tab: "journal" as TabId, cue: "İçgörünün sessizce yayılmasına izin ver; bir reflection yaz.", accent: "#79d6ad", image: "/images/shen-mode-yi.jpg" },
  { id: "kan", trigram: "☵", name: "Kan", title: "Su", module: "Nefes", tab: "practice" as TabId, cue: "Akışı zorlamadan sürdür; nefes ritmine dön.", accent: "#5eb7d8", image: "/images/shen-river-zhi.jpg" },
  { id: "gen", trigram: "☶", name: "Gen", title: "Dağ", module: "Denge", tab: "posture" as TabId, cue: "Dur, köklen ve merkezini dinle; postür taraması yap.", accent: "#b6a982", image: "/images/shen-mode-po.jpg" },
  { id: "kun", trigram: "☷", name: "Kun", title: "Toprak", module: "Toparlanma", tab: "home" as TabId, cue: "Temele dön; bugünkü enerjini ve ritmini gözden geçir.", accent: "#c89962", image: "/images/inner-gate-path.png" },
] as const;

function JourneyScreen({
  onNavigate,
  onSelectCoach,
  postureCount,
  practiceCount,
  selectedCoachId,
  selectedShen,
  userName,
}: {
  onNavigate: (tab: TabId) => void;
  onSelectCoach: (coachId: AiCoach["id"]) => void;
  postureCount: number;
  practiceCount: number;
  selectedCoachId: AiCoach["id"];
  selectedShen: (typeof fiveShen)[number];
  userName: string;
}) {
  const [view, setView] = useState<"bagua" | "map" | "guide">("bagua");
  const recommendedIndex = useMemo(() => {
    if (postureCount === 0) return 6;
    if (practiceCount === 0) return 2;
    return (practiceCount + postureCount + selectedShen.mapStage) % baguaDirections.length;
  }, [postureCount, practiceCount, selectedShen.mapStage]);
  const [activeIndex, setActiveIndex] = useState(recommendedIndex);
  const activeDirection = baguaDirections[activeIndex] ?? baguaDirections[0];
  const selectedCoach = aiCoaches.find((coach) => coach.id === selectedCoachId) ?? aiCoaches[0];
  const journeyXp = Math.min(800, practiceCount * 28 + postureCount * 42);
  const unlockedGates = Math.max(1, Math.min(8, 1 + Math.floor(journeyXp / 100)));
  const streak = Math.max(1, Math.min(21, practiceCount + Math.floor(postureCount / 2)));
  useEffect(() => {
    setActiveIndex(recommendedIndex);
  }, [recommendedIndex]);

  return (
    <section className="screen journey-screen bagua-screen">
      <div className="bagua-header">
        <div>
          <span className="eyebrow">Yaşayan pusula</span>
          <h1>{userName || "Sen"}, bugün hangi yöne dönüyorsun?</h1>
          <p>Bagua, pratiklerini ve içsel gelişimini sekiz çalışma yönünde birleştirir.</p>
        </div>
        <div className="journey-view-switch" aria-label="Bagua görünümü">
          <button className={view === "bagua" ? "active" : ""} onClick={() => setView("bagua")} type="button">Bagua</button>
          <button className={view === "map" ? "active" : ""} onClick={() => setView("map")} type="button">İnsan Haritası</button>
          <button className={view === "guide" ? "active" : ""} onClick={() => setView("guide")} type="button">Rehber</button>
        </div>
      </div>

      {view === "bagua" ? (
        <div className="bagua-layout">
          <div className="bagua-stage" style={{ "--bagua-accent": activeDirection.accent } as CSSProperties}>
            <div className="bagua-ambient bagua-ambient-one" />
            <div className="bagua-ambient bagua-ambient-two" />
            <div className="bagua-wheel-shell">
              <div className="bagua-orbit bagua-orbit-outer" />
              <div className="bagua-orbit bagua-orbit-inner" />
              <div className="bagua-wheel">
                <svg className="bagua-svg" viewBox="0 0 520 520" role="img" aria-label="Sekiz yönlü yaşayan Bagua çarkı">
                  <defs>
                    <radialGradient id="baguaCenterGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={activeDirection.accent} stopOpacity="0.28" />
                      <stop offset="70%" stopColor="#090b0d" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#000" stopOpacity="0" />
                    </radialGradient>
                    {baguaDirections.map((direction) => (
                      <pattern id={`bagua-image-${direction.id}`} key={`pattern-${direction.id}`} patternUnits="userSpaceOnUse" width="520" height="520">
                        <image href={direction.image} x="0" y="0" width="520" height="520" preserveAspectRatio="xMidYMid slice" />
                      </pattern>
                    ))}
                    <filter id="baguaGlow" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="7" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>

                  <circle cx="260" cy="260" r="252" className="bagua-svg-rim" />
                  <circle cx="260" cy="260" r="244" className="bagua-svg-rim bagua-svg-rim-dashed" />
                  <circle cx="260" cy="260" r="226" className="bagua-svg-rim bagua-svg-rim-inner" />

                  <g className="bagua-sector-group">
                    {baguaDirections.map((direction, index) => {
                      const start = index * 45 - 22.5;
                      const end = start + 45;
                      return (
                        <g key={`sector-${direction.id}`}>
                          <path
                            className={`bagua-svg-sector ${index === activeIndex ? "is-active" : ""}`}
                            d={annularSectorPath(start, end)}
                            fill={`url(#bagua-image-${direction.id})`}
                            onClick={() => setActiveIndex(index)}
                          />
                          <path className="bagua-svg-sector-shade" d={annularSectorPath(start, end)} />
                          <path className="bagua-svg-divider" d={`M ${polarPoint(260,260,112,start).x} ${polarPoint(260,260,112,start).y} L ${polarPoint(260,260,240,start).x} ${polarPoint(260,260,240,start).y}`} />
                        </g>
                      );
                    })}
                  </g>

                  <circle cx="260" cy="260" r="118" className="bagua-svg-inner-ring" />
                  <circle cx="260" cy="260" r="91" fill="url(#baguaCenterGlow)" />
                  <g className="bagua-svg-trigrams">
                    {baguaDirections.map((direction, index) => {
                      const point = polarPoint(260, 260, 176, index * 45);
                      return (
                        <g key={`trigram-${direction.id}`} transform={`translate(${point.x} ${point.y})`}>
                          <text className="bagua-svg-trigram" textAnchor="middle" dominantBaseline="middle">{direction.trigram}</text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {baguaDirections.map((direction, index) => {
                  const angle = index * 45 - 90;
                  const radians = (angle * Math.PI) / 180;
                  const orbitRadius = 39.5;
                  return (
                    <button
                      aria-label={`${direction.name} ${direction.title}: ${direction.module}`}
                      className={`bagua-node ${index === activeIndex ? "bagua-node-active" : ""} ${index === recommendedIndex ? "bagua-node-recommended" : ""}`}
                      key={direction.id}
                      onClick={() => setActiveIndex(index)}
                      style={{
                        left: `${50 + Math.cos(radians) * orbitRadius}%`,
                        top: `${50 + Math.sin(radians) * orbitRadius}%`,
                        "--node-counter-angle": "0deg",
                        "--node-accent": direction.accent,
                      } as CSSProperties}
                      type="button"
                    >
                      <span className="bagua-node-inner">
                        <strong>{direction.trigram}</strong>
                        <small>{direction.name} · {direction.title}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="bagua-center">
                <span className="bagua-taiji">☯</span>
                <small>Seçili yön · {activeDirection.name}</small>
                <strong>{activeDirection.module}</strong>
                <em>{activeDirection.title}</em>
              </div>
            </div>
            <div className="bagua-selection-chip" aria-live="polite">
              <span>Seçimin</span>
              <strong>{activeDirection.trigram} {activeDirection.name}</strong>
              <small>{activeDirection.title} · {activeDirection.module}</small>
            </div>
            <div className="bagua-stage-caption">
              <span>8 yön · 1 merkez</span>
              <strong>{activeDirection.trigram} {activeDirection.name} · {activeDirection.title}</strong>
            </div>
          </div>

          <aside className="bagua-insight-panel">
            <div className="bagua-ai-label"><span>✦</span> EFE AI önerisi</div>
            <h2>Bugünün yönü: {activeDirection.title}</h2>
            <p>{activeDirection.cue}</p>
            <div className="bagua-energy-strip">
              <div><span>Jing</span><strong>{Math.min(99, 62 + practiceCount * 3)}</strong></div>
              <div><span>Qi</span><strong>{Math.min(99, 58 + postureCount * 4)}</strong></div>
              <div><span>Shen</span><strong>{selectedShen.value}</strong></div>
            </div>
            <button className="bagua-primary-action" onClick={() => onNavigate(activeDirection.tab)} type="button">
              {activeDirection.module} yönüne geç <span>→</span>
            </button>
            <button className="bagua-secondary-action" onClick={() => setActiveIndex(recommendedIndex)} type="button">
              AI önerisini yeniden merkezle
            </button>
            <div className="bagua-progress-mini">
              <div><span>Açılan yön</span><strong>{unlockedGates}/8</strong></div>
              <div><span>Günlük seri</span><strong>{streak} gün</strong></div>
              <div><span>Yol puanı</span><strong>{journeyXp}</strong></div>
            </div>
          </aside>
        </div>
      ) : view === "map" ? (
        <div className="journey-human-map-view">
          <div className="journey-human-map-intro glass-card">
            <div>
              <span className="eyebrow">İçsel yolculuk</span>
              <h2>İnsan Haritası</h2>
              <p>Bedenindeki sekiz kapıyı aç, seçili Shen hattını izle ve yolculuğunu adım adım ilerlet.</p>
            </div>
            <button className="secondary-action compact-action" onClick={() => setView("bagua")} type="button">
              Bagua’ya dön
            </button>
          </div>
          <HumanMap selectedShen={selectedShen} sidePanel={<ShenLivePanel selectedShen={selectedShen} />} />
        </div>
      ) : (
        <JourneyGuideSelector
          onSelectCoach={onSelectCoach}
          selectedCoach={selectedCoach}
          selectedCoachId={selectedCoachId}
        />
      )}
    </section>
  );
}

function JourneyGuideSelector({
  onSelectCoach,
  selectedCoach,
  selectedCoachId,
}: {
  onSelectCoach: (coachId: AiCoach["id"]) => void;
  selectedCoach: AiCoach;
  selectedCoachId: AiCoach["id"];
}) {
  return (
    <div className="glass-card journey-guide-card">
      <div className="journey-guide-hero">
        <span className={`coach-portrait coach-portrait-${selectedCoach.imageIndex}`} />
        <div>
          <span className="eyebrow">Yolculuk Rehberini Seç</span>
          <h2>{selectedCoach.name}</h2>
          <p>{selectedCoach.role}. Seçimin kaydedilir; canlı komutların tonu ve ritmi bundan sonra bu rehberden gelir.</p>
        </div>
      </div>
      <div className="journey-guide-grid" aria-label="Sekiz Ölümsüz yolculuk rehberi seçimi">
        {aiCoaches.map((coach) => {
          const coachShen = getShenById(coach.shenId);
          return (
            <button
              className={`journey-guide-option ${coach.id === selectedCoachId ? "journey-guide-option-active" : ""}`}
              key={coach.id}
              onClick={() => onSelectCoach(coach.id)}
              style={{ "--shen-card-accent": coachShen.color } as CSSProperties}
              type="button"
            >
              <span className={`coach-portrait coach-portrait-${coach.imageIndex}`} />
              <strong>{coach.name}</strong>
              <small>{coach.role}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InnerGateJourneyPanel({ selectedShen }: { selectedShen: (typeof fiveShen)[number] }) {
  const [activeSceneIndex, setActiveSceneIndex] = useState(Math.min(selectedShen.mapStage, innerJourneyScenes.length - 1));
  const activeScene = innerJourneyScenes[activeSceneIndex] ?? innerJourneyScenes[0];
  const progress = Math.round(((activeSceneIndex + 1) / innerJourneyScenes.length) * 100);

  return (
    <div
      className="glass-card inner-gate-journey-card"
      style={
        {
          "--inner-progress": `${progress}%`,
          "--inner-node-x": `${activeScene.x}%`,
          "--inner-node-y": `${activeScene.y}%`,
        } as CSSProperties
      }
    >
      <div className="inner-gate-journey-stage">
        <img className="inner-gate-journey-image" src="/images/inner-gate-path.png" alt="Beden içindeki kapılar yolu" />
        <div className="inner-gate-journey-vignette" />
        <div className="inner-gate-journey-line">
          <span />
        </div>
        <div className="inner-gate-journey-marker">
          <i />
        </div>
        {innerJourneyScenes.map((scene, index) => (
          <button
            aria-label={`${scene.gate} ${scene.title}`}
            className={`inner-gate-hotspot ${activeSceneIndex === index ? "inner-gate-hotspot-active" : ""}`}
            key={scene.id}
            onClick={() => setActiveSceneIndex(index)}
            style={{ left: `${scene.x}%`, top: `${scene.y}%` }}
            type="button"
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="inner-gate-journey-copy">
        <div className="section-heading" style={{ margin: 0 }}>
          <div>
            <span className="eyebrow">İç Yol Sahnesi</span>
            <h2>{activeScene.title}</h2>
          </div>
          <span>{progress}%</span>
        </div>
        <p>{activeScene.bodyHint}</p>
        <div className="inner-encounter-card">
          <span className="eyebrow">Karşılaşma</span>
          <strong>{activeScene.encounter}</strong>
        </div>
        <div className="inner-encounter-card inner-ritual-card">
          <span className="eyebrow">Pratiğe Bağlantı</span>
          <strong>{activeScene.ritual}</strong>
        </div>
        <div className="inner-gate-strip">
          {innerJourneyScenes.map((scene, index) => (
            <button
              className={activeSceneIndex === index ? "inner-gate-strip-active" : ""}
              key={scene.id}
              onClick={() => setActiveSceneIndex(index)}
              type="button"
            >
              {scene.gate}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function JournalScreen({
  gallery,
  postureReports,
  selectedShen,
}: {
  gallery: PracticeSnapshot[];
  postureReports: PostureReport[];
  selectedShen: (typeof fiveShen)[number];
}) {
  const todayKey = formatSnapshotDate(new Date());
  const todaysPractices = gallery.filter((item) => item.dateKey === todayKey);
  const todaysPostureReports = postureReports.filter((item) => item.dateKey === todayKey);
  const groupedGallery = groupSnapshotsByDate(gallery);
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);
  const [mood, setMood] = useState("Sakin");
  const recentScores = [...gallery].slice(0, 7).map((item) => item.score);
  const averagePracticeScore = recentScores.length ? Math.round(recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length) : 0;
  const averagePostureScore = postureReports.length ? Math.round(postureReports.slice(0, 7).reduce((sum, item) => sum + item.score, 0) / Math.min(7, postureReports.length)) : 0;
  const consistencyScore = Math.min(100, gallery.length * 8 + postureReports.length * 5);

  useEffect(() => {
    setReflection(window.localStorage.getItem("ritim-kapisi-daily-reflection") ?? "");
    setMood(window.localStorage.getItem("ritim-kapisi-daily-mood") ?? "Sakin");
  }, []);

  function saveReflection() {
    window.localStorage.setItem("ritim-kapisi-daily-reflection", reflection.trim());
    window.localStorage.setItem("ritim-kapisi-daily-mood", mood);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <section className="screen daily-journal-screen">
      <div className="daily-journal-hero">
        <div>
          <span className="eyebrow">Günlük</span>
          <h1>Bugünün beden kaydı.</h1>
          <p>Pratiklerin, postür analizlerin ve günün yansıması tek bir akışta.</p>
        </div>
        <div className="daily-journal-date">
          <strong>{new Intl.DateTimeFormat("tr-TR", { day: "2-digit" }).format(new Date())}</strong>
          <span>{new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(new Date())}</span>
        </div>
      </div>

      <div className="daily-summary-grid">
        <article>
          <span className="daily-summary-icon">◉</span>
          <strong>{todaysPractices.length}</strong>
          <small>bugünkü pratik</small>
        </article>
        <article>
          <span className="daily-summary-icon">↕</span>
          <strong>{todaysPostureReports.length}</strong>
          <small>postür analizi</small>
        </article>
        <article>
          <span className="daily-summary-icon">✦</span>
          <strong>{gallery.length}</strong>
          <small>tüm pratikler</small>
        </article>
      </div>

      <div className="journal-insight-grid">
        <article className="glass-card journal-wellbeing-card">
          <span className="eyebrow">Bugün nasıl hissediyorsun?</span>
          <div className="journal-mood-row">
            {["Sakin", "Enerjik", "Huzurlu", "Yorgun", "Stresli"].map((item) => (
              <button className={mood === item ? "active" : ""} key={item} onClick={() => setMood(item)} type="button">{item}</button>
            ))}
          </div>
          <small>Seçimin yansımayla birlikte kaydedilir.</small>
        </article>
        <article className="glass-card journal-ai-insight">
          <span className="eyebrow">AI Günlük Yorumu</span>
          <h2>{gallery.length || postureReports.length ? "Bugün ritmin daha görünür." : "İlk kaydınla kişisel desenin başlayacak."}</h2>
          <p>{averagePostureScore >= 75 ? "Postür hattın dengeli görünüyor. Nefesi yavaş tutup bu dengeyi koru." : "Omuz ve merkez hattına nazikçe dön. Kısa ama düzenli pratik bugün daha değerli."}</p>
        </article>
      </div>

      <div className="journal-progress-strip">
        <article><span>Pratik Uyumu</span><strong>{averagePracticeScore || "—"}{averagePracticeScore ? "%" : ""}</strong></article>
        <article><span>Postür</span><strong>{averagePostureScore || "—"}{averagePostureScore ? "%" : ""}</strong></article>
        <article><span>Süreklilik</span><strong>{consistencyScore}%</strong></article>
        <article><span>Bugünkü Mod</span><strong>{mood}</strong></article>
      </div>

      <div className="daily-journal-grid">
        <div className="glass-card daily-journal-section">
          <div className="section-heading">
            <div><span className="eyebrow">Bugün</span><h2>Yaptığın pratikler</h2></div>
            <span>{todaysPractices.length} kayıt</span>
          </div>
          {todaysPractices.length ? (
            <div className="daily-practice-list">
              {todaysPractices.map((snapshot) => (
                <article key={snapshot.id}>
                  <img src={snapshot.imageData} alt="" />
                  <div><strong>{snapshot.movementName}</strong><small>{snapshot.timeLabel} · %{snapshot.score} uyum</small></div>
                  <span>{snapshot.score}</span>
                </article>
              ))}
            </div>
          ) : <div className="empty-gallery">Bugünkü ilk pratiğini tamamladığında burada görünecek.</div>}
        </div>

        <div className="glass-card daily-journal-section">
          <div className="section-heading">
            <div><span className="eyebrow">Beden Hattı</span><h2>Postür analizlerin</h2></div>
            <span>{postureReports.length} kayıt</span>
          </div>
          {postureReports.length ? (
            <div className="daily-posture-list">
              {postureReports.slice(0, 4).map((report) => (
                <article key={report.id}>
                  <div className="daily-posture-score">{report.score}</div>
                  <div><strong>{report.dateKey}</strong><small>{report.summary}</small></div>
                  <span>{report.asymmetrySignal}</span>
                </article>
              ))}
            </div>
          ) : <div className="empty-gallery">İlk postür analizin burada tarih ve skoruyla birikecek.</div>}
        </div>
      </div>

      <div className="glass-card reflection-card">
        <div className="section-heading">
          <div><span className="eyebrow">Günün Yansıması</span><h2>Bugün bedeninde ne değişti?</h2></div>
          <span>{selectedShen.dailyName}</span>
        </div>
        <textarea
          className="input-surface journal-entry"
          onChange={(event) => setReflection(event.target.value)}
          placeholder="Nefesim, dengem, enerjim veya zihnim hakkında kısa bir not..."
          value={reflection}
          aria-label="Günlük yansıma"
        />
        <button className="primary-action" onClick={saveReflection} type="button">
          {saved ? "Yansıma kaydedildi" : "Yansımayı Kaydet"}
        </button>
      </div>

      <div className="glass-card all-practices-card">
        <div className="section-heading">
          <div><span className="eyebrow">Arşiv</span><h2>Tüm pratikler</h2></div>
          <span>{gallery.length} kayıt</span>
        </div>
        {groupedGallery.length ? groupedGallery.map(([dateKey, snapshots]) => (
          <div className="gallery-day" key={dateKey}>
            <div className="gallery-date">{dateKey}</div>
            <div className="daily-archive-row">
              {snapshots.map((snapshot) => (
                <article key={snapshot.id}>
                  <img src={snapshot.imageData} alt={`${snapshot.movementName} ekran görüntüsü`} />
                  <div><strong>{snapshot.movementName}</strong><small>{snapshot.timeLabel} · %{snapshot.score}</small></div>
                </article>
              ))}
            </div>
          </div>
        )) : <div className="empty-gallery">Henüz arşivlenmiş pratik yok.</div>}
      </div>
    </section>
  );
}

function ProfileScreen({
  musicState,
  onRestartOnboarding,
  onSelectShen,
  onToggleMusic,
  postureReports,
  selectedShen,
  selectedShenId,
  userName,
}: {
  musicState: "açık" | "kapalı";
  onRestartOnboarding: () => void;
  onSelectShen: (shen: ShenId) => void;
  onToggleMusic: () => void;
  postureReports: PostureReport[];
  selectedShen: (typeof fiveShen)[number];
  selectedShenId: ShenId;
  userName: string;
}) {
  return (
    <section className="screen profile-screen-simple">
      <div className="profile-intro">
        <div className="profile-avatar">{(userName.trim()[0] ?? "R").toLocaleUpperCase("tr-TR")}</div>
        <div>
          <span className="eyebrow">Uygulayıcı</span>
          <h1>{userName || "Uygulayıcı"}</h1>
          <p>Bugünkü modun {selectedShen.dailyName}. Gelişim kayıtların ve izinlerin burada.</p>
        </div>
      </div>
      <div className="glass-card profile-quick-settings">
        <div className="section-heading" style={{ margin: 0 }}>
          <div>
            <span className="eyebrow">Uygulama</span>
            <h2>Ses ve başlangıç rehberi</h2>
          </div>
        </div>
        <div className="profile-quick-actions">
          <button className={musicState === "açık" ? "profile-quick-action-active" : ""} onClick={onToggleMusic} type="button">
            <span aria-hidden="true">♪</span>
            <div>
              <strong>Müzik</strong>
              <small>{musicState === "açık" ? "Açık · kapatmak için dokun" : "Kapalı · açmak için dokun"}</small>
            </div>
            <b>{musicState === "açık" ? "Açık" : "Kapalı"}</b>
          </button>
          <button onClick={onRestartOnboarding} type="button">
            <span aria-hidden="true">?</span>
            <div>
              <strong>Başlangıç rehberi</strong>
              <small>Tanıtım ve ilk kurulum ekranlarını yeniden aç.</small>
            </div>
            <b>Aç</b>
          </button>
        </div>
      </div>
      <div className="glass-card profile-shen-settings">
        <div className="section-heading" style={{ margin: 0 }}>
          <div>
            <span className="eyebrow">5 Shen Profili</span>
            <h2>Günlük modunu seç</h2>
          </div>
          <span>{selectedShen.name}</span>
        </div>
        <p>Bu seçim uygulamanın atmosferini, önerilerini ve müzik dünyasını değiştirir.</p>
        <div className="profile-shen-grid">
          {fiveShen.map((shen) => (
            <button
              className={selectedShenId === shen.id ? "profile-shen-active" : ""}
              key={shen.id}
              onClick={() => onSelectShen(shen.id)}
              style={{ "--shen-card-accent": shen.color } as CSSProperties}
              type="button"
            >
              <span>{shen.symbol}</span>
              <strong>{shen.dailyName.replace(" Modu", "")}</strong>
              <small>{shen.name}</small>
            </button>
          ))}
        </div>
      </div>
      <PostureHistoryCard reports={postureReports} />
      <div className="profile-settings-list">
        <div className="list-item teacher-badge">
          <div className="list-icon">T</div>
          <div>
            <div className="item-title">Öğretmen Modu</div>
            <div className="item-subtitle">Videoları, ödevleri ve AI özetlerini paylaş.</div>
          </div>
        </div>
        <div className="list-item">
          <div className="list-icon">⌁</div>
          <div>
            <div className="item-title">Sağlık izinleri</div>
            <div className="item-subtitle">HRV, uyku ve toparlanma henüz bağlı değil.</div>
          </div>
        </div>
        <div className="list-item">
          <div className="list-icon">✦</div>
          <div>
            <div className="item-title">Premium yol</div>
            <div className="item-subtitle">Gelişmiş AI analizi ve hikaye bölümleri.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PostureHistoryCard({ reports }: { reports: PostureReport[] }) {
  const latestReport = reports[0];
  const previousReport = reports[1];

  return (
    <div className="glass-card profile-posture-card">
      <div className="section-heading" style={{ margin: "0 0 12px" }}>
        <div>
          <span className="eyebrow">Postür Geçmişi</span>
          <h2>{latestReport ? "Beden hattı takipte" : "İlk postür raporu bekleniyor"}</h2>
        </div>
        <span>{reports.length ? `${reports.length} kayıt` : "0 kayıt"}</span>
      </div>
      {latestReport ? (
        <>
          <div className="posture-history-hero">
            <div>
              <strong>{latestReport.score}</strong>
              <span>genel hizalanma</span>
            </div>
            <div>
              <span className="eyebrow">Son Sinyal</span>
              <p>{latestReport.asymmetrySignal} asimetri · {latestReport.trendText}</p>
              {previousReport ? <small>Önceki rapor: {previousReport.score}</small> : <small>İlk baz çizgin kaydedildi.</small>}
            </div>
          </div>
          <div className="posture-history-list">
            {reports.slice(0, 4).map((report) => (
              <article key={report.id}>
                <span>{report.dateKey}</span>
                <strong>{report.score}</strong>
                <small>{report.summary}</small>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-gallery">
          Pratik ekranından Postür Analizi başlatınca ön, yan ve arka kayıtlar burada tarihsel gelişim olarak saklanacak.
        </div>
      )}
    </div>
  );
}

const energyMetricLearning: Record<string, { summary: string; detail: string }> = {
  Jing: {
    summary: "Bedeninin temel kaynağı ve dayanıklılık rezervi.",
    detail: "Tai Chi dilinde Jing, aceleyle tüketilmeyen öz kaynak gibi düşünülür; dinlenme, köklenme ve düzenli pratikle korunur.",
  },
  Qi: {
    summary: "Nefesinle ve hareketinle dolaşan yaşam enerjisi.",
    detail: "Qi, Tai Chi’de beden, nefes ve niyetin birlikte akmasıdır; yumuşak ve kesintisiz hareket bu akışı destekler.",
  },
  Shen: {
    summary: "Farkındalığın, canlılığın ve iç açıklığın.",
    detail: "Shen, kalbin ve zihnin uyanık tarafıdır; sakin bakış, nefes ve çevrenle kurduğun temasla beslenir.",
  },
};

type EnergyMetricLabel = "Jing" | "Qi" | "Shen";

function Metric({
  isOpen,
  label,
  onToggle,
  value,
}: {
  isOpen: boolean;
  label: EnergyMetricLabel;
  onToggle: () => void;
  value: string;
}) {
  const learning = energyMetricLearning[label] ?? { summary: "Bugünkü iç ritminin bir göstergesi.", detail: "Düzenli pratikle bu değerin günlük ritmini birlikte izleyebilirsin." };

  return (
    <details className="metric-pill" open={isOpen}>
      <summary
        aria-expanded={isOpen}
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
      >
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
      </summary>
      {isOpen ? (
        <div className="metric-explanation">
          <strong>{learning.summary}</strong>
          <p>{learning.detail}</p>
        </div>
      ) : null}
    </details>
  );
}

function getShenById(id: ShenId): (typeof fiveShen)[number] {
  return fiveShen.find((shen) => shen.id === id) ?? fiveShen[1];
}

function getEnergyScores({
  completion,
  practiceGallery,
  postureReports,
  selectedShen,
}: {
  completion: number;
  practiceGallery: PracticeSnapshot[];
  postureReports: PostureReport[];
  selectedShen: (typeof fiveShen)[number];
}): EnergyScores {
  const latestPracticeAverage = practiceGallery.slice(0, 5).length
    ? practiceGallery.slice(0, 5).reduce((sum, snapshot) => sum + snapshot.score, 0) / practiceGallery.slice(0, 5).length
    : 62;
  const latestPostureScore = postureReports[0]?.score ?? 68;
  const practiceMemory = Math.min(12, practiceGallery.length * 1.4);
  const postureMemory = Math.min(10, postureReports.length * 2);

  return {
    jing: clampScore(54 + latestPostureScore * 0.26 + practiceMemory),
    qi: clampScore(42 + completion * 0.28 + latestPracticeAverage * 0.22 + postureMemory),
    shen: clampScore(selectedShen.value),
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

type ShenSoundLayer = {
  detune?: number;
  filter: number;
  filterType: BiquadFilterType;
  gain: number;
  pan: number;
  q: number;
  ratio: number;
  wave: OscillatorType;
};

type ShenSoundConfig = {
  layers: ShenSoundLayer[];
  noise: number;
  noiseFrequency: number;
  noiseQ: number;
  swellDepth: number;
  swellRate: number;
  volume: number;
};

function getShenSoundConfig(id: ShenId): ShenSoundConfig {
  const configs: Record<ShenId, ShenSoundConfig> = {
    hun: {
      volume: 0.72,
      swellRate: 0.055,
      swellDepth: 0.42,
      noise: 0.012,
      noiseFrequency: 1400,
      noiseQ: 0.9,
      layers: [
        { wave: "triangle", ratio: 1, detune: -5, gain: 0.12, filter: 1150, filterType: "lowpass", q: 0.72, pan: -0.38 },
        { wave: "sine", ratio: 1.25, detune: 7, gain: 0.08, filter: 1600, filterType: "lowpass", q: 0.6, pan: 0.34 },
        { wave: "sine", ratio: 2, gain: 0.05, filter: 2200, filterType: "bandpass", q: 1.1, pan: 0.12 },
      ],
    },
    shen: {
      volume: 0.68,
      swellRate: 0.038,
      swellDepth: 0.34,
      noise: 0.004,
      noiseFrequency: 900,
      noiseQ: 0.6,
      layers: [
        { wave: "sine", ratio: 1, gain: 0.12, filter: 950, filterType: "lowpass", q: 0.5, pan: -0.14 },
        { wave: "triangle", ratio: 1.5, detune: -4, gain: 0.08, filter: 1200, filterType: "lowpass", q: 0.58, pan: 0.22 },
        { wave: "sine", ratio: 2.5, gain: 0.04, filter: 1800, filterType: "bandpass", q: 0.85, pan: 0.04 },
      ],
    },
    yi: {
      volume: 0.74,
      swellRate: 0.13,
      swellDepth: 0.5,
      noise: 0.006,
      noiseFrequency: 420,
      noiseQ: 1.4,
      layers: [
        { wave: "triangle", ratio: 0.5, gain: 0.13, filter: 520, filterType: "lowpass", q: 1.1, pan: -0.06 },
        { wave: "sine", ratio: 1, gain: 0.09, filter: 850, filterType: "lowpass", q: 0.75, pan: 0.18 },
        { wave: "square", ratio: 1.333, gain: 0.026, filter: 620, filterType: "lowpass", q: 1.8, pan: -0.22 },
      ],
    },
    po: {
      volume: 0.66,
      swellRate: 0.028,
      swellDepth: 0.62,
      noise: 0.022,
      noiseFrequency: 1250,
      noiseQ: 0.45,
      layers: [
        { wave: "sine", ratio: 1, gain: 0.09, filter: 780, filterType: "lowpass", q: 0.42, pan: -0.2 },
        { wave: "sine", ratio: 1.2, detune: 9, gain: 0.07, filter: 1350, filterType: "bandpass", q: 0.74, pan: 0.28 },
        { wave: "triangle", ratio: 0.75, gain: 0.055, filter: 500, filterType: "lowpass", q: 0.6, pan: 0 },
      ],
    },
    zhi: {
      volume: 0.76,
      swellRate: 0.022,
      swellDepth: 0.28,
      noise: 0.018,
      noiseFrequency: 260,
      noiseQ: 0.8,
      layers: [
        { wave: "sine", ratio: 0.5, gain: 0.14, filter: 420, filterType: "lowpass", q: 0.9, pan: -0.12 },
        { wave: "triangle", ratio: 1, detune: -8, gain: 0.09, filter: 620, filterType: "lowpass", q: 0.72, pan: 0.24 },
        { wave: "sine", ratio: 1.5, gain: 0.04, filter: 360, filterType: "bandpass", q: 1.3, pan: 0.02 },
      ],
    },
  };

  return configs[id];
}

function createNoiseSource(context: AudioContext): AudioBufferSourceNode {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * 0.22;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function getTitle(tab: TabId): string {
  const titles: Record<TabId, string> = {
    home: "Bugün",
    practice: "Ritüel",
    posture: "Postür",
    journey: "Yolculuğum",
    learning: "Öğren",
    journal: "Günlük",
    profile: "Profil",
  };

  return titles[tab];
}

function getPracticeMessage(phase: "ready" | "calibrate" | "live" | "complete"): string {
  const messages = {
    ready: "Beden kadrajını hazırla.",
    calibrate: "Omuzlar ve dizler kalibre ediliyor.",
    live: "Canlı düzeltme seni dinliyor.",
    complete: "Pratik kapandı. Sırada günlük var.",
  };

  return messages[phase];
}

function getCameraStatus(
  status: "idle" | "requesting" | "ready" | "denied" | "unsupported",
  phase: "ready" | "calibrate" | "live" | "complete",
): string {
  if (status === "requesting") return "Kamera izni bekleniyor";
  if (status === "denied") return "Kamera izni verilmedi";
  if (status === "unsupported") return "Bu tarayıcı kamera desteklemiyor";
  if (status === "ready" && phase === "live") return "Canlı pratik aktif";
  if (status === "ready") return "Kamera açık, kalibrasyon hazır";
  return "Kamera kapalı";
}

async function createMoveNetDetector(): Promise<PoseDetector> {
  const { createPoseLandmarker } = await import("@/lib/pose/createPoseLandmarker");
  const landmarker = await createPoseLandmarker();
  let lastTimestamp = 0;

  return {
    dispose: () => undefined,
    estimatePoses: async (input) => {
      const timestamp = Math.max(performance.now(), lastTimestamp + 0.01);
      lastTimestamp = timestamp;
      const result = landmarker.detectForVideo(input, timestamp);
      const landmarks = result.landmarks[0];
      if (!landmarks?.length) return [];

      return [{
        keypoints: landmarks.map((landmark, index) => ({
          name: mediaPipePoseNames[index],
          score: landmark.visibility ?? 1,
          x: landmark.x * input.videoWidth,
          y: landmark.y * input.videoHeight,
        })),
      }];
    },
  };
}

function syncPoseCanvasSize(canvas: HTMLCanvasElement | null, video: HTMLVideoElement | null) {
  if (!canvas || !video || video.videoWidth === 0 || video.videoHeight === 0) return;

  if (canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth;
  }

  if (canvas.height !== video.videoHeight) {
    canvas.height = video.videoHeight;
  }
}

function drawPoseCanvas(canvas: HTMLCanvasElement | null, pose: Pose | undefined, accent: string, analysis?: PostureAnalysisSnapshot) {
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!pose?.keypoints?.length) return;

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = colorWithAlpha(accent, 0.34);
  context.shadowBlur = 12;
  drawPoseConnections(context, pose.keypoints, accent, analysis ? postureDisplayPoints : undefined);
  drawPoseKeypoints(context, pose.keypoints, accent, analysis ? postureDisplayPoints : undefined);
  if (analysis) drawPostureQualityKeypoints(context, pose.keypoints, analysis);
  context.restore();
}

function drawPoseConnections(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[], accent: string, visibleNames?:Set<string>) {
  context.strokeStyle = colorWithAlpha(accent, 0.86);
  context.lineWidth = 6;

  for (const [startName, endName] of poseConnections) {
    if(visibleNames&&(!visibleNames.has(startName)||!visibleNames.has(endName)))continue;
    const start = findVisiblePosePoint(keypoints, startName);
    const end = findVisiblePosePoint(keypoints, endName);

    if (!start || !end) continue;

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
}

function drawPoseKeypoints(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[], accent: string, visibleNames?:Set<string>) {
  for (const keypoint of keypoints) {
    if(visibleNames&&(!keypoint.name||!visibleNames.has(keypoint.name)))continue;
    if (!isVisiblePosePoint(keypoint)) continue;

    context.fillStyle = "rgba(255, 250, 240, 0.94)";
    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 9, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = accent;
    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 5.8, 0, Math.PI * 2);
    context.fill();
  }
}

function drawPostureQualityKeypoints(
  context: CanvasRenderingContext2D,
  keypoints: PoseKeypoint[],
  analysis: PostureAnalysisSnapshot,
) {
  const shoulderNames = new Set(["left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist"]);
  const hipNames = new Set(["left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"]);

  for (const keypoint of keypoints) {
    if (!keypoint.name || !postureDisplayPoints.has(keypoint.name) || !isVisiblePosePoint(keypoint)) continue;

    const score = shoulderNames.has(keypoint.name)
      ? analysis.shoulderScore
      : hipNames.has(keypoint.name)
        ? analysis.hipScore
        : analysis.axisScore;
    const color = score >= 80 ? "#6be66a" : score >= 62 ? "#ffc933" : "#ff6148";

    context.strokeStyle = color;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 12, 0, Math.PI * 2);
    context.stroke();
  }
}

function findVisiblePosePoint(keypoints: PoseKeypoint[], name: string): PoseKeypoint | undefined {
  const keypoint = keypoints.find((point) => point.name === name);
  return isVisiblePosePoint(keypoint) ? keypoint : undefined;
}

function isVisiblePosePoint(keypoint: PoseKeypoint | undefined): keypoint is PoseKeypoint {
  return Boolean(keypoint && (keypoint.score ?? 0) >= 0.35);
}

function colorWithAlpha(color: string, alpha: number) {
  if (!color.startsWith("#") || color.length !== 7) return `rgba(140, 207, 178, ${alpha})`;

  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}


type LiveMovementMatch = {
  total: number;
  form: number;
  rhythm: number;
  balance: number;
  feedback: string;
};

function scoreLiveMovementMatch(
  keypoints: PoseKeypoint[],
  previous: { keypoints: PoseKeypoint[]; at: number } | null,
  target: number | WarmupLessonId,
): LiveMovementMatch {
  const byName = new Map(keypoints.map((point) => [point.name, point]));
  const visibleNames = [
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle",
  ];
  const visibleCount = visibleNames.filter((name) => (byName.get(name)?.score ?? 0) >= 0.35).length;
  if (visibleCount < 8) {
    return { total: 24, form: 20, rhythm: 30, balance: 22, feedback: "Biraz geriye geç; başın, ellerin ve ayakların kadrajda olsun." };
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
  const form = Math.round(Math.max(20, Math.min(100, 100 - spreadError * 28 - heightError * 34)));

  const shoulderBalance = getPairBalanceScore(leftShoulder, rightShoulder, 50);
  const hipBalance = getPairBalanceScore(leftHip, rightHip, 40);
  const center = getCenteringScore(byName) * 1.4;
  const balance = Math.round(Math.max(25, Math.min(100, shoulderBalance + hipBalance + center)));

  let rhythm = 72;
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
    rhythm = Math.round(Math.max(25, Math.min(100, 100 - Math.abs(motion - 0.035) * 950)));
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

function scorePose(keypoints: PoseKeypoint[], movementId: number): number {
  const importantNames = [
    "nose",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
  ];
  const byName = new Map(keypoints.map((keypoint) => [keypoint.name, keypoint]));
  const visible = importantNames.filter((name) => (byName.get(name)?.score ?? 0) > 0.35);
  const visibilityScore = (visible.length / importantNames.length) * 42;
  const shoulderBalance = getPairBalanceScore(byName.get("left_shoulder"), byName.get("right_shoulder"), 16);
  const hipBalance = getPairBalanceScore(byName.get("left_hip"), byName.get("right_hip"), 18);
  const centerScore = getCenteringScore(byName);
  const fullBodyBonus = ["left_ankle", "right_ankle", "left_knee", "right_knee"].every((name) => (byName.get(name)?.score ?? 0) > 0.32)
    ? 12
    : 0;
  const movementBias = movementId === 3 ? 6 : movementId === 5 ? 4 : 2;

  return Math.max(8, Math.min(96, Math.round(visibilityScore + shoulderBalance + hipBalance + centerScore + fullBodyBonus + movementBias)));
}

function scoreWarmupPose(keypoints: PoseKeypoint[], lessonId: WarmupLessonId): number {
  const byName = new Map(keypoints.map((keypoint) => [keypoint.name, keypoint]));
  const baseScore = scorePose(keypoints, lessonId === "wuji" ? 1 : lessonId === "warmup" ? 3 : 4);
  const leftWrist = byName.get("left_wrist");
  const rightWrist = byName.get("right_wrist");
  const leftHip = byName.get("left_hip");
  const rightHip = byName.get("right_hip");
  const leftKnee = byName.get("left_knee");
  const rightKnee = byName.get("right_knee");

  if (lessonId === "wuji") {
    const axisBonus = getPairBalanceScore(byName.get("left_shoulder"), byName.get("right_shoulder"), 8)
      + getPairBalanceScore(leftHip, rightHip, 8);
    return Math.max(12, Math.min(98, Math.round(baseScore * 0.84 + axisBonus)));
  }

  if (lessonId === "warmup") {
    const wristsVisible = isVisiblePosePoint(leftWrist) && isVisiblePosePoint(rightWrist);
    const mobilityBonus = wristsVisible ? Math.min(12, Math.abs(leftWrist.x - rightWrist.x) / 38) : 0;
    return Math.max(12, Math.min(98, Math.round(baseScore * 0.9 + mobilityBonus)));
  }

  const lowerBodyVisible = [leftHip, rightHip, leftKnee, rightKnee].filter(isVisiblePosePoint).length;
  const kuaBonus = lowerBodyVisible * 2.5;
  return Math.max(12, Math.min(98, Math.round(baseScore * 0.9 + kuaBonus)));
}

function getMovementBreathCue(movementId: number): string {
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

function getPairBalanceScore(left?: PoseKeypoint, right?: PoseKeypoint, maxScore = 16): number {
  if (!left || !right || (left.score ?? 0) < 0.3 || (right.score ?? 0) < 0.3) return 0;

  const verticalDifference = Math.abs(left.y - right.y);
  return Math.max(0, maxScore - verticalDifference / 5);
}

function getCenteringScore(keypoints: Map<string | undefined, PoseKeypoint>): number {
  const shoulders = [keypoints.get("left_shoulder"), keypoints.get("right_shoulder")].filter(Boolean) as PoseKeypoint[];
  const hips = [keypoints.get("left_hip"), keypoints.get("right_hip")].filter(Boolean) as PoseKeypoint[];
  const points = [...shoulders, ...hips].filter((point) => (point.score ?? 0) > 0.3);

  if (!points.length) return 0;

  const centerX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const idealCenter = 360;
  const distance = Math.abs(centerX - idealCenter);
  return Math.max(0, 14 - distance / 22);
}

function createPracticeSnapshot(
  video: HTMLVideoElement | null,
  movement: Movement,
  score: number,
  shenName: string,
): PracticeSnapshot | null {
  if (!video || video.readyState < 2) return null;

  const width = video.videoWidth || 720;
  const height = video.videoHeight || 1280;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(video, 0, 0, width, height);
  const now = new Date();
  const dateKey = formatSnapshotDate(now);
  const timeLabel = formatSnapshotTime(now);

  const overlayHeight = Math.max(118, height * 0.16);
  const gradient = context.createLinearGradient(0, height - overlayHeight, 0, height);
  gradient.addColorStop(0, "rgba(5, 12, 10, 0)");
  gradient.addColorStop(1, "rgba(5, 12, 10, 0.86)");
  context.fillStyle = gradient;
  context.fillRect(0, height - overlayHeight, width, overlayHeight);

  const pad = Math.max(28, width * 0.045);
  context.fillStyle = "rgba(246, 239, 228, 0.96)";
  context.font = `700 ${Math.max(24, width * 0.045)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText(movement.name, pad, height - overlayHeight + pad + 12);
  context.font = `600 ${Math.max(17, width * 0.028)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText(`${dateKey} • ${timeLabel} • ${shenName}`, pad, height - pad - 28);

  const badgeWidth = Math.max(110, width * 0.18);
  const badgeHeight = Math.max(52, height * 0.05);
  context.fillStyle = "rgba(140, 207, 178, 0.92)";
  context.roundRect(width - pad - badgeWidth, height - pad - badgeHeight, badgeWidth, badgeHeight, 22);
  context.fill();
  context.fillStyle = "rgba(5, 12, 10, 0.92)";
  context.font = `800 ${Math.max(22, width * 0.036)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText(`%${score}`, width - pad - badgeWidth + 22, height - pad - 17);

  return {
    id: `${movement.id}-${now.getTime()}`,
    createdAt: now.toISOString(),
    dateKey,
    imageData: canvas.toDataURL("image/jpeg", 0.86),
    movementId: movement.id,
    movementName: movement.name,
    score,
    shenName,
    timeLabel,
  };
}

function toPostureAnalysisSnapshot(analysis: ReturnType<typeof analyzePosture>): PostureAnalysisSnapshot {
  return {
    axisScore: analysis.axisScore,
    feedback: analysis.feedback,
    flags: analysis.flags,
    hipScore: analysis.hipScore,
    hipTilt: analysis.hipTilt,
    shoulderScore: analysis.shoulderScore,
    shoulderTilt: analysis.shoulderTilt,
    spineShift: analysis.spineShift,
  };
}

function createPostureCapture(
  video: HTMLVideoElement | null,
  keypoints: PoseKeypoint[],
  view: PostureView,
  analysis: PostureAnalysisSnapshot,
  accent: string,
): PostureAssessmentCapture | null {
  if (!video || video.readyState < 2) return null;

  const width = video.videoWidth || 720;
  const height = video.videoHeight || 1280;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.save();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, width, height);
  context.restore();

  const mirroredKeypoints = keypoints.map((keypoint) => ({
    ...keypoint,
    x: width - keypoint.x,
  }));

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = colorWithAlpha(accent, 0.38);
  context.shadowBlur = 14;
  drawPoseConnections(context, mirroredKeypoints, accent);
  drawPoseKeypoints(context, mirroredKeypoints, accent);
  drawPostureQualityKeypoints(context, mirroredKeypoints, analysis);
  context.restore();

  const viewLabel = view === "front" ? "Ön" : view === "side" ? "Yan" : "Arka";
  const overlayHeight = Math.max(128, height * 0.17);
  const gradient = context.createLinearGradient(0, height - overlayHeight, 0, height);
  gradient.addColorStop(0, "rgba(5, 12, 10, 0)");
  gradient.addColorStop(1, "rgba(5, 12, 10, 0.88)");
  context.fillStyle = gradient;
  context.fillRect(0, height - overlayHeight, width, overlayHeight);

  const pad = Math.max(28, width * 0.045);
  context.fillStyle = "rgba(246, 239, 228, 0.96)";
  context.font = `800 ${Math.max(24, width * 0.044)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText(`${viewLabel} Postür`, pad, height - overlayHeight + pad + 14);
  context.font = `650 ${Math.max(17, width * 0.028)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText(`Hizalanma ${analysis.axisScore} • Omuz ${analysis.shoulderScore} • Kalça ${analysis.hipScore}`, pad, height - pad - 26);

  return {
    analysis,
    createdAt: new Date().toISOString(),
    imageData: canvas.toDataURL("image/jpeg", 0.84),
    view,
  };
}

function getPoseStabilityDistance(previous: PoseKeypoint[], current: PoseKeypoint[]): number {
  const trackedNames = [
    "nose",
    "left_shoulder",
    "right_shoulder",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
  ];
  const previousByName = new Map(previous.map((point) => [point.name, point]));
  const distances = current.flatMap((point) => {
    if (!point.name || !trackedNames.includes(point.name) || (point.score ?? 0) < 0.35) return [];
    const before = previousByName.get(point.name);
    if (!before || (before.score ?? 0) < 0.35) return [];
    return [Math.hypot(point.x - before.x, point.y - before.y)];
  });
  if (distances.length < 6) return Number.POSITIVE_INFINITY;
  return distances.reduce((sum, distance) => sum + distance, 0) / distances.length;
}

function buildPostureReport(captures: Record<PostureView, PostureAssessmentCapture>, previous?: PostureReport): PostureReport {
  const analyses = [captures.front.analysis, captures.side.analysis, captures.back.analysis];
  const score = Math.round(
    analyses.reduce((sum, analysis) => sum + analysis.axisScore + analysis.shoulderScore + analysis.hipScore, 0) / (analyses.length * 3),
  );
  const strongestSignal = Math.max(
    ...analyses.flatMap((analysis) => [Math.abs(analysis.shoulderTilt), Math.abs(analysis.hipTilt), Math.abs(analysis.spineShift)]),
  );
  const asymmetrySignal: PostureReport["asymmetrySignal"] =
    strongestSignal > 15 || score < 62 ? "yüksek" : strongestSignal > 8 || score < 78 ? "orta" : "düşük";
  const flags = Array.from(new Set(analyses.flatMap((analysis) => analysis.flags))).slice(0, 6);
  const now = new Date();
  const trendDelta = previous ? score - previous.score : 0;
  const trendText = previous
    ? trendDelta > 2
      ? `${trendDelta} puan iyileşme`
      : trendDelta < -2
        ? `${Math.abs(trendDelta)} puan gerileme sinyali`
        : "önceki rapora yakın"
    : "baz çizgi oluşturuldu";
  const summary =
    asymmetrySignal === "yüksek"
      ? "Omuz, kalça veya merkez hattında belirgin asimetri sinyali var. Ağrı ya da şüphe varsa profesyonel değerlendirme önerilir."
      : asymmetrySignal === "orta"
        ? "Bazı açılarda takip edilmesi gereken postür asimetrisi görünüyor. Düzenli tekrar ile trendi izle."
        : "Postür hattı sakin görünüyor. Bu rapor ilerideki iyileşme kıyası için baz olarak saklanabilir.";

  return {
    asymmetrySignal,
    captures,
    createdAt: now.toISOString(),
    dateKey: formatSnapshotDate(now),
    flags,
    id: `posture-${now.getTime()}`,
    score,
    summary,
    timeLabel: formatSnapshotTime(now),
    trendText,
  };
}

const postureReportDatabaseName = "ritim-kapisi-posture-library";
const postureReportStoreName = "reports";

async function sharePostureReport(report: PostureReport): Promise<string | null> {
  try {
    const file = await createPostureShareFile(report);
    const shareData = {
      files: [file],
      text: `${report.dateKey} postür analizi • Genel skor ${report.score}/100`,
      title: "Ritim Kapısı Postür Analizi",
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
      return "Paylaşım menüsü açıldı.";
    }

    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `postur-analizi-${report.createdAt.slice(0, 10)}.jpg`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    return "Sosyal paylaşım görseli indirildi.";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return null;
    return "Paylaşım hazırlanamadı. Tekrar deneyebilirsin.";
  }
}

async function createPostureShareFile(report: PostureReport): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Paylaşım görseli oluşturulamadı");

  const gradient = context.createLinearGradient(0, 0, 1200, 1200);
  gradient.addColorStop(0, "#07130f");
  gradient.addColorStop(1, "#17221c");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 1200);

  const views = await Promise.all(
    (["front", "side", "back"] as const).map((view) => loadPostureShareImage(report.captures[view].imageData)),
  );
  views.forEach((image, index) => {
    const x = 48 + index * 368;
    drawPostureShareCover(context, image, x, 54, 352, 720);
    context.fillStyle = "rgba(5, 12, 10, 0.76)";
    context.fillRect(x, 714, 352, 60);
    context.fillStyle = "#f7f0e4";
    context.font = "800 26px system-ui, sans-serif";
    context.fillText(index === 0 ? "Ön" : index === 1 ? "Yan" : "Arka", x + 20, 753);
  });

  context.fillStyle = "#d9b866";
  context.font = "800 24px system-ui, sans-serif";
  context.fillText("RİTİM KAPISI • POSTÜR ANALİZİ", 52, 840);
  context.fillStyle = "#f7f0e4";
  context.font = "900 84px system-ui, sans-serif";
  context.fillText(`${report.score}`, 50, 946);
  context.font = "750 30px system-ui, sans-serif";
  context.fillText("/100 GENEL SKOR", 190, 944);
  context.fillStyle = "rgba(247, 240, 228, 0.72)";
  context.font = "700 25px system-ui, sans-serif";
  context.fillText(`${report.dateKey} • ${report.timeLabel}`, 52, 1004);
  drawPostureShareText(context, report.summary, 52, 1060, 1088, 32);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Görsel hazırlanamadı")), "image/jpeg", 0.9);
  });
  return new File([blob], `postur-analizi-${report.createdAt.slice(0, 10)}.jpg`, { type: "image/jpeg" });
}

function loadPostureShareImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Kayıt görseli açılamadı"));
    image.src = src;
  });
}

function drawPostureShareCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawPostureShareText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let lineIndex = 0;
  for (const word of words) {
    const candidate = `${line}${word} `;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line.trim(), x, y + lineIndex * lineHeight);
      line = `${word} `;
      lineIndex += 1;
      if (lineIndex >= 2) break;
    } else {
      line = candidate;
    }
  }
  if (lineIndex < 2 && line) context.fillText(line.trim(), x, y + lineIndex * lineHeight);
}

function openPostureReportDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB desteklenmiyor"));
      return;
    }

    const request = window.indexedDB.open(postureReportDatabaseName, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(postureReportStoreName)) {
        database.createObjectStore(postureReportStoreName, { keyPath: "id" });
      }
    };
  });
}

async function savePostureReportToIndexedDb(report: PostureReport) {
  try {
    const database = await openPostureReportDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(postureReportStoreName, "readwrite");
      transaction.objectStore(postureReportStoreName).put(report);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // Local storage remains as a lightweight fallback when IndexedDB is unavailable.
  }
}

async function deletePostureReportFromIndexedDb(reportId: string) {
  try {
    const database = await openPostureReportDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(postureReportStoreName, "readwrite");
      transaction.objectStore(postureReportStoreName).delete(reportId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // The in-memory list is still updated when persistent storage is unavailable.
  }
}

async function loadPostureReportsFromIndexedDb(): Promise<PostureReport[]> {
  try {
    const database = await openPostureReportDatabase();
    const reports = await new Promise<PostureReport[]>((resolve, reject) => {
      const request = database.transaction(postureReportStoreName, "readonly").objectStore(postureReportStoreName).getAll();
      request.onsuccess = () => resolve(request.result as PostureReport[]);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return reports.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

function mergePostureReports(...collections: PostureReport[][]): PostureReport[] {
  const reports = new Map<string, PostureReport>();
  collections.flat().forEach((report) => reports.set(report.id, report));
  return Array.from(reports.values())
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 18);
}

function persistPostureReportsToLocalStorage(reports: PostureReport[]) {
  try {
    window.localStorage.setItem("ritim-kapisi-posture-reports", JSON.stringify(reports.slice(0, 18)));
  } catch {
    try {
      window.localStorage.setItem("ritim-kapisi-posture-reports", JSON.stringify(reports.slice(0, 4)));
    } catch {
      // IndexedDB is the primary store for image-heavy posture reports.
    }
  }
}

function groupSnapshotsByDate(gallery: PracticeSnapshot[]): [string, PracticeSnapshot[]][] {
  const groups = new Map<string, PracticeSnapshot[]>();

  gallery.forEach((snapshot) => {
    const snapshots = groups.get(snapshot.dateKey) ?? [];
    snapshots.push(snapshot);
    groups.set(snapshot.dateKey, snapshots);
  });

  return Array.from(groups.entries());
}

function formatSnapshotDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatSnapshotTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPoseStatusText(status: "bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata"): string {
  const labels = {
    bekliyor: "MoveNet bekliyor",
    yükleniyor: "MoveNet yükleniyor",
    aktif: "MoveNet aktif",
    "beden-yok": "Beden kadrajda değil",
    hata: "MoveNet başlatılamadı",
  };

  return labels[status];
}

function speakCoach(text: string, voiceProfile?: Pick<AiCoach, "pitch" | "rate">, retryIfVoicesLoad = true) {
  if (!("speechSynthesis" in window)) return;

  const currentVoices = window.speechSynthesis.getVoices();
  if (!currentVoices.length && retryIfVoicesLoad) {
    window.setTimeout(() => speakCoach(text, voiceProfile, false), 320);
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  const utterance = new SpeechSynthesisUtterance(text);
  const preferredVoice = getBestCoachVoice();

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.lang = preferredVoice?.lang ?? "tr-TR";
  utterance.pitch = voiceProfile?.pitch ?? 1.02;
  utterance.rate = voiceProfile?.rate ?? (preferredVoice?.lang.toLocaleLowerCase("tr-TR").startsWith("tr") ? 0.94 : 0.88);
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function styleCoachCue(text: string, coach: AiCoach): string {
  const normalized = text.trim();
  const lead = coach.styleLead.trim();
  const close = coach.styleClose.trim();
  const withLead = normalized.startsWith(lead) ? normalized : `${lead} ${normalized}`;

  return withLead.endsWith(close) ? withLead : `${withLead} ${close}`;
}

function getCoachSilenceMs(coach: AiCoach, name: CoachCueName): number {
  const cuePause = name === "ok" ? 2400 : name === "start" || name === "calibration" ? 1800 : 900;

  return Math.max(5600, Math.round(coach.cadenceMs * 0.45) + cuePause);
}

function speakCoachCue(text: string, coach: AiCoach): Promise<void> {
  if (!("speechSynthesis" in window)) return Promise.resolve();

  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      window.setTimeout(() => {
        void speakCoachCue(text, coach).then(resolve);
      }, 320);
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const utterance = new SpeechSynthesisUtterance(text);
    const preferredVoice = getBestCoachVoice();

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.lang = preferredVoice?.lang ?? "tr-TR";
    utterance.pitch = coach.pitch;
    utterance.rate = coach.rate;
    utterance.volume = 1;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
    window.setTimeout(finish, Math.min(12000, Math.max(4200, text.length * 95)));
  });
}

function getBestCoachVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();

  return voices
    .map((voice) => ({ score: scoreCoachVoice(voice), voice }))
    .sort((first, second) => second.score - first.score)[0]?.voice;
}

function scoreCoachVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLocaleLowerCase("tr-TR");
  const lang = voice.lang.toLocaleLowerCase("tr-TR");
  let score = 0;

  if (lang.startsWith("tr")) score += 120;
  if (voice.localService) score += 18;
  if (/google|microsoft|apple|siri|enhanced|premium|natural|neural|online/.test(name)) score += 35;
  if (/yelda|eda|seda|zeynep|filiz|emel|ayşe|female|woman|samantha|victoria|zira|susan|aria|jenny/.test(name)) score += 28;
  if (/compact|low quality|robot|espeak|basic/.test(name)) score -= 45;
  if (!lang.startsWith("tr") && /en-us|en-gb/.test(lang)) score += 8;

  return score;
}
