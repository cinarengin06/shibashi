import type{OnboardingProfile,OnboardingStage}from'./types';

export const onboardingStages:ReadonlyArray<{id:Exclude<OnboardingStage,'completed'>;label:string;title:string}>=[
 {id:'discover',label:'Shibashi’yi Keşfet',title:'Shibashi. 18 Hareket. Tek Bir Akış.'},
 {id:'profile',label:'Seni Tanıyalım',title:'Sana uygun yolu birlikte kuralım.'},
 {id:'body-scan',label:'İlk Beden İzin',title:'İlk beden izini oluşturalım.'},
 {id:'first-movement',label:'İlk Hareketini Dene',title:'İlk hareketini dene.'},
 {id:'first-plan',label:'Sana Özel İlk Yolun',title:'İlk 7 günlük yolculuğun hazır.'},
];

export const emptyOnboardingProfile:OnboardingProfile={experienceLevel:'none',standingCapacity:'5-15',protectedArea:'none',guidancePreference:'both'};

export const profileQuestions={
 experience:[{value:'none',label:'Hayır'},{value:'some',label:'Biraz'},{value:'regular',label:'Evet'}],
 standing:[{value:'1-5',label:'1–5 dakika'},{value:'5-15',label:'5–15 dakika'},{value:'15-plus',label:'15+ dakika'}],
 protected:[{value:'lower-back',label:'Bel'},{value:'knee',label:'Diz'},{value:'shoulder',label:'Omuz'},{value:'neck',label:'Boyun'},{value:'none',label:'Yok'}],
 guidance:[{value:'visual',label:'Görsel'},{value:'audio',label:'Sesli'},{value:'both',label:'İkisi birlikte'}],
}as const;

