import {palette,spacing as sharedSpacing,radii as sharedRadii} from '../../../packages/design-tokens';

export const colors = {
  ink:palette.background, deep:palette.backgroundSecondary, surface:palette.card, surface2:palette.pressed,
  cream:palette.text, muted:palette.textSecondary, gold:palette.gold, amber:'#D8C4A2',
  jade:palette.success, line:palette.border, danger:palette.destructive,
  white:'rgba(242,238,231,0.94)',
};
export const spacing={xs:sharedSpacing.x1,sm:sharedSpacing.x2,md:sharedSpacing.x4,lg:sharedSpacing.x6,xl:sharedSpacing.x8,xxl:sharedSpacing.x12};
export const radii={sm:12,md:sharedRadii.control,lg:sharedRadii.cardLarge,pill:sharedRadii.round};
export const type={display:40,h1:30,h2:22,body:16,small:13};
export const fonts={display:'DMSerifDisplay_400Regular',displayRegular:'DMSerifDisplay_400Regular',displayStrong:'DMSerifDisplay_400Regular',sans:'Inter_400Regular',sansMedium:'Inter_500Medium',sansStrong:'Inter_600SemiBold',sansBold:'Inter_700Bold',metric:'Manrope_600SemiBold',metricStrong:'Manrope_700Bold'};
