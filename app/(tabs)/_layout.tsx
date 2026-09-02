import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { type ColorValue, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/Glass';
import { useDesktopWeb } from '@/components/ui';
import Colors from '@/constants/Colors';
import { FontFamily } from '@/constants/Fonts';
import {
  TABLET_MIN_WIDTH,
  TAB_BAR_BOTTOM_GAP,
  TAB_BAR_HEIGHT,
  TAB_BAR_MAX_WIDTH,
  TAB_BAR_PAD,
  TAB_BAR_RADIUS,
  TAB_BAR_SIDE_GAP,
} from '@/lib/tabBarLayout';

const c = Colors.dark;

function TabBarBg() {
  return <GlassSurface radius={TAB_BAR_RADIUS} intensity={80} style={StyleSheet.absoluteFill} />;
}

export const unstable_settings = {
  initialRouteName: 'generate',
};

/**
 * Nocturne redesign — a centred floating glass pill.
 *
 * React Navigation owns the icon-over-label layout and the equal-width distribution of
 * the four tabs. The pill is positioned with `left`/`right` insets (never an explicit
 * pixel width): on phones it is near-full-bleed, on tablets it is inset to sit centred
 * at ~TAB_BAR_MAX_WIDTH. Letting flexbox derive the real width from those insets is what
 * keeps the labels from truncating when `useWindowDimensions()` reports 0 on first frame.
 */
export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const desktopWeb = useDesktopWeb();
  const { width } = useWindowDimensions();

  const isTablet = width >= TABLET_MIN_WIDTH;
  // On tablets, inset each side so the pill lands centred at roughly TAB_BAR_MAX_WIDTH;
  // Math.max keeps it sane if `width` is momentarily 0 on first render.
  const sideInset = isTablet
    ? Math.max(TAB_BAR_SIDE_GAP, Math.round((width - TAB_BAR_MAX_WIDTH) / 2))
    : 10;
  const iconSize = isTablet ? 24 : 21;

  /** SF Symbol on iOS, Material Symbol on Android/web. */
  const icon =
    (name: SymbolViewProps['name']) =>
    ({ color }: { color: ColorValue }) => (
      <SymbolView name={name} tintColor={color as string} size={iconSize} />
    );

  return (
    <Tabs
      initialRouteName="generate"
      tabBar={desktopWeb ? () => null : undefined}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: c.tabIconSelected,
        tabBarInactiveTintColor: c.tabIconDefault,
        tabBarLabelStyle: [styles.label, isTablet && styles.labelTablet],
        tabBarStyle: desktopWeb
          ? { height: 0, overflow: 'hidden', borderTopWidth: 0 }
          : [
              styles.tabBar,
              {
                left: sideInset,
                right: sideInset,
                bottom: insets.bottom + TAB_BAR_BOTTOM_GAP,
                height: TAB_BAR_HEIGHT,
              },
            ],
        tabBarBackground: desktopWeb ? undefined : () => <TabBarBg />,
      }}>
      <Tabs.Screen
        name="generate"
        options={{
          title: t('tabs.generate'),
          tabBarIcon: icon({ ios: 'shuffle', android: 'shuffle', web: 'shuffle' }),
        }}
      />
      <Tabs.Screen
        name="setlists"
        options={{
          title: t('tabs.setlists'),
          tabBarIcon: icon({ ios: 'music.mic', android: 'mic', web: 'mic' }),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.repertoire'),
          tabBarIcon: icon({ ios: 'music.note.list', android: 'queue_music', web: 'queue_music' }),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: icon({ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    // Positioned by `left`/`right` (set inline) — no explicit width.
    paddingVertical: 6,
    paddingHorizontal: TAB_BAR_PAD,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderRadius: TAB_BAR_RADIUS,
    overflow: 'hidden',
    elevation: 0,
    // Nocturne elevation on a dark ground: an edge plus ambient darkness.
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 14 },
  },
  label: {
    // Poppins is proportional and ~system width, so the async font swap doesn't reflow
    // wide enough to truncate (the old mono display font did).
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0,
  },
  labelTablet: {
    fontSize: 12.5,
  },
});
