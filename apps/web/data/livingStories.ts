export type LivingStory = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  duration: string;
  movementLabel: string;
  image: string;
  quote: string;
  description: string;
  steps: readonly string[];
  ambience: readonly string[];
  practiceHref: string;
  status: "available" | "next";
};

export const livingStories: readonly LivingStory[] = [
  {
    id: "yeni-gun",
    order: 1,
    title: "Yeni Gün",
    subtitle: "Yatağından Uyanış",
    duration: "6 dk",
    movementLabel: "Kolları Yükseltme",
    image: "/images/living-learning/yeni-gun.png",
    quote: "Yorganı üzerinden acele etmeden kaldır.",
    description:
      "Sabahın ilk ışıkları odana giriyor. Nefes alırken ellerini yavaşça yükselt; sanki sıcak bir yorganı üzerinden nazikçe kaldırıyorsun.",
    steps: [
      "Ayaklarını yere sağlamca yerleştir.",
      "Nefes alırken avuçlarını yumuşakça yükselt.",
      "Omuzlarını gevşek tut ve hareketi nefesinle bitir.",
    ],
    ambience: ["Sabah kuşları", "Hafif rüzgâr", "Uzak çan"],
    practiceHref: "/?tab=practice&movement=raise-arms",
    status: "available",
  },
  {
    id: "golde-yolculuk",
    order: 2,
    title: "Gölde Yolculuk",
    subtitle: "Sandala Oturmak",
    duration: "8 dk",
    movementLabel: "Kayıkta Kürek Çekme",
    image: "/images/living-learning/golde-yolculuk.png",
    quote: "Küreği suya bırak; göl seni ileri taşısın.",
    description:
      "Evden çıktın ve işe giden sessiz sandala bindin. Kolların küreğin ritmini izlerken gövden dengede, nefesin sakin kalıyor.",
    steps: [
      "Dizlerini yumuşat ve merkezini aşağıda tut.",
      "Kollarını öne uzatıp hayali küreği kavra.",
      "Nefes verirken dirseklerini geriye doğru çek.",
    ],
    ambience: ["Su sesi", "Ahşap sandal", "Sabah sisi"],
    practiceHref: "/?tab=practice&movement=row-boat",
    status: "next",
  },
] as const;
