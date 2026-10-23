export const dailyShenQuestions = [
  { title: 'Bugün içinden en çok ne geçiyor?', answers: [{ label: 'Yeni bir yön bulmak', shen: 'hun' }, { label: 'Bağ kurmak', shen: 'shen' }, { label: 'Bir şeye odaklanmak', shen: 'yi' }, { label: 'Nefesimi hissetmek', shen: 'po' }, { label: 'Sakin bir güç toplamak', shen: 'zhi' }] },
  { title: 'Şu an en çok neye ihtiyacın var?', answers: [{ label: 'Alan ve hareket', shen: 'hun' }, { label: 'Sıcaklık ve açıklık', shen: 'shen' }, { label: 'Düzen ve netlik', shen: 'yi' }, { label: 'Dinlenme ve nefes', shen: 'po' }, { label: 'Sabır ve dayanıklılık', shen: 'zhi' }] },
  { title: 'Bugün pratiğin nasıl hissettirsin?', answers: [{ label: 'Özgürleştirici', shen: 'hun' }, { label: 'Canlandırıcı', shen: 'shen' }, { label: 'Toparlayıcı', shen: 'yi' }, { label: 'Yumuşatıcı', shen: 'po' }, { label: 'Kökleyici', shen: 'zhi' }] },
] as const;
export type DailyShenId = 'hun' | 'shen' | 'yi' | 'po' | 'zhi';
export function recommendDailyShen(answers: DailyShenId[]): DailyShenId {
  const scores: Record<DailyShenId, number> = { hun: 0, shen: 0, yi: 0, po: 0, zhi: 0 };
  answers.forEach((answer) => { scores[answer] += 1; });
  return (Object.keys(scores) as DailyShenId[]).sort((a, b) => scores[b] - scores[a])[0];
}
export function dailyShenDate() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
