import type{OnboardingProfile,OnboardingStage}from'./types';

export const onboardingStages:ReadonlyArray<{id:Exclude<OnboardingStage,'completed'>;label:string;title:string}>=[
 {id:'discover',label:'Tanışalım',title:'Sana nasıl seslenelim?'},
 {id:'profile',label:'Başlangıcın',title:'Hareketle ilişkin nasıl?'},
 {id:'body-scan',label:'Niyetin',title:'Bugün hayatında ne değişsin?'},
 {id:'first-movement',label:'Bedenin',title:'Bedeninde nereye alan açalım?'},
 {id:'first-plan',label:'Ritmin',title:'Sana eşlik edecek ritmi bulduk.'},
];

export const emptyOnboardingProfile:OnboardingProfile={name:'',experienceLevel:'none',practiceIntention:'calm',bodyFocus:'whole-body',standingCapacity:'5-15',protectedArea:'none',guidancePreference:'both'};

export const profileQuestions={
 experience:[{value:'none',label:'Hayır'},{value:'some',label:'Biraz'},{value:'regular',label:'Evet'}],
 standing:[{value:'1-5',label:'1–5 dakika'},{value:'5-15',label:'5–15 dakika'},{value:'15-plus',label:'15+ dakika'}],
 protected:[{value:'lower-back',label:'Bel'},{value:'knee',label:'Diz'},{value:'shoulder',label:'Omuz'},{value:'neck',label:'Boyun'},{value:'none',label:'Yok'}],
 guidance:[{value:'visual',label:'Görsel'},{value:'audio',label:'Sesli'},{value:'both',label:'İkisi birlikte'}],
 intention:[
  {value:'calm',label:'Zihnimi sakinleştirmek',note:'Günün yükünü bırakmak ve nefes almak'},
  {value:'energy',label:'Daha canlı hissetmek',note:'İçimde hareket ve yenilenme duygusu oluşturmak'},
  {value:'focus',label:'Dikkatimi toplamak',note:'Dağınıklığı azaltıp düzenli bir ritim kurmak'},
  {value:'resilience',label:'Daha sağlam hissetmek',note:'Zor günlerde sakin biçimde devam edebilmek'},
  {value:'connection',label:'Kendimle bağ kurmak',note:'Bedenimle daha sıcak ve bütün bir ilişki kurmak'},
 ],
 bodyFocus:[
  {value:'breath-shoulders',label:'Nefes ve omuzlar',note:'Omuzlarım yumuşasın, nefesim rahatlasın'},
  {value:'hips-sides',label:'Kalça ve yan beden',note:'Daha rahat dönmek ve akıcı hareket etmek'},
  {value:'center-balance',label:'Merkez ve denge',note:'Daha dengeli ve toparlanmış hissetmek'},
  {value:'back-knees-feet',label:'Bel, dizler ve ayaklar',note:'Zemine daha güvenli ve sağlam yerleşmek'},
  {value:'whole-body',label:'Bütün beden',note:'Tek bir bölge değil, genel olarak açılmak'},
 ],
}as const;

export const onboardingShenResults={
 hun:{name:'Hun',mode:'Yenilenme ritmi',title:'Senin ritmin: ileriye açılan hareket.',description:'Merak, canlılık ve yeni bir yön arıyorsun. Pratiklerinde akış, yan beden ve genişleyen hareketler sana iyi eşlik edecek.',symbol:'木'},
 shen:{name:'Shen',mode:'Bütünlük ritmi',title:'Senin ritmin: kendinle yeniden buluşmak.',description:'Bedeninle daha sıcak bir bağ ve günün içinde daha fazla açıklık arıyorsun. Pratiklerinde nefes, göğüs alanı ve yumuşak bütünlük öne çıkacak.',symbol:'火'},
 yi:{name:'Yi',mode:'Odak ritmi',title:'Senin ritmin: sade ve kararlı ilerlemek.',description:'Dağınıklığı azaltıp sürdürülebilir bir düzen kurmak istiyorsun. Pratiklerinde merkez, denge ve anlaşılır tekrarlar öne çıkacak.',symbol:'土'},
 po:{name:'Po',mode:'Bırakma ritmi',title:'Senin ritmin: yükü hafifletmek.',description:'Nefesine alan açmak ve bedendeki gereksiz gerginliği bırakmak istiyorsun. Pratiklerinde omuzlar, nefes ve yumuşama öne çıkacak.',symbol:'金'},
 zhi:{name:'Zhi',mode:'Köklenme ritmi',title:'Senin ritmin: sakin gücü korumak.',description:'Zor günlerde acele etmeden devam etmek ve daha sağlam hissetmek istiyorsun. Pratiklerinde ayaklar, dizler ve güvenli yerleşme öne çıkacak.',symbol:'水'},
}as const;
