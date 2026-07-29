import {LivingStory} from '../types';

const seeds=[
 ['Yeni Gün','Yatağından Uyanış','Yorganı üzerinden acele etmeden kaldır.','Sabahın ilk ışığıyla ellerini yavaşça yükselt.','Yataktan kalkışını daha az zorlayarak başlat.'],
 ['Açılan Pencere','Odaya Nefes Girmesi','Göğsünde yeni bir pencere aç.','Pencereyi açar gibi kollarını iki yana taşı.','Uzun oturuşlardan sonra göğüs hattına alan ver.'],
 ['Gökkuşağı Yolu','Sokağa İlk Adım','Ağırlığın bir renkten diğerine aksın.','Yanlara geçerken gövdeni zorlamadan ufku izle.','Yön değiştirirken acele etmek yerine akışı koru.'],
 ['Bulut Kapısı','Sabah Göğü','Bulutları ayır; aradaki göğü fark et.','Avuçlarını merkezden dışarı açıp tekrar buluştur.','Kalabalık düşünceler arasında küçük bir boşluk yarat.'],
 ['Sessiz Karşılaşma','Yolda Birine Yer Açmak','İtiş sertlik değil, sınırın yumuşak dilidir.','Ağırlığını merkeze alıp avuçlarını sakince ileri taşı.','Hayır derken bedenini kasmadan sınır koy.'],
 ['Gölde Yolculuk','Sandala Oturmak','Küreği suya bırak; göl seni ileri taşısın.','Dizlerini yumuşatıp hayali küreği nefesle çek.','İşe giderken ritmini dış dünyanın hızından koru.'],
 ['Güneş Topu','Işığı Taşımak','Avuçların arasındaki sıcaklığı koru.','Hayali topu kaldırırken omuzlarını serbest bırak.','Bir görevi taşırken gereksiz gerginliği azalt.'],
 ['Aya Bakış','Akşam Penceresi','Gökyüzüne uzanırken kökünü unutma.','Belden kırılmadan gövdeni uzun bir yay gibi çevir.','Ekrandan başını kaldırıp ufka bakmayı hatırla.'],
 ['Merkezden İtiş','Kapıyı Açmak','Ellerden önce merkezin yön değiştirsin.','Alt karından başlayan küçük dalgayı avuçlara taşı.','Zor bir işe başlarken gücü omuzdan değil merkezden al.'],
 ['Bulut Eller','Kalabalıkta Akış','Eller bulut, bel rüzgâr olsun.','Bakış, bel ve eller aynı yumuşak çizgide aksın.','Günün yoğunluğunda yön değiştirirken merkezde kal.'],
 ['Denizden Göğe','Yerden Bir Şey Almak','Aşağı inerken bırak, yükselirken büyü.','Dizleri yumuşatıp ellerini yerden göğe taşı.','Eğilip kalkarken belini değil bütün bedenini kullan.'],
 ['Dalgalar','Beklerken Sabır','Dalga geri çekilmeden ileri gitmez.','Ağırlığı topuktan öne, sonra yeniden geriye taşı.','Bekleme anlarını sabırsızlık yerine nefese bağla.'],
 ['Yaban Kazı','Göğü Genişletmek','Kanatların açıklığı göğsündeki alan kadardır.','Kolları iki yana açarken kürek kemiklerini sıkıştırma.','Uzun bir günün sonunda kapanan göğsü yumuşat.'],
 ['Sessiz Güç','Kararlı Adım','Güç sertlikten değil, kökten gelir.','Yumruğu ayak ve bel hattından kontrollü gönder.','Kararını öfkeyle değil netlikle ifade et.'],
 ['Yükselen Kaz','Tek Ayakta Güven','Yükselirken bakışın ufukta kalsın.','Ağırlığı tek ayağa taşırken nefesi sakin tut.','Dengesiz bir anda küçük ve güvenli bir merkez bul.'],
 ['Değirmen','Günün Döngüsü','Büyük daire küçük bir merkezden doğar.','Bel ve kalça kıvrımını (gelenekte Kua) kullanarak birlikte geniş bir çember çiz.','Tekrarlayan işleri bedeninde akışa dönüştür.'],
 ['Topun Ritmi','Oyun ve Koordinasyon','Ritim bedeni yeniden neşeye çağırır.','Karşı el ve ayağı yumuşak tempoda buluştur.','Ciddiyetin ağırlaştığı anda küçük bir oyun alanı aç.'],
 ['Eve Dönüş','Günü Kapatmak','Topladığın canlılığı sessizce merkeze bırak. Bu canlılık gelenekte Qi olarak anılır.','Avuçlar alçalırken nefesi doğal akışına bırak.','Günü bitirirken zihni ve bedeni aynı yerde buluştur.'],
] as const;

export const livingStories:LivingStory[]=seeds.map((seed,index)=>({
 id:`story-${index+1}`,order:index+1,title:seed[0],subtitle:seed[1],duration:index===0?6:index===5?8:5,movementId:`movement-${index+1}`,quote:seed[2],description:seed[3],lifeConnection:seed[4],
 steps:['Ayaklarını yere sağlam ve yumuşak bırak.','Hareketi nefesin başlatmasına izin ver.','Bitirirken merkezde bir an sessiz kal.'],
 ambience:index===0?['Sabah kuşları','Hafif rüzgâr','Uzak çan']:index===5?['Su sesi','Ahşap sandal','Sabah sisi']:['Doğa sesi','Yavaş nefes','Sessiz alan'],
}));

export const livingStoryImages:Record<string,number>={
 'story-1':require('../assets/living-learning/yeni-gun.png'),
 'story-6':require('../assets/living-learning/golde-yolculuk.png'),
};
