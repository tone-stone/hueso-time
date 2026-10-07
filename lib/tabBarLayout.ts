import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDesktopWeb } from '@/components/ui';

/**
 * Floating pill tab bar geometry — shared by app/(tabs)/_layout.tsx and its screens.
 *
 * Nocturne redesign: the bar is a centred floating pill, never edge-to-edge. Its four
 * tabs are equal-width slots (icon over label) so the icons stay evenly distributed on
 * any screen. The pill is positioned by `left`/`right` insets in the layout (no explicit
 * pixel width), so a first-frame `useWindowDimensions()` of 0 can't collapse it.
 */
export const TAB_BAR_HEIGHT = 62;
/** Side inset used on tablets (phones use a smaller fixed inset). */
export const TAB_BAR_SIDE_GAP = 16;
export const TAB_BAR_BOTTOM_GAP = 28;
export const TAB_BAR_RADIUS = 999;
/** Inner padding of the pill, around the tab items. */
export const TAB_BAR_PAD = 6;
/** Width the pill is inset to on wide screens (tablets, landscape) so it stays a pill. */
export const TAB_BAR_MAX_WIDTH = 480;
/** Below this width the layout is a phone; at/above it we treat the device as a tablet. */
export const TABLET_MIN_WIDTH = 768;

/**
 * Extra bottom padding mobile tab screens need on their scroll content so the last
 * item clears the floating tab bar (0 on desktop web, where there's a top nav instead).
 *
 * Do NOT fade content out behind the pill with a gradient overlay — the pill's own blur
 * is the separation. A gradient sibling paints over action bars and clips them.
 */
export function useFloatingTabBarInset() {
  const insets = useSafeAreaInsets();
  const desktopWeb = useDesktopWeb();
  if (desktopWeb) return 0;
  return TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_GAP + insets.bottom;
}
