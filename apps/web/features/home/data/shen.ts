import { shenThemes } from "@/packages/design-tokens";
import { fiveShenContent } from "@/packages/five-shen-content";

export type ShenId = "hun" | "shen" | "yi" | "po" | "zhi";

export const fiveShen = [
  {
    id: "hun",
    name: "Hun",
    label: fiveShenContent.hun.familiarName,
    value: 64,
    note: "Bugün geniş bakış açık.",
    organ: "Karaciğer",
    map: "Gözler, yan beden ve yön duygusu",
    point: { x: 41, y: 49 },
    color: shenThemes.hun.primary,
    color2: shenThemes.hun.dark,
    image: "/images/shen-home/hun-web.webp",
    music: "/videos/shen-music-hun.mp4",
    tone: 196,
    hero: fiveShenContent.hun.balancedExpression,
    dailyName: fiveShenContent.hun.familiarName,
    dailyPrompt: fiveShenContent.hun.dailyPrompt,
    recommendation: fiveShenContent.hun.overview,
    bagua: "Zhen",
    baguaText: "Ağaç • Şimşek • Başlatma",
    task: fiveShenContent.hun.practiceCue,
    mapStage: 4,
    mapTitle: "Hun Ormanı",
    world: "Gün doğumu, rüzgâr, açık ufuk ve büyüyen yeşil",
    essence: fiveShenContent.hun.shortMeaning,
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
    label: fiveShenContent.shen.familiarName,
    value: 48,
    note: "Sakinleşmeye alan aç.",
    organ: "Kalp",
    map: "Göğüs merkezi, bakış ve temas",
    point: { x: 50, y: 38 },
    color: shenThemes.shen.primary,
    color2: shenThemes.shen.dark,
    image: "/images/shen-home/shen-fire-web.webp",
    music: "/videos/shen-music-shen.mp4",
    tone: 256,
    hero: fiveShenContent.shen.balancedExpression,
    dailyName: fiveShenContent.shen.familiarName,
    dailyPrompt: fiveShenContent.shen.dailyPrompt,
    recommendation: fiveShenContent.shen.overview,
    bagua: "Li",
    baguaText: "Ateş • Işık • Açıklık",
    task: fiveShenContent.shen.practiceCue,
    mapStage: 3,
    mapTitle: "Kalp Tapınağı",
    world: "Bütün elementlerin birleştiği yumuşak altın ışık",
    essence: fiveShenContent.shen.shortMeaning,
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
    label: fiveShenContent.yi.familiarName,
    value: 72,
    note: "Pratik hedefi net.",
    organ: "Dalak",
    map: "Merkez, karın hattı ve odak",
    point: { x: 50, y: 55 },
    color: shenThemes.yi.primary,
    color2: shenThemes.yi.dark,
    image: "/images/shen-home/yi-web.webp",
    music: "/videos/shen-music-yi.mp4",
    tone: 220,
    hero: fiveShenContent.yi.balancedExpression,
    dailyName: fiveShenContent.yi.familiarName,
    dailyPrompt: fiveShenContent.yi.dailyPrompt,
    recommendation: fiveShenContent.yi.overview,
    bagua: "Kun",
    baguaText: "Dağ • Toprak • Merkez",
    task: fiveShenContent.yi.practiceCue,
    mapStage: 2,
    mapTitle: "Yi Toprağı",
    world: "Sis, yumuşak ışık, dikkat ve sessiz iç denge",
    essence: fiveShenContent.yi.shortMeaning,
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
    label: fiveShenContent.po.familiarName,
    value: 58,
    note: "Omuzlarda çözülme bekliyor.",
    organ: "Akciğer",
    map: "Omuzlar, nefes kapısı ve cilt farkındalığı",
    point: { x: 59, y: 42 },
    color: shenThemes.po.primary,
    color2: shenThemes.po.dark,
    image: "/images/shen-home/po-web.webp",
    music: "/videos/shen-music-po.mp4",
    tone: 174,
    hero: fiveShenContent.po.balancedExpression,
    dailyName: fiveShenContent.po.familiarName,
    dailyPrompt: fiveShenContent.po.dailyPrompt,
    recommendation: fiveShenContent.po.overview,
    bagua: "Dui",
    baguaText: "Göl • Metal • Bırakma",
    task: fiveShenContent.po.practiceCue,
    mapStage: 7,
    mapTitle: "Po Gölü",
    world: "Toprak tonları, ağır nefes, güven ve sakin merkez",
    essence: fiveShenContent.po.shortMeaning,
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
    label: fiveShenContent.zhi.familiarName,
    value: 69,
    note: "Kısa tekrar yeterli.",
    organ: "Böbrek",
    map: "Bel, dizler, ayak tabanı ve kök",
    point: { x: 50, y: 72 },
    color: shenThemes.zhi.primary,
    color2: shenThemes.zhi.dark,
    image: "/images/shen-home/zhi-web.webp",
    music: "/videos/shen-music-zhi.mp4",
    tone: 146,
    hero: fiveShenContent.zhi.balancedExpression,
    dailyName: fiveShenContent.zhi.familiarName,
    dailyPrompt: fiveShenContent.zhi.dailyPrompt,
    recommendation: fiveShenContent.zhi.overview,
    bagua: "Kan",
    baguaText: "Okyanus • Su • Derinlik",
    task: fiveShenContent.zhi.practiceCue,
    mapStage: 0,
    mapTitle: "Zhi Okyanusu",
    world: "Gece, ay ışığı, derin su ve sessiz irade",
    essence: fiveShenContent.zhi.shortMeaning,
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

export const shenTodayCopy: Record<ShenId, {
  action: string;
  body: string;
  identity: string;
  motto: string;
  practice: string;
  shortLabel: string;
  title: string;
}> = {
  hun: {
    action: "Yönünü bul",
    body: fiveShenContent.hun.dailyPrompt,
    identity: fiveShenContent.hun.identity,
    motto: "Rüzgâr yönü gösterir; adımı sen seçersin.",
    practice: "Ufuk Açan Akış",
    shortLabel: fiveShenContent.hun.familiarName,
    title: "Ufku genişlet.",
  },
  shen: {
    action: "Berraklığı aç",
    body: fiveShenContent.shen.dailyPrompt,
    identity: fiveShenContent.shen.identity,
    motto: "Kalp yumuşadığında parçalar birbirini duyar.",
    practice: "Kalp Merkezinde Akış",
    shortLabel: fiveShenContent.shen.familiarName,
    title: "Berrak ve ilgili kal.",
  },
  yi: {
    action: "Odağını kur",
    body: fiveShenContent.yi.dailyPrompt,
    identity: fiveShenContent.yi.identity,
    motto: "Bir anda tek şey; bir nefeste tek yön.",
    practice: "Merkezleyen Tekrar",
    shortLabel: fiveShenContent.yi.familiarName,
    title: "Niyetini eyleme taşı.",
  },
  po: {
    action: "Bedene dön",
    body: fiveShenContent.po.dailyPrompt,
    identity: fiveShenContent.po.identity,
    motto: "Beden bıraktığında nefes yerini bulur.",
    practice: "Nefes ve Bırakış",
    shortLabel: fiveShenContent.po.familiarName,
    title: "Nefesi ve bedeni duy.",
  },
  zhi: {
    action: "İradeni koru",
    body: fiveShenContent.zhi.dailyPrompt,
    identity: fiveShenContent.zhi.identity,
    motto: "Derin su acele etmez; yine de yolunu bulur.",
    practice: "Köklenme Akışı",
    shortLabel: fiveShenContent.zhi.familiarName,
    title: "Sessizce devam et.",
  },
};

