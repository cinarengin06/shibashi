import type { ShenId } from "@/features/home/data/shen";

export const coachVoiceVersion = "tr-yelda-20260714";

export const aiCoaches = [
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

export type AiCoach = (typeof aiCoaches)[number];
export type CoachIntent = "scatter" | "courage" | "slow" | "start";

export const coachDialogues: Record<AiCoach["id"], { intro:string; lines:Record<CoachIntent,string> }> = {
  he:{intro:"Seni zorlamadan yanında yürüyebilirim. Bugün bedeninde açılmaya hazır olan küçük yeri bulalım.",lines:{scatter:"Önce hiçbir şeyi düzeltme. Zemini hisset ve yalnızca bir nefeslik alan aç.",courage:"Yumuşaklık geri çekilmek değildir. Kökün sakinken hareketin cesur olabilir.",slow:"Bugün başarı, bir hareketin içinde gerçekten kalabilmek.",start:"İlk hareketi nefesin başlatsın, kolların değil."}},
  han:{intro:"Her nefesin içinde henüz çalınmamış bir nota var. Bugün hareketini duymaya ne dersin?",lines:{scatter:"Bütün notaları aynı anda çalma. Birini seç ve ona yer aç.",courage:"Cesaret bazen tek bir temiz notayı sonuna kadar sürdürebilmektir.",slow:"Ritmi yarıya indir; nefes ve hareket aynı cümlede buluşsun.",start:"Önce dinle, sonra kolların nefesi takip etsin."}},
  li:{intro:"Kusursuz olmayı bırak da başlayalım. Küçük bir adım bugün yeter.",lines:{scatter:"Bütün parçaları toplama. En yakındakini eline al.",courage:"Korku bacaklarını titretebilir; yine de bir adım atılır.",slow:"Yorgunsan dinlenerek çalış. Dinlenmek yolun nefesidir.",start:"Omuzları indir, dizleri kilitleme; beden dostluğu anlar."}},
  lu:{intro:"Dikkat kılıç gibidir: savrulursa yorar, doğru tutulursa yolu açar.",lines:{scatter:"Ayak, merkez ve bakış için tek eksen seç.",courage:"Cesaret sonuçtan emin olmak değil, ilkeye sadık kalmaktır.",slow:"Hızı azalt fakat dikkati azaltma.",start:"Duruşunu kur, nefesi izle ve gereksiz olanı bırak."}},
  zhang:{intro:"Belki cevap, aceleyle geçtiğin yerdedir. Bir kez de tersinden bakalım.",lines:{scatter:"Yeni bir şey ekleme. Önce bitir, sonra planla.",courage:"Kapıya koşma; arkasını dolaş ve gerçekten kapı mı bak.",slow:"Yavaşlamak yetmez. Nereye yetiştiğini de sor.",start:"İlk hareketi ilk kez görüyormuş gibi yap."}},
  lan:{intro:"Hareketin düzgün görünmek zorunda değil. Önce canlı olanı bulalım.",lines:{scatter:"Bir dakika seçme; bedenin gitmek istediği yönü izle.",courage:"Oyun alanında hata, yeni bir yolun kapısıdır.",slow:"Bir çiçeği hızlandıramazsın ama ona yer açabilirsin.",start:"Müziği duymasan da ritim var. Ayaklarından başlat."}},
  cao:{intro:"Bugün kendine küçük ama net bir söz verelim.",lines:{scatter:"Görevleri üçe indir: hazırlan, uygula, kapat.",courage:"Kendini kanıtlama; değerlerine uygun bir sonraki adımı at.",slow:"Kısa ve düzenli çalışma iradeyi korur.",start:"Süreyi belirle, alanı hazırla ve pratiğin içinde kal."}},
  zhongli:{intro:"Güç sertleşmek değildir. İyi bir ateş hem dönüştürür hem ısıtır.",lines:{scatter:"Merkezine dön; nefesi karında topla ve bedene dağıt.",courage:"Korkuyu kovalamak yerine sıcaklığı büyüt.",slow:"Ateşi kıs, dinle ve yeniden besle.",start:"Ayaklarını yere ver ve ilk nefeste bedenine yer aç."}},
};

export function inferCoachIntent(text:string):CoachIntent {
  const value=text.toLocaleLowerCase("tr-TR");
  if(/kork|cesa|güven|çekin/.test(value))return"courage";
  if(/yavaş|yorgun|dinlen|sakin/.test(value))return"slow";
  if(/dağ|karış|odak|zihin/.test(value))return"scatter";
  return"start";
}

