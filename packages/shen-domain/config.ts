import type{BreathingPattern,ProgressGoal,ShenProfile,SoundAtmosphere}from'./types';

export const shenProfiles:ShenProfile[]=[
 {id:'hun',name:'Hun',element:'Ağaç',shortMeaning:'Yön ve büyüme',description:'Yeni yönlere alan açan, esneklik ve başlangıç enerjisini destekleyen çalışma alanı.',primaryColor:'#78936A',darkColor:'#20352B',lightColor:'#B7C99A',backgroundKey:'hun',practiceFocus:['açılma','genişleme','yön değiştirme','yumuşak uzanma'],movementQualities:['geniş','meraklı','akışkan','hafif'],breathingPatternIds:['breath-hun'],soundAtmosphereId:'sound-hun',reflectionQuestionIds:['hun-q1','hun-q2','hun-q3'],progressGoalIds:['hun-g1','hun-g2','hun-g3']},
 {id:'yi',name:'Yi',element:'Toprak',shortMeaning:'Merkez ve dikkat',description:'Niyeti sadeleştiren, kontrollü ağırlık aktarımı ve istikrarlı tekrar geliştiren çalışma alanı.',primaryColor:'#A9855D',darkColor:'#3C3025',lightColor:'#D2B98F',backgroundKey:'yi',practiceFocus:['merkezde kalma','kontrollü aktarım','tekrar','bilinçli geçiş'],movementQualities:['dengeli','ölçülü','kararlı','net'],breathingPatternIds:['breath-yi'],soundAtmosphereId:'sound-yi',reflectionQuestionIds:['yi-q1','yi-q2','yi-q3'],progressGoalIds:['yi-g1','yi-g2','yi-g3']},
 {id:'po',name:'Po',element:'Metal',shortMeaning:'Beden ve bırakma',description:'Nefese alan açan, gereksiz gerilimi azaltan ve bedensel duyumu netleştiren çalışma alanı.',primaryColor:'#8B9A9D',darkColor:'#273136',lightColor:'#C4CED0',backgroundKey:'po',practiceFocus:['gevşeme','omuzları bırakma','beden taraması','nefes alanı'],movementQualities:['sade','yumuşak','doğal','serbest'],breathingPatternIds:['breath-po'],soundAtmosphereId:'sound-po',reflectionQuestionIds:['po-q1','po-q2','po-q3'],progressGoalIds:['po-g1','po-g2','po-g3']},
 {id:'zhi',name:'Zhi',element:'Su',shortMeaning:'İrade ve derinlik',description:'Düşük tempoda devamlılık, sessiz odak ve kontrollü geçiş geliştiren çalışma alanı.',primaryColor:'#527181',darkColor:'#172631',lightColor:'#90B0BD',backgroundKey:'zhi',practiceFocus:['sabitlik','yavaş geçiş','sessiz odak','düzenli tekrar'],movementQualities:['derin','sakin','ağırbaşlı','sürekli'],breathingPatternIds:['breath-zhi'],soundAtmosphereId:'sound-zhi',reflectionQuestionIds:['zhi-q1','zhi-q2','zhi-q3'],progressGoalIds:['zhi-g1','zhi-g2','zhi-g3']},
 {id:'xin',name:'Xin / Shen',element:'Ateş',shortMeaning:'Bağ ve bütünlük',description:'Nefes ile bedeni birleştiren, sıcaklık, farkındalık ve doğal ifade geliştiren çalışma alanı.',primaryColor:'#B96B5A',darkColor:'#482724',lightColor:'#DDA59A',backgroundKey:'shen',practiceFocus:['bütünleştirme','nefes koordinasyonu','serbest akış','sakin kapanış'],movementQualities:['canlı','bütün','sıcak','uyumlu'],breathingPatternIds:['breath-xin'],soundAtmosphereId:'sound-xin',reflectionQuestionIds:['xin-q1','xin-q2','xin-q3'],progressGoalIds:['xin-g1','xin-g2','xin-g3']},
];

export const breathingPatterns:BreathingPattern[]=[
 {id:'breath-hun',shenId:'hun',name:'Alan açan nefes',inhaleSeconds:4,holdSeconds:2,exhaleSeconds:6,instruction:'4 saniye al, 2 saniye doğal bekle, 6 saniye ver.'},
 {id:'breath-yi',shenId:'yi',name:'Eşit merkez nefesi',inhaleSeconds:5,exhaleSeconds:5,instruction:'5 saniye al, 5 saniye ver; ritmi eşit tut.'},
 {id:'breath-po',shenId:'po',name:'Bırakma nefesi',inhaleSeconds:4,exhaleSeconds:7,instruction:'4 saniye al, 7 saniye ver; omuzların inişini izle.'},
 {id:'breath-zhi',shenId:'zhi',name:'Derin devamlılık',inhaleSeconds:5,holdSeconds:2,exhaleSeconds:7,instruction:'5 saniye al, 2 saniye bekle, 7 saniye ver.'},
 {id:'breath-xin',shenId:'xin',name:'Doğal uyum',natural:true,instruction:'Nefesi zorlamadan hareketle eşleştir.'},
];

export const progressGoals:ProgressGoal[]=[
 ['hun-g1','hun','Yeni hareket alanı','Haftada iki yeni hareket dene',2,'variety'],['hun-g2','hun','Yumuşak genişleme','Hareket genişliğini zorlamadan geliştir',3,'movement'],['hun-g3','hun','Hun çeşitliliği','Üç farklı Hun pratiği tamamla',3,'practice'],
 ['yi-g1','yi','Kesintisiz akış','Bir pratiği kesintisiz tamamla',1,'practice'],['yi-g2','yi','Üç günlük merkez','Üç gün kısa merkezlenme yap',3,'practice'],['yi-g3','yi','Kontrollü aktarım','Ağırlık aktarımını yavaşlat',3,'movement'],
 ['po-g1','po','Omuz alanı','Üç bırakma pratiği tamamla',3,'practice'],['po-g2','po','Nefes günlüğü','Bir hafta nefes farkındalığı kaydet',7,'reflection'],['po-g3','po','Az güç','Hareketleri daha az kasılmayla uygula',3,'movement'],
 ['zhi-g1','zhi','Yedi günlük devamlılık','Yedi günlük sakin seri oluştur',7,'practice'],['zhi-g2','zhi','Uzun akış','Uzun ve yavaş bir akış tamamla',20,'minutes'],['zhi-g3','zhi','Sabit ritim','Hız dalgalanmasını azalt',3,'movement'],
 ['xin-g1','xin','Nefes ve hareket','Nefes-hareket uyumunu geliştir',3,'breath'],['xin-g2','xin','Beş alan akışı','Beş Shen’den karma akış tamamla',5,'variety'],['xin-g3','xin','Kapanış kaydı','Pratik sonunda kısa kayıt oluştur',3,'reflection'],
].map(([id,shenId,title,description,target,metric])=>({id,shenId,title,description,target,metric} as ProgressGoal));

const atmosphere=(id:string,name:string,shenId:SoundAtmosphere['shenId'],layerNames:string[]):SoundAtmosphere=>({
 id,name,shenId,layers:layerNames.map((layer,index)=>({id:`${id}-${index+1}`,source:null,defaultVolume:index===0?.18:.08,loop:true,placeholder:true})),
});
export const soundAtmospheres:SoundAtmosphere[]=[
 atmosphere('sound-hun','Sabah bambusu','hun',['hafif rüzgâr','bambu','uzak kuşlar']),
 atmosphere('sound-yi','Toprak ritmi','yi',['düşük rüzgâr','uzak çan','düzenli tonal katman']),
 atmosphere('sound-po','Sessiz taş bahçesi','po',['uzak su','hafif sis dokusu','sessizlik']),
 atmosphere('sound-zhi','Derin gece suyu','zhi',['derin su','ay ışığı tonal katmanı','düşük ambient']),
 atmosphere('sound-xin','Sıcak sonbahar','xin',['sıcak rüzgâr','yapraklar','hafif telli doku']),
];

export const toDomainShenId=(id:string):ShenProfile['id']=>id==='shen'?'xin':shenProfiles.some(item=>item.id===id)?id as ShenProfile['id']:'xin';
export const toLegacyShenId=(id:ShenProfile['id'])=>id==='xin'?'shen':id;
export const getShenProfile=(id:string)=>shenProfiles.find(item=>item.id===toDomainShenId(id))??shenProfiles[4];

