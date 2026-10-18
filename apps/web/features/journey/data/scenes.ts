import type { ShenId } from "@/features/home/data/shen";

export type NeijingStage = {
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

export type InnerJourneyScene = {
  id: string;
  title: string;
  gate: string;
  bodyHint: string;
  encounter: string;
  ritual: string;
  x: number;
  y: number;
};


export const neijingStages: readonly NeijingStage[] = [
  {
    title: "Zhi Okyanusu",
    shenId: "zhi",
    x: 50,
    y: 82,
    labelX: 50,
    labelY: 87,
    reward: "Köklenme pratiği",
    depth: 18,
    text: "Köklenme, korkuyla yüzleşme ve devam etme gücü. Pratik burada ayak tabanı, dizler ve bel hattını sakinleştirir.",
    benefits: ["Ayak tabanı farkındalığı", "Bel hattında güven", "Telaş azalınca devam gücü"],
    dailyUse: "Güne başlamadan, toplantı öncesi ya da içinden kaçma isteği geldiğinde zemini yeniden hatırlatır.",
    microPractice: "İki ayağını yere bastır. Dizleri kilitlemeden yumuşat. Üç nefes boyunca ağırlığını topuktan parmaklara gezdir.",
  },
  {
    title: "Alt Dantian",
    x: 50,
    y: 51,
    labelX: 75,
    labelY: 84,
    reward: "Merkez pratiği",
    depth: 31,
    text: "Günlük enerjinin toplandığı merkez. Hareketin alt bedenden doğduğunu ve nefesle güçlendiğini gösterir.",
    benefits: ["Enerjiyi toparlama", "Merkezden hareket etme", "Yorgunlukta sakin güç"],
    dailyUse: "İşten sonra dağılan enerjiyi toplamaya, bedeni yeniden merkeze çağırmaya yarar.",
    microPractice: "Avuçlarını alt karna yaklaştır. Nefes alırken alan genişlesin, verirken omuzlar ağırlaşsın.",
  },
  {
    title: "Yi Toprağı",
    shenId: "yi",
    x: 50,
    y: 42,
    labelX: 52,
    labelY: 69,
    reward: "Odak pratiği",
    depth: 42,
    text: "Niyet, öğrenme ve tekrar alanı. Burada pratik tek seferlik deneme olmaktan çıkıp alışkanlığa dönüşür.",
    benefits: ["Odaklanma", "Planı bitirme", "Zihinsel dağınıklığı sadeleştirme"],
    dailyUse: "Bir işe başlayamıyorsan ya da aynı anda çok şeye bölündüysen zihni tek çizgiye indirir.",
    microPractice: "Bakışını tek noktaya al. Bir sonraki küçük adımı sessizce söyle. Sonra sadece o adıma başla.",
  },
  {
    title: "Kalp Tapınağı",
    shenId: "shen",
    x: 50,
    y: 29,
    labelX: 66,
    labelY: 53,
    reward: "Göğüs açıklığı pratiği",
    depth: 56,
    text: "Kalp farkındalığı, açıklık ve yumuşak temas. Göğüs hattı zorlanmadan açılır, bakış sakinleşir.",
    benefits: ["Göğüs açıklığı", "İlişkide yumuşama", "Neşe ve temas hissi"],
    dailyUse: "Bir konuşmaya girmeden önce tonu yumuşatır; savunmaya geçmeden bağlantıda kalmayı destekler.",
    microPractice: "Dirsekleri gevşet. Göğsü zorlamadan genişlet. Nefes verirken yüz kaslarını serbest bırak.",
  },
  {
    title: "Hun Ormanı",
    shenId: "hun",
    x: 43,
    y: 36,
    labelX: 31,
    labelY: 50,
    reward: "Yön pratiği",
    depth: 67,
    text: "Yön, vizyon ve akış cesareti. Kolların yolu, bakış yönü ve genişleme hissi bu bölgede öne çıkar.",
    benefits: ["Yön duygusu", "Akışa girme", "Karar sonrası hareket"],
    dailyUse: "Önünü göremediğin anlarda bedene rota hissi verir; küçük ama canlı bir ileri hareket başlatır.",
    microPractice: "Bakışını ufka taşı. Kolları yavaşça yana aç. Nefesle birlikte alanın genişlediğini hisset.",
  },
  {
    title: "12 Katlı Pagoda",
    x: 50,
    y: 21,
    labelX: 53,
    labelY: 35,
    reward: "Nefes ritmi pratiği",
    depth: 78,
    text: "Boğaz geçidi nefesin ve ifadenin daralıp açıldığı yerdir. Hareket dili burada sakinleşir.",
    benefits: ["Nefes ritmi", "Sakin ifade", "Boyun ve çene gevşemesi"],
    dailyUse: "Cevap vermeden önce durmak, ses tonunu yumuşatmak ve bedende sıkışan ifadeyi açmak için iyidir.",
    microPractice: "Çeneyi sıkmadan bırak. Nefesi burundan al. Verirken boynun arkasında uzunluk hissi yarat.",
  },
  {
    title: "Kunlun Zirveleri",
    x: 50,
    y: 7,
    labelX: 52,
    labelY: 13,
    reward: "Berraklık pratiği",
    depth: 92,
    text: "Berraklık, üst merkez ve dönüş kapısı. Haritanın zirvesi bitiş değil, daha sakin bir başlangıçtır.",
    benefits: ["Berrak bakış", "Geniş perspektif", "Daha sakin başlangıç"],
    dailyUse: "Yoğun bir günün sonunda olaylara biraz yukarıdan bakmak ve kendini yeniden hizalamak için açılır.",
    microPractice: "Başın tepesinden yukarı hafif bir ip varmış gibi uzan. Omuzları indirmeyi unutma.",
  },
  {
    title: "Po Gölü",
    shenId: "po",
    x: 58,
    y: 30,
    labelX: 26,
    labelY: 72,
    reward: "Bırakma pratiği",
    depth: 84,
    text: "Nefes, beden hafızası ve bırakma alanı. Omuzlar, göğüs kafesi ve cilt farkındalığı yumuşar.",
    benefits: ["Bırakma becerisi", "Omuzlarda hafifleme", "Bedensel sinyalleri duyma"],
    dailyUse: "Fazlalık taşıdığını hissettiğinde, özellikle omuz ve göğüs çevresindeki gerilimi çözmek için çalışır.",
    microPractice: "Omuzları kulaklara doğru kaldır, sonra bırak. Nefes verirken göğüs kafesinin ağırlaştığını hisset.",
  },
];

export const innerJourneyScenes: readonly InnerJourneyScene[] = [
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

