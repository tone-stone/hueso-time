import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDesktopWeb } from '@/components/ui';

/**
 * Floating pill tab bar geometry — shared by app/(tabs)/_layout.tsx and its screens.
 *
 * Nocturne redesign: the bar is a centred floating pill, never edge-to-edge. Its four
 * tabs are equal-width slots (icon over label) so the icons stay evenly distributed on
 * any screen; the pill's own width is responsive (see tabBarPillWidth).
 */
export const TAB_BAR_HEIGHT = 62;
/** Gap between the pill and the screen edges — also the phone side inset. */
export const TAB_BAR_SIDE_GAP = 16;
export const TAB_BAR_BOTTOM_GAP = 28;
export const TAB_BAR_RADIUS = 999;
/** Inner padding of the pill, around the tab items. */
export const TAB_BAR_PAD = 6;
/** Width the pill caps at on wide screens (tablets, landscape) so it stays a pill. */
export const TAB_BAR_MAX_WIDTH = 480;
/** Below this width the layout is a phone; at/above it we treat the device as a tablet. */
export const TABLET_MIN_WIDTH = 768;

/**
 * Responsive width of the floating pill for a given viewport width. Phones get an
 * almost-full-bleed pill (edges minus the side gap); tablets and landscape cap at
 * TAB_BAR_MAX_WIDTH so the bar never stretches into a full-width bar again.
 */
export function tabBarPillWidth(windowWidth: number) {
  // Phones get an almost-full-bleed pill (only a small edge inset) so the four labels
  // have room; tablets/landscape cap at TAB_BAR_MAX_WIDTH to stay a pill.
  const edge = windowWidth >= TABLET_MIN_WIDTH ? TAB_BAR_SIDE_GAP : 10;
  const available = windowWidth - edge * 2;
  return Math.round(Math.min(available, TAB_BAR_MAX_WIDTH));
}

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
