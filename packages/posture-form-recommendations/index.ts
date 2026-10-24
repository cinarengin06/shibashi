export type PostureRegionScores = {
  shoulderScore: number;
  axisScore: number;
  hipScore: number;
};

export type PostureFormRecommendation = {
  order: number;
  focus: string;
  reason: string;
};

const formForRegion = {
  shoulderScore: { order: 2, focus: 'Omuz hattı', reason: 'Omuzlarını zorlamadan açıp rahatça hareket ettirmeyi çalış.' },
  axisScore: { order: 1, focus: 'Gövde ekseni', reason: 'Nefesle yükselirken baş ve gövde hizanı fark et.' },
  hipScore: { order: 7, focus: 'Kalça dengesi', reason: 'Kalçadan yumuşakça katlanırken gövde uzunluğunu koru.' },
} as const;

export function recommendFormsForPosture(captures: PostureRegionScores[]): PostureFormRecommendation[] {
  if (!captures.length) return [];
  const regions = (Object.keys(formForRegion) as Array<keyof PostureRegionScores>)
    .map(key => {
      const values = captures.map(capture => capture[key]).filter(value => Number.isFinite(value) && value >= 0 && value <= 100);
      return { key, score: values.length === captures.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null };
    })
    .filter((region): region is { key: keyof PostureRegionScores; score: number } => region.score !== null)
    .sort((a, b) => a.score - b.score);
  return regions.slice(0, 2).map(region => formForRegion[region.key]);
}
