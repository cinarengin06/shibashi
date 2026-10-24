const postureAudioByCue:Record<string,string>={
  'Ön görünüm. Kameraya dön. Ayaklarını kalça genişliğinde aç ve kollarını rahat bırak.':'postur-web-on',
  'Şimdi sağ yanını kameraya dön. Başını doğal konumda tut ve kollarını rahat bırak.':'postur-web-yan',
  'Şimdi arkanı kameraya dön. Ağırlığını iki ayağına eşit dağıt ve doğal dur.':'postur-web-arka',
  'Laptop ekranını sabitle. Başınla ayakların aynı karede görünene kadar biraz geri çekil.':'postur-web-kadraj',
  'Kadrajdaki beden kılavuzunun ortasında kal.':'postur-web-ortada',
  'Bir adım geri git.':'postur-web-geri',
  'Kameraya yarım adım yaklaş.':'postur-web-yaklas',
  'Biraz sağa geç.':'postur-web-saga-gec',
  'Biraz sola geç.':'postur-web-sola-gec',
  'Çeneni hafifçe geriye al. Başını omuzunun üzerinde tut.':'postur-web-cene',
  'Göğsünü kaldırmadan gövdeni dikey hatta getir.':'postur-web-dikey',
  'Kalçanı ayak bileğinin üzerinde hizala.':'postur-web-kalca',
  'Sol omzunu biraz indir.':'postur-web-sol-omuz',
  'Sağ omzunu biraz indir.':'postur-web-sag-omuz',
  'Omuzlarını aynı yüksekliğe getir.':'postur-web-omuzlar',
  'Ağırlığını iki ayağına eşit dağıt.':'postur-web-agirlik',
  'Gövdeni hafifçe sola taşı.':'postur-web-govde-sola',
  'Gövdeni hafifçe sağa taşı.':'postur-web-govde-saga',
  'Duruşun dengeli. Nefesini değiştirmeden sabit kal.':'postur-web-dengeli',
};

export function getPostureAudioSrc(cue:string):string|undefined{
  const file=postureAudioByCue[cue];
  return file?`/audio/posture-web/${file}.mp3`:undefined;
}
