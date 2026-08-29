import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDesktopWeb } from '@/components/ui';

/**
 * Floating pill tab bar geometry — shared by app/(tabs)/_layout.tsx and its screens.
 *
 * Nocturne redesign: the bar is no longer edge-to-edge. It hugs its content and sits
 * centred, so four tabs fit without the bar spanning the screen (the active tab is the
 * only one that shows a label).
 */
export const TAB_BAR_HEIGHT = 50;
/** Only a minimum — the bar is centred and sized by its content, not stretched to this. */
export const TAB_BAR_SIDE_GAP = 16;
export const TAB_BAR_BOTTOM_GAP = 28;
export const TAB_BAR_RADIUS = 999;
/** Inner padding of the pill, around the tab items. */
export const TAB_BAR_PAD = 6;

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
