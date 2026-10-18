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
  display:48,
  h1:38,
  h2:30,
  h3:24,
  body:18,
  bodyCompact:16,
  button:17,
  label:14,
  small:13,
  caption:12,
};
export const fonts={
  display:'Inter_400Regular',
  displayRegular:'Inter_400Regular',
  displayMedium:'Inter_500Medium',
  displayStrong:'Inter_600SemiBold',
  sans:'Inter_400Regular',
  sansMedium:'Inter_500Medium',
  sansStrong:'Inter_600SemiBold',
  sansBold:'Inter_700Bold',
  metric:'Inter_600SemiBold',
  metricStrong:'Inter_700Bold',
};
