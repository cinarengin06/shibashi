import {ShenId} from '../types';

export type CoachIntent='scatter'|'courage'|'slow'|'start';
export type CoachId='he'|'han'|'li'|'lu'|'zhang'|'lan'|'cao'|'zhongli';
export type ShibashiCoach={
 id:CoachId;name:string;icon:string;role:string;voice:string[];pitch:number;rate:number;shenId:ShenId;intro:string;
 lines:Record<CoachIntent,string>;
};

export const coachIntents:{id:CoachIntent;label:string}[]=[
 {id:'scatter',label:'Bugün dağınığım'},{id:'courage',label:'Cesaret lazım'},
 {id:'slow',label:'Yavaşlamak istiyorum'},{id:'start',label:'Pratiğe başla'},
];

export const shibashiCoaches:ShibashiCoach[]=[
 {id:'he',name:'He Xiangu',icon:'✿',role:'Yumuşak güç ve içsel zarafet',voice:['yumuşak','yavaş','şefkatli'],pitch:1.18,rate:.78,shenId:'shen',intro:'Seni zorlamadan yanında yürüyebilirim. Bugün bedeninde açılmaya hazır olan küçük yeri birlikte bulalım.',lines:{scatter:'Önce hiçbir şeyi düzeltmeye çalışma. Ayaklarının altındaki zemini hisset; sonra yalnızca bir nefeslik alan aç.',courage:'Yumuşaklık geri çekilmek değildir. Kökün sakin olduğunda hareketin daha cesur olabilir.',slow:'Bugün başarı, daha çok yapmak değil; bir hareketin içinde gerçekten kalabilmek.',start:'Avuçlarını bir lotus taşır gibi tut. İlk hareketi nefesin başlatsın, kolların değil.'}},
 {id:'han',name:'Han Xiangzi',icon:'♫',role:'Nefes, müzik ve yaratıcı akış',voice:['melodik','ritmik','hafif'],pitch:1.08,rate:.9,shenId:'hun',intro:'Her nefesin içinde henüz çalınmamış bir nota var. Bugün hareketini duymaya ne dersin?',lines:{scatter:'Dağınıklık bütün notaları aynı anda çalmaktır. Birini seç ve ona yer aç.',courage:'Cesaret bazen tek bir temiz notayı sonuna kadar sürdürebilmektir.',slow:'Ritmi yarıya indir. Nefesin ve hareketin aynı cümlede buluşsun.',start:'Önce dinle. Sonra nefes verişinde kolların melodiyi takip etsin.'}},
 {id:'li',name:'Li Tieguai',icon:'♨',role:'Dayanıklılık, mizah ve sıcaklık',voice:['çatlak','düşük','neşeli'],pitch:.68,rate:.76,shenId:'zhi',intro:'Kap çatlak olabilir; ama içindeki sıcaklık hâlâ işe yarar. Kusursuz olmayı bırak da başlayalım.',lines:{scatter:'Bütün parçaları toplamana gerek yok. En yakındakini eline al; bugünlük o yeter.',courage:'Korku bacaklarını titretebilir. Yine de küçük bir adım atılır.',slow:'Yorgunsan dinlenerek çalış. Dinlenmek yolun dışı değil, yolun nefesidir.',start:'Omuzlarını indir, dizlerini kilitleme. Beden emirden çok dostluğu anlar.'}},
 {id:'lu',name:'Lü Dongbin',icon:'⌁',role:'Keskin farkındalık ve disiplin',voice:['berrak','ölçülü','sakin'],pitch:.92,rate:.92,shenId:'po',intro:'Dikkat kılıç gibidir: savrulursa yorar, doğru yönde tutulursa yolu açar.',lines:{scatter:'Tek bir eksen seç: ayak, merkez ve bakış. Üçü aynı yönü bulduğunda zihin dağılmaz.',courage:'Cesaret sonuçtan emin olmak değil, hareketin ilkesine sadık kalmaktır.',slow:'Hızı azalt fakat dikkati azaltma. Yavaşlık ancak uyanıklıkla çalışır.',start:'Duruşunu kur, nefesi izle, gereksiz olanı bırak ve ilk harekete gir.'}},
 {id:'zhang',name:'Zhang Guolao',icon:'↶',role:'Ters bakış ve alışkanlıkları kırma',voice:['oyuncu','soru soran','beklenmedik'],pitch:.84,rate:.86,shenId:'yi',intro:'Herkes ileri giderken ben bazen geriye bakarım. Belki cevap aceleyle geçtiğin yerdedir.',lines:{scatter:'Yeni bir şey ekleme. Bugün önce bitir, sonra planla.',courage:'Korktuğun kapıya koşma. Arkasını dolaş; belki kapı sandığın şey duvardır.',slow:'Yavaşlamak yetmez. Nereye yetiştiğini de sor.',start:'İlk hareketi bildiğin gibi değil, ilk kez görüyormuş gibi yap.'}},
 {id:'lan',name:'Lan Caihe',icon:'❀',role:'Özgürlük, oyun ve canlılık',voice:['genç','akışkan','neşeli'],pitch:1.25,rate:1.02,shenId:'hun',intro:'Bugün hareketin düzgün görünmek zorunda değil. Canlı olsun; önce onu bulalım.',lines:{scatter:'Bir dakika boyunca seçme. Bedenin hangi yöne sallanmak istiyorsa onu izle.',courage:'Oyun alanında hata, yeni bir yolun kapısıdır.',slow:'Bir çiçeğin açmasını hızlandıramazsın. Ama ona yer açabilirsin.',start:'Müziği duymasan da ritim var. Ayaklarından başlat.'}},
 {id:'cao',name:'Cao Guojiu',icon:'◇',role:'Ölçü, etik ve güvenilir yapı',voice:['tok','resmî','ölçülü'],pitch:.82,rate:.83,shenId:'yi',intro:'Pratik, kendine verdiğin sözü uygulanabilir bir biçime dönüştürmektir. Küçük ama net bir söz seçelim.',lines:{scatter:'Görevleri üçe indir: hazırlan, uygula, kapat.',courage:'Kendini kanıtlamak zorunda değilsin. Değerlerine uygun bir sonraki adımı at.',slow:'Aynı saatte kısa çalışma, uzun fakat düzensiz çalışmadan daha güvenilirdir.',start:'Süreyi belirle, alanı hazırla ve başladığında yalnızca pratiğin içinde kal.'}},
 {id:'zhongli',name:'Zhongli Quan',icon:'☯',role:'Sıcak otorite ve cömert güç',voice:['derin','gür','sıcak'],pitch:.72,rate:.88,shenId:'shen',intro:'Güç sertleşmek değildir. İyi bir ateş hem dönüştürür hem etrafındakileri ısıtır.',lines:{scatter:'Merkezine dön. Nefesi karında topla, hareketi oradan bütün bedene dağıt.',courage:'Korkuyu kovalamayacağız. Sıcaklığı büyüteceğiz; gölge kendiliğinden küçülecek.',slow:'Ateş fazla yükselirse yemek yanar. Kıs, dinle, yeniden besle.',start:'Ayaklarını yere ver, göğsünü zorlamadan aç ve ilk nefeste bedenine yer aç.'}},
];

export function inferCoachIntent(text:string):CoachIntent{
 const value=text.toLocaleLowerCase('tr-TR');
 if(/kork|cesa|güven|çekin/.test(value))return'courage';
 if(/yavaş|yorgun|dinlen|sakin/.test(value))return'slow';
 if(/dağ|karış|odak|zihin/.test(value))return'scatter';
 return'start';
}

export const regionCoachIds:CoachId[]=['li','zhang','zhongli','cao','he','lu','han','lan'];
