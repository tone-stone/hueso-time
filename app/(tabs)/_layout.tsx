import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { type ColorValue, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
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
  TAB_BAR_PAD,
  TAB_BAR_RADIUS,
  tabBarPillWidth,
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
 * The four tabs are equal-width slots (React Navigation distributes them evenly), each an
 * icon over its label. Focus is shown by tint alone — accent icon + label vs. muted — so
 * nothing changes width and the icons stay evenly spaced. The pill's width is responsive:
 * near full-bleed on phones, capped to a pill on tablets and in landscape.
 */
export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const desktopWeb = useDesktopWeb();
  const { width } = useWindowDimensions();

  const isTablet = width >= TABLET_MIN_WIDTH;
  const pillWidth = tabBarPillWidth(width);
  // Centre the pill by hand: `alignSelf` does not centre a position:absolute bar.
  const pillLeft = Math.max(0, Math.round((width - pillWidth) / 2));
  const iconSize = isTablet ? 24 : 22;

  /** SF Symbol on iOS, Material Symbol on Android/web — kept centred in a fixed box. */
  const icon =
    (name: SymbolViewProps['name']) =>
    ({ color }: { color: ColorValue }) => (
      <View style={styles.iconBox}>
        <SymbolView name={name} tintColor={color as string} size={iconSize} />
      </View>
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
        tabBarIconStyle: styles.iconStyle,
        tabBarAllowFontScaling: false,
        tabBarStyle: desktopWeb
          ? { height: 0, overflow: 'hidden', borderTopWidth: 0 }
          : [
              styles.tabBar,
              {
                width: pillWidth,
                left: pillLeft,
                bottom: insets.bottom + TAB_BAR_BOTTOM_GAP,
                height: TAB_BAR_HEIGHT,
              },
            ],
        tabBarItemStyle: styles.tabBarItem,
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
    // Width-capped pill; `width` and `left` are set inline (responsive + hand-centred).
    paddingTop: 8,
    paddingBottom: 6,
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
  tabBarItem: {
    // Four equal slots — this is what keeps the icons evenly distributed.
    flex: 1,
    paddingHorizontal: 0,
  },
  iconStyle: {
    // Give the icon its own row above the label; keep it from eating label space.
    flex: 0,
    height: 26,
    marginTop: Platform.OS === 'ios' ? 2 : 0,
  },
  iconBox: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    // SpaceMono is wide; 10 keeps "Repertorio" on one line in a phone-width slot.
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: -0.3,
    fontFamily: FontFamily.display,
    marginTop: 1,
  },
  labelTablet: {
    fontSize: 12.5,
    letterSpacing: -0.1,
  },
});
