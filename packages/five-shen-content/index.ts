export type FiveShenContentId = "hun" | "shen" | "yi" | "po" | "zhi";

export const fiveShenTraditionNote =
  "Beş Shen, geleneksel Çin tıbbında beden, duygu ve zihinsel yaşamın birbiriyle ilişkili beş yönünü anlatan bir haritadır; kişilik testi ya da tıbbi teşhis değildir.";

export const fiveShenContent: Record<
  FiveShenContentId,
  {
    familiarName: string;
    shortMeaning: string;
    identity: string;
    overview: string;
    balancedExpression: string;
    dailyPrompt: string;
    practiceCue: string;
  }
> = {
  hun: {
    familiarName: "Yön ve Hayal",
    shortMeaning: "Sezgi · Hayal · Yön",
    identity: "Sezgiyi, yaratıcılığı ve yaşam yönünü taşır",
    overview:
      "Hun; sezgi, yaratıcı düşünce, imgelem, plan kurma ve yaşamda yön bulma kapasitesiyle ilişkilendirilir.",
    balancedExpression:
      "Dengeli Hun, olasılıkları görür; bir hayali uygulanabilir bir yöne dönüştürür.",
    dailyPrompt:
      "Bugün yeni bir olasılığı fark et, yönünü seç ve ona küçük bir adım aç.",
    practiceCue: "Gitmek istediğin yönü tek bir sade cümleyle yaz.",
  },
  shen: {
    familiarName: "Berrak Farkındalık",
    shortMeaning: "Bilinç · Bağ · Neşe",
    identity: "Berrak bilinci, bağı ve kalpten farkındalığı taşır",
    overview:
      "Shen; bilinç, düşünme, ayırt etme, karar verme ve çevremizle sevgi, şefkat ve neşe üzerinden bağ kurmayla ilişkilendirilir.",
    balancedExpression:
      "Dengeli Shen, olanı daha berrak görür; sakin ve ilgili bir temas kurar.",
    dailyPrompt:
      "Bugün bakışını yumuşat, acele etmeden gör ve karşındakiyle gerçekten temas kur.",
    practiceCue: "Bir konuşmadan önce nefes ver ve gerçekten karşındakine dön.",
  },
  yi: {
    familiarName: "Odaklı Niyet",
    shortMeaning: "Odak · Öğrenme · Niyet",
    identity: "Düşünceyi sürdürülen niyete ve eyleme taşır",
    overview:
      "Yi; öğrenme, hatırlama, yoğunlaşma, anlamlandırma ve bir düşünceyi eyleme dönüştüren sürdürülebilir niyetle ilişkilendirilir.",
    balancedExpression:
      "Dengeli Yi, bilgiyi düzenler; tek bir niyeti dikkatle sonuca taşır.",
    dailyPrompt:
      "Bugün bir niyet seç, dağınık olanı sadeleştir ve ilk işi bitirene kadar onunla kal.",
    practiceCue: "Bugünkü niyetini tek kelimeyle belirle.",
  },
  po: {
    familiarName: "Nefes ve Duyum",
    shortMeaning: "Nefes · Duyu · Şimdi",
    identity: "Nefesi, bedensel duyumu ve şimdiyle teması taşır",
    overview:
      "Po; nefes, fiziksel duyum, beden koordinasyonu, bedensel hafıza ve haz-acı gibi doğrudan deneyimlerle ilişkilendirilir.",
    balancedExpression:
      "Dengeli Po, bedenden gelen sinyalleri duyar; yaşamın değişimine nefesle uyum sağlar.",
    dailyPrompt:
      "Bugün nefesini ve bedenindeki duyumları fark et; gereksiz gerginliği nazikçe bırak.",
    practiceCue: "Omuzlarını bırakıp bir dakika yalnızca nefesini ve ayak tabanlarını hisset.",
  },
  zhi: {
    familiarName: "Sessiz İrade",
    shortMeaning: "İrade · Dayanıklılık · Cesaret",
    identity: "Kararlılığı, dayanıklılığı ve bilinmeyende ilerleme gücünü taşır",
    overview:
      "Zhi; irade, kararlılık, dayanıklılık, hayatta kalma içgüdüsü ve belirsizlik karşısında akıllıca hareket etme kapasitesiyle ilişkilendirilir.",
    balancedExpression:
      "Dengeli Zhi, korkuyu inkâr etmeden sakin kalır ve bir sonraki doğru adımı atar.",
    dailyPrompt:
      "Bugün gücünü tüketmeden devam et; bilinmeyeni en küçük, yapılabilir adıma indir.",
    practiceCue: "Zor görünen işi şimdi yapabileceğin en küçük adıma indir.",
  },
};
