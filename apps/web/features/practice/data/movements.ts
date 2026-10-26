import { innerJourneyScenes } from "@/features/journey/data/scenes";

export type Movement = {
  id: number;
  name: string;
  english: string;
  image: string;
  focus: string;
  cue: string;
};

export type WarmupLessonId = "wuji" | "warmup" | "kua";
export type PracticeLearningMode = "preparation" | "shibashi";
export type PracticeAdaptation = "standing" | "seated" | "gentle";

export type WarmupLesson = {
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

export const movements: Movement[] = [
  {
    id: 1,
    name: "Açılış Formu",
    english: "Açılış ve hizalanma",
    image: "/images/form-scenes/1.jpg",
    focus: "Duruş",
    cue: "Kollar çabayla değil, nefesin taşıdığı kadar yükselsin.",
  },
  {
    id: 2,
    name: "Bağrını Açmak",
    english: "Göğüs hattını yumuşakça açma",
    image: "/images/form-scenes/2.jpg",
    focus: "Nefes",
    cue: "Kaburgaları zorlamadan, göğüs hattını genişlet.",
  },
  {
    id: 3,
    name: "Gökkuşakları ile Dans",
    english: "Yumuşak yan akış",
    image: "/images/form-scenes/3.jpg",
    focus: "Akış",
    cue: "Ağırlığı yavaş bir dalga gibi taşı.",
  },
  {
    id: 4,
    name: "İçten Dışa",
    english: "Merkezden açılıp merkeze dönme",
    image: "/images/form-scenes/4.jpg",
    focus: "Merkez",
    cue: "Daireyi yuvarlak ve sessiz tut.",
  },
  {
    id: 5,
    name: "Maymunu İtekle",
    english: "Merkezden yumuşak itiş",
    image: "/images/form-scenes/5.jpg",
    focus: "Denge",
    cue: "İtişi merkezden başlat, omuzları yumuşat.",
  },
  {
    id: 6,
    name: "Kayıkta Kürek Çek",
    english: "Kolları kürek gibi dairesel taşıma",
    image: "/images/form-scenes/6.jpg",
    focus: "Koordinasyon",
    cue: "Kollar daire çizerken ağırlığı ayakların arasında sessizce taşı.",
  },
  {
    id: 7,
    name: "Balonla Oyna",
    english: "Topu kaldırma ve merkezi koruma",
    image: "/images/form-scenes/7.jpg",
    focus: "Merkez",
    cue: "Avuçların arasındaki alanı koru; omuzları yukarı çekme.",
  },
  {
    id: 8,
    name: "Ayı Göğe Gönder",
    english: "Topu göğe taşıma",
    image: "/images/form-scenes/8.jpg",
    focus: "Uzanma",
    cue: "Kollar yükselirken göğsü sıkıştırmadan omurgayı uzat.",
  },
  {
    id: 9,
    name: "Karnın ile İt",
    english: "Merkezden öne yumuşak itiş",
    image: "/images/form-scenes/9.jpg",
    focus: "Dan Tian",
    cue: "Ellerden önce alt karın merkezinin yön değiştirdiğini hisset.",
  },
  {
    id: 10,
    name: "Bulutlarla Dans",
    english: "Bulut elleriyle yan akış",
    image: "/images/form-scenes/10.jpg",
    focus: "Akış",
    cue: "Bakış, bel ve eller aynı sakin dalganın içinde yön değiştirsin.",
  },
  {
    id: 11,
    name: "Okyanustan Suyu Göğe Taşı",
    english: "Aşağıdan yukarı genişleyen akış",
    image: "/images/form-scenes/11.jpg",
    focus: "Nefes",
    cue: "Aşağı inerken gevşe, yükselirken nefesle birlikte bütün bedeni uzat.",
  },
  {
    id: 12,
    name: "Dalgalarla Oyna",
    english: "Öne ve geriye ağırlık aktarımı",
    image: "/images/form-scenes/12.jpg",
    focus: "Ağırlık",
    cue: "Dizleri kilitlemeden ağırlığı dalga gibi öne ve geriye taşı.",
  },
  {
    id: 13,
    name: "Yaban Kazı Kanatlarını Açıyor",
    english: "Kanatları iki yana açma",
    image: "/images/form-scenes/13.jpg",
    focus: "Göğüs",
    cue: "Kollar açılırken kürek kemiklerini sıkıştırmadan göğüste alan bırak.",
  },
  {
    id: 14,
    name: "Yumruklama",
    english: "Merkezden kontrollü yumruk",
    image: "/images/form-scenes/14.jpg",
    focus: "Güç",
    cue: "Yumruğu omuzdan değil, ayak ve bel hattından yumuşakça gönder.",
  },
  {
    id: 15,
    name: "Yaban Kazı Yükseliyor",
    english: "Kanatlarla yükselme ve alçalma",
    image: "/images/form-scenes/15.jpg",
    focus: "Denge",
    cue: "Yükselirken acele etme; bakışı sabit, ayak tabanını canlı tut.",
  },
  {
    id: 16,
    name: "Değirmeni Döndür",
    english: "Büyük dairesel kol hareketi",
    image: "/images/form-scenes/16.jpg",
    focus: "Daire",
    cue: "Daireyi yalnız kollarla değil, bel ve Kua ile birlikte döndür.",
  },
  {
    id: 17,
    name: "Topu Sektir",
    english: "Ritimli el ve adım koordinasyonu",
    image: "/images/form-scenes/17.jpg",
    focus: "Ritim",
    cue: "El ve karşı ayağı aynı yumuşak ritimde buluştur.",
  },
  {
    id: 18,
    name: "Kapanış Formu",
    english: "Nefesi ve hareketi merkeze toplama",
    image: "/images/form-scenes/18.jpg",
    focus: "Bütünleme",
    cue: "Avuçlar alçalırken nefesi doğal bırak ve ağırlığı merkeze topla.",
  },
];

export const warmupLessons: readonly WarmupLesson[] = [
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

export const shibashiFullSetVideoId = "y-S29E23AGE";

export const movementReferenceImages: Record<number, string> = {
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

export function getMovementReferenceImage(movement: Movement) {
  return movementReferenceImages[movement.id] ?? movement.image;
}

export function getInnerJourneyScene(movementId: number) {
  const index = Math.min(innerJourneyScenes.length - 1, Math.floor(((movementId - 1) / movements.length) * innerJourneyScenes.length));
  return innerJourneyScenes[index] ?? innerJourneyScenes[0];
}

