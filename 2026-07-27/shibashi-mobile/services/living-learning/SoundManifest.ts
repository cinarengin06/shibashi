export type LivingSoundLayer='roomtone'|'birds'|'fabric'|'breath'|'instrumental';

export const bedroomSoundManifest:Record<LivingSoundLayer,string>={
 roomtone:'bedroom-roomtone.m4a',
 birds:'distant-birds.m4a',
 fabric:'fabric-lift.m4a',
 breath:'breath-tr.m4a',
 instrumental:'bedroom-instrumental.m4a',
};

// Dosyalar üretim lisanslarıyla birlikte assets/living-learning/audio altına
// eklendiğinde bu manifest expo-audio katmanına bağlanır. Eksik varlık varken
// arayüz ses çalıyormuş gibi davranmaz.
