import {palette,spacing as sharedSpacing,radii as sharedRadii} from '../../../packages/design-tokens';

export const colors = {
  ink:palette.background, deep:palette.backgroundSecondary, surface:palette.card, surface2:palette.pressed,
  cream:palette.text, muted:palette.textSecondary, gold:palette.gold, amber:'#D8C4A2',
  ivory:palette.ivory,
  jade:palette.success, line:palette.border, danger:palette.destructive,
  white:'rgba(242,238,231,0.94)',
};
export const spacing={xs:sharedSpacing.x1,sm:sharedSpacing.x2,md:sharedSpacing.x4,lg:sharedSpacing.x6,xl:sharedSpacing.x8,xxl:sharedSpacing.x12};
export const radii={sm:12,md:sharedRadii.control,lg:sharedRadii.cardLarge,pill:sharedRadii.round};
export const type={
  display:42,
  h1:34,
  h2:27,
  h3:22,
  body:17,
  bodyCompact:15,
  button:16,
  label:14,
  small:13,
  caption:12,
};
export const fonts={
  display:'Newsreader_400Regular',
  displayRegular:'Newsreader_400Regular',
  displayMedium:'Newsreader_500Medium',
  displayStrong:'Newsreader_600SemiBold',
  sans:'SourceSans3_400Regular',
  sansMedium:'SourceSans3_500Medium',
  sansStrong:'SourceSans3_600SemiBold',
  sansBold:'SourceSans3_700Bold',
  metric:'Manrope_600SemiBold',
  metricStrong:'Manrope_700Bold',
};
