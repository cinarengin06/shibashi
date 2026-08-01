import type { LivingMovementStep, LivingPosePoint, LivingPractice, LivingScene, LivingSceneId } from "./types";

export const livingScenes: readonly LivingScene[] = [
  { id: "bedroom", name: "Yeni Gün", subtitle: "Uyanış", description: "Yatağın sıcaklığından çıkmadan önce bedene genişleyecek sakin bir alan aç.", previewAssetKey: "living-bedroom", movementId: "raise-quilt", metaphor: "Yorganı üzerinden kaldır", shenId: "po", soundAtmosphereId: "bedroom-dawn", light: "Perdeden süzülen gün ışığı", tempo: "Yavaş · 4/6 nefes", teacherTone: "Yumuşak ve güven veren", movementQuality: "Nazik yükseliş", available: true },
  { id: "lake", name: "Gölde Yolculuk", subtitle: "Akış", description: "Suyun direncini kollarında hisset; küreği çekerken gövden de harekete katılsın.", previewAssetKey: "living-lake", movementId: "row-lake", metaphor: "Salın üzerinde kürek çek", shenId: "zhi", soundAtmosphereId: "lake-mist", light: "Sisli göl sabahı", tempo: "Derin · kesintisiz", teacherTone: "Az konuşan ve sakin", movementQuality: "Akışkan çekiş", available: true },
  { id: "curtains", name: "Işığa Açıl", subtitle: "Genişleme", description: "Perdeleri iki yana açar gibi göğsünü ferahlat, omuzlarında sabah için yer aç.", previewAssetKey: "living-curtains", movementId: "open-curtains", metaphor: "Perdeleri iki yana aç", shenId: "hun", soundAtmosphereId: "curtain-breeze", light: "Altın sabah penceresi", tempo: "Geniş · ferah", teacherTone: "Umut veren ve açık", movementQuality: "Göğsü açma", available: true },
  { id: "garden", name: "Bahçede Gökkuşağı", subtitle: "Canlılık", description: "Sulama hareketinin yayını izle; kolun gökyüzünde yumuşak bir gökkuşağı çizsin.", previewAssetKey: "living-garden", movementId: "paint-rainbow", metaphor: "Gökyüzüne bir yay çiz", shenId: "shen", soundAtmosphereId: "garden-water", light: "Yağmur sonrası gün ışığı", tempo: "Canlı · yuvarlak", teacherTone: "Sıcak ve neşeli", movementQuality: "Dairesel uzanış", available: true },
  { id: "pottery", name: "Çamura Şekil Ver", subtitle: "Merkez", description: "Çamuru zorlamadan yönlendir; iki el arasındaki görünmez küreyi sakinlikle taşı.", previewAssetKey: "living-pottery", movementId: "cloud-hands", metaphor: "İki elinle çamura yön ver", shenId: "yi", soundAtmosphereId: "pottery-room", light: "Toprak ve pencere ışığı", tempo: "Ölçülü · merkezde", teacherTone: "Net ve odaklı", movementQuality: "Bulut eller", available: true },
  { id: "gate", name: "Bahçe Kapısı", subtitle: "Niyet", description: "Ağır kapıyı kollarınla değil merkezinden gelen sakin bir kararlılıkla aç.", previewAssetKey: "living-gate", movementId: "open-gate", metaphor: "Ahşap kapıyı iki elle aç", shenId: "po", soundAtmosphereId: "garden-gate", light: "Serin sabah gölgesi", tempo: "Kararlı · dengeli", teacherTone: "Topraklı ve sade", movementQuality: "İki elle itiş", available: true },
] as const;

const step = (id: LivingMovementStep["id"], title: string, instruction: string, breathingCue: string, startMs: number, endMs: number, referencePoseId: string): LivingMovementStep => ({ id, title, instruction, breathingCue, startMs, endMs, referencePoseId });

function makeSteps(copy: readonly [string, string, string][]): readonly LivingMovementStep[] {
  const timing: Array<[LivingMovementStep["id"], number, number, string]> = [
    ["prepare", 0, 5000, "push-prepare"], ["lift", 5000, 10500, "push-lift"], ["push", 10500, 17000, "push-forward"], ["extend", 17000, 22500, "push-extend"], ["release", 22500, 28000, "push-release"],
  ];
  return timing.map(([id, start, end, poseId], index) => step(id, copy[index][0], copy[index][1], copy[index][2], start, end, poseId));
}

const practices: Record<LivingSceneId, LivingPractice> = {
  bedroom: { id: "living-bedroom-raise-quilt", title: "Yorganı Kaldır", movementId: "raise-quilt", movementNumber: 1, sceneId: "bedroom", durationMs: 28000, difficulty: "easy", supportedViews: ["front"], steps: makeSteps([
    ["Uyan", "Avuçlarını yorganın altına yerleştir, omuzlarını bırak.", "Sessizce nefes al."], ["Kaldır", "Yorganı iki elinle göğsünün üzerinden kaldır.", "Nefes alırken kolların yükselsin."], ["Aç", "Ellerini ileri ve hafifçe iki yana gönder.", "Nefes verirken önünde alan aç."], ["Uzan", "Dirsekleri kilitlemeden sabaha doğru uzan.", "Nefesin sonuna kadar yumuşak kal."], ["Bırak", "Kollarını bedeninin yanına geri getir.", "Omuzlarını ve çeneni serbest bırak."],
  ]) },
  lake: { id: "living-lake-row", title: "Gölde Kürek Çek", movementId: "row-lake", movementNumber: 2, sceneId: "lake", durationMs: 28000, difficulty: "easy", supportedViews: ["front"], steps: makeSteps([
    ["Yerleş", "Ayaklarını yere bas, iki elinle görünmez küreği tut.", "Nefesini su gibi sakinleştir."], ["Uzan", "Küreği suya bırakır gibi kollarını ileri gönder.", "Nefes alırken gövden uzasın."], ["Çek", "Dirseklerini geriye al, küreği kendine doğru çek.", "Nefes verirken suyu geriye taşı."], ["Akıt", "Gövdenin küçük dönüşüyle hareketi tamamla.", "Nefesi kesmeden akışı sürdür."], ["Dön", "Ellerini yeniden öne getir ve merkeze yerleş.", "Bir sonraki dalga için yumuşa."],
  ]) },
  curtains: { id: "living-curtains-open", title: "Perdeleri Aç", movementId: "open-curtains", movementNumber: 3, sceneId: "curtains", durationMs: 28000, difficulty: "easy", supportedViews: ["front"], steps: makeSteps([
    ["Merkez", "Ellerini göğüs önünde sakinçe buluştur.", "Işığı içine alır gibi nefes al."], ["Yüksel", "Ellerini pencerenin ortasına doğru kaldır.", "Göğsünde alan aç."], ["Aç", "Kollarını perdeleri ayırır gibi iki yana gönder.", "Nefes verirken omuzların yumuşasın."], ["Genişle", "Avuçların dışarı bakarken göğsünü nazikçe aç.", "Ufka doğru ferahla."], ["Topla", "Kollarını yavaşça merkeze geri getir.", "Açtığın alanı içinde koru."],
  ]) },
  garden: { id: "living-garden-rainbow", title: "Gökkuşağını Boya", movementId: "paint-rainbow", movementNumber: 4, sceneId: "garden", durationMs: 28000, difficulty: "easy", supportedViews: ["front"], steps: makeSteps([
    ["Köklen", "Bir elin bel hizasında, diğer elin yanında hazır olsun.", "Ayaklarının toprağını hisset."], ["Yüksel", "Öndeki elini geniş bir yayın başlangıcına kaldır.", "Nefes alırken kolun hafiflesin."], ["Çiz", "Elinle başının üzerinden yumuşak bir yay çiz.", "Nefes verirken gökyüzünü boya."], ["Uzan", "Yayı karşı tarafa kadar kesintisiz tamamla.", "Gözlerin elinin yolunu izlesin."], ["Dinlen", "Elini indir, ağırlığını yeniden ortaya al.", "Bahçenin sesini bir nefes dinle."],
  ]) },
  pottery: { id: "living-pottery-cloud-hands", title: "Bulut Eller", movementId: "cloud-hands", movementNumber: 5, sceneId: "pottery", durationMs: 28000, difficulty: "easy", supportedViews: ["front"], steps: makeSteps([
    ["Küreyi Bul", "Ellerinin arasında yumuşak bir çamur küresi hayal et.", "Nefesinle merkeze gel."], ["Taşı", "Üstteki eli yana, alttaki eli merkeze taşı.", "Nefes alırken belin dönsün."], ["Değiştir", "Ellerin yer değiştirirken görünmez küreyi koru.", "Nefes verirken ağırlığını aktar."], ["Şekil Ver", "Dönüşü diğer tarafa sakinçe tamamla.", "Eller değil, merkez yön versin."], ["Durgunlaş", "Ellerini karnının önünde dinlendir.", "Çamurun sessizliğini hisset."],
  ]) },
  gate: { id: "living-gate-open", title: "Bahçe Kapısını Aç", movementId: "open-gate", movementNumber: 6, sceneId: "gate", durationMs: 28000, difficulty: "easy", supportedViews: ["front"], steps: makeSteps([
    ["Yaklaş", "Ayaklarını omuz genişliğinde yerleştir, avuçlarını öne çevir.", "Niyetini sadeleştir."], ["Temas", "Ellerini kapının yüzeyine değdirir gibi kaldır.", "Nefes alırken merkezini bul."], ["İt", "Ağırlığını öne taşırken iki avucunu birlikte gönder.", "Nefes verirken kapıyı aç."], ["Geçit", "Dirsekleri kilitlemeden hareketin sonuna ulaş.", "Gücünü yumuşak tut."], ["Geri Dön", "Ağırlığını merkeze al, ellerini yavaşça indir.", "Açılan yolda bir nefes bekle."],
  ]) },
};

export const bedroomPushPractice = practices.bedroom;
export const livingPractices: readonly LivingPractice[] = livingScenes.map((scene) => practices[scene.id]);
export function getLivingPractice(sceneId: LivingSceneId): LivingPractice { return practices[sceneId] ?? practices.bedroom; }

const pose = (values: Array<[string, number, number]>): readonly LivingPosePoint[] => values.map(([name, x, y]) => ({ name, x, y, score: 1 }));
export const livingReferencePoses: Readonly<Record<string, readonly LivingPosePoint[]>> = {
  "push-prepare": pose([["left_shoulder",.42,.29],["right_shoulder",.58,.29],["left_elbow",.43,.43],["right_elbow",.57,.43],["left_wrist",.46,.55],["right_wrist",.54,.55],["left_hip",.45,.56],["right_hip",.55,.56],["left_knee",.44,.76],["right_knee",.56,.76],["left_ankle",.43,.94],["right_ankle",.57,.94]]),
  "push-lift": pose([["left_shoulder",.42,.29],["right_shoulder",.58,.29],["left_elbow",.39,.40],["right_elbow",.61,.40],["left_wrist",.43,.37],["right_wrist",.57,.37],["left_hip",.45,.56],["right_hip",.55,.56],["left_knee",.44,.76],["right_knee",.56,.76],["left_ankle",.43,.94],["right_ankle",.57,.94]]),
  "push-forward": pose([["left_shoulder",.42,.29],["right_shoulder",.58,.29],["left_elbow",.38,.36],["right_elbow",.62,.36],["left_wrist",.40,.32],["right_wrist",.60,.32],["left_hip",.46,.56],["right_hip",.56,.56],["left_knee",.43,.75],["right_knee",.57,.77],["left_ankle",.42,.94],["right_ankle",.58,.94]]),
  "push-extend": pose([["left_shoulder",.42,.29],["right_shoulder",.58,.29],["left_elbow",.35,.33],["right_elbow",.65,.33],["left_wrist",.34,.31],["right_wrist",.66,.31],["left_hip",.46,.56],["right_hip",.56,.56],["left_knee",.43,.75],["right_knee",.57,.77],["left_ankle",.42,.94],["right_ankle",.58,.94]]),
  "push-release": pose([["left_shoulder",.42,.29],["right_shoulder",.58,.29],["left_elbow",.42,.44],["right_elbow",.58,.44],["left_wrist",.45,.57],["right_wrist",.55,.57],["left_hip",.45,.56],["right_hip",.55,.56],["left_knee",.44,.76],["right_knee",.56,.76],["left_ankle",.43,.94],["right_ankle",.57,.94]]),
};

export function livingStepAt(elapsedMs: number, practice: LivingPractice = bedroomPushPractice): LivingMovementStep {
  const normalized = Math.max(0, Math.min(practice.durationMs - 1, elapsedMs));
  return practice.steps.find((item) => normalized >= item.startMs && normalized < item.endMs) ?? practice.steps[0];
}
