import {ShenId} from '../types';

export type JourneyTarget='practice'|'posture'|'journal'|'today'|'learning';
export interface BaguaDirection{id:string;trigram:string;name:string;element:string;module:string;cue:string;color:string;target:JourneyTarget}
export interface HumanMapStage{id:string;title:string;shenId?:ShenId;reward:string;text:string;benefits:string[];dailyUse:string;microPractice:string;x:number;y:number}

export const baguaDirections:BaguaDirection[]=[
 {id:'qian',trigram:'☰',name:'Qian',element:'Gök',module:'İçsel Rehber',cue:'Vizyonunu netleştir; bugünün pratiğini bilinçle seç.',color:'#F3CF8B',target:'learning'},
 {id:'dui',trigram:'☱',name:'Dui',element:'Göl',module:'Yansıma',cue:'Deneyimini adlandır ve bugünün yansımasını kaydet.',color:'#D9BD80',target:'journal'},
 {id:'li',trigram:'☲',name:'Li',element:'Ateş',module:'Pratik',cue:'Canlılığı harekete geçir; kısa bir Shibashi akışı başlat.',color:'#FF7A3D',target:'practice'},
 {id:'zhen',trigram:'☳',name:'Zhen',element:'Gök Gürültüsü',module:'Postür',cue:'Uyan ve hizalan; beden eksenini yeniden kontrol et.',color:'#F4A340',target:'posture'},
 {id:'xun',trigram:'☴',name:'Xun',element:'Rüzgâr',module:'Günlük',cue:'İçgörünün sessizce yayılmasına izin ver.',color:'#79D6AD',target:'journal'},
 {id:'kan',trigram:'☵',name:'Kan',element:'Su',module:'Nefes',cue:'Akışı zorlamadan sürdür; nefes ritmine geri dön.',color:'#5EB7D8',target:'practice'},
 {id:'gen',trigram:'☶',name:'Gen',element:'Dağ',module:'Denge',cue:'Dur, köklen ve merkezini dinle; postür taraması yap.',color:'#B6A982',target:'posture'},
 {id:'kun',trigram:'☷',name:'Kun',element:'Toprak',module:'Toparlanma',cue:'Temele dön; bugünkü enerjini ve ritmini gözden geçir.',color:'#C89962',target:'today'},
];

export const humanMapStages:HumanMapStage[]=[
 {id:'zhi-ocean',title:'Kararlılık Alanı · Zhi',shenId:'zhi',reward:'+8 canlılık · Qi',x:50,y:84,text:'Köklenme, korkuyla temas ve devam etme gücü.',benefits:['Ayak tabanı farkındalığı','Bel hattında güven','Sakin devam gücü'],dailyUse:'Zor bir başlangıçtan önce zemini yeniden hatırlatır.',microPractice:'Dizleri kilitlemeden iki ayağa yerleş. Üç nefes boyunca ağırlığını hisset.'},
 {id:'dantian',title:'Alt Karın Merkezi · Dantian',reward:'+10 beden gücü · Jing',x:68,y:76,text:'Günlük enerjinin toplandığı merkez.',benefits:['Enerjiyi toplama','Merkezden hareket','Sakin güç'],dailyUse:'Dağılan enerjiyi yeniden merkeze çağırır.',microPractice:'Avuçlarını alt karna yaklaştır. Nefes verirken omuzlarını bırak.'},
 {id:'yi-earth',title:'Odak Alanı · Yi',shenId:'yi',reward:'+6 zihin açıklığı · Shen',x:48,y:65,text:'Niyet, öğrenme ve tekrar alanı.',benefits:['Odaklanma','Planı bitirme','Zihni sadeleştirme'],dailyUse:'Bir işe başlayamadığında zihni tek çizgiye indirir.',microPractice:'Bakışını tek noktaya al ve yalnızca bir sonraki adımı söyle.'},
 {id:'heart',title:'Kalp Tapınağı',shenId:'shen',reward:'+12 zihin açıklığı · Shen',x:61,y:49,text:'Kalp farkındalığı, açıklık ve yumuşak temas.',benefits:['Göğüs açıklığı','İlişkide yumuşama','Canlılık'],dailyUse:'Konuşmadan önce tonu ve bedeni yumuşatır.',microPractice:'Dirsekleri gevşet. Göğsü zorlamadan genişlet.'},
 {id:'hun-forest',title:'Yenilenme Alanı · Hun',shenId:'hun',reward:'+9 canlılık · Qi',x:32,y:43,text:'Yön, vizyon ve akış cesareti.',benefits:['Yön duygusu','Akışa girme','İleri hareket'],dailyUse:'Önünü göremediğinde bedene rota hissi verir.',microPractice:'Bakışını ufka taşı. Kolları nefesle yana aç.'},
 {id:'pagoda',title:'12 Katlı Pagoda',reward:'+7 canlılık · Qi',x:53,y:31,text:'Nefesin ve ifadenin açıldığı boğaz geçidi.',benefits:['Nefes ritmi','Sakin ifade','Boyun gevşemesi'],dailyUse:'Cevap vermeden önce durmayı hatırlatır.',microPractice:'Çeneyi bırak. Nefes verirken boynun arkasını uzat.'},
 {id:'kunlun',title:'Kunlun Zirveleri',reward:'+15 zihin açıklığı · Shen',x:51,y:14,text:'Berraklık, üst merkez ve dönüş kapısı.',benefits:['Berrak bakış','Geniş perspektif','Sakin başlangıç'],dailyUse:'Yoğun günün sonunda olaylara uzaktan bakmayı sağlar.',microPractice:'Başının tepesinden yukarı uzan; omuzlarını ağırlaştır.'},
 {id:'po-lake',title:'Sakinleşme Alanı · Po',shenId:'po',reward:'+6 canlılık · Qi',x:28,y:61,text:'Nefes, beden hafızası ve bırakma alanı.',benefits:['Bırakma','Omuzlarda hafifleme','Duyum'],dailyUse:'Fazlalık taşıdığında omuz ve göğüs çevresini çözer.',microPractice:'Omuzlarını kulaklarına kaldır, nefes verirken serbest bırak.'},
];
