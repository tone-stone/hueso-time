import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDesktopWeb } from '@/components/ui';

/** Floating pill tab bar geometry — shared by app/(tabs)/_layout.tsx and its screens. */
export const TAB_BAR_HEIGHT = 60;
export const TAB_BAR_SIDE_GAP = 16;
export const TAB_BAR_BOTTOM_GAP = 14;
export const TAB_BAR_RADIUS = 28;

/**
 * Extra bottom padding mobile tab screens need on their scroll content so the last
 * item clears the floating tab bar (0 on desktop web, where there's a top nav instead).
 */
export function useFloatingTabBarInset() {
  const insets = useSafeAreaInsets();
  const desktopWeb = useDesktopWeb();
  if (desktopWeb) return 0;
  return TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_GAP + insets.bottom;
}
