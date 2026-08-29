import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/Glass';
import { useDesktopWeb } from '@/components/ui';
import Colors from '@/constants/Colors';
import { FontFamily } from '@/constants/Fonts';
import {
  TAB_BAR_BOTTOM_GAP,
  TAB_BAR_HEIGHT,
  TAB_BAR_PAD,
  TAB_BAR_RADIUS,
} from '@/lib/tabBarLayout';

const c = Colors.dark;

function TabBarBg() {
  return <GlassSurface radius={TAB_BAR_RADIUS} intensity={80} style={StyleSheet.absoluteFill} />;
}

export const unstable_settings = {
  initialRouteName: 'generate',
};

/**
 * Nocturne redesign — a floating glass pill.
 *
 * Two things make it read as floating rather than docked: it is centred and sized by its
 * own content (never edge-to-edge), and only the FOCUSED tab shows its label, inside an
 * accent-tinted inner pill. Unfocused tabs are icon-only, which is what lets four tabs
 * fit in about 300 px.
 *
 * The screens keep their own bottom inset via useFloatingTabBarInset(); nothing scrolls
 * under the pill, so there is no fade overlay.
 */
export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const desktopWeb = useDesktopWeb();

  /** One item renderer for all four tabs: icon always, label only when focused. */
  const item =
    (
      symbols: { ios: string; android: string; web: string },
      label: string,
    ) =>
    ({ focused }: { focused: boolean; color: string }) => (
      <View style={[styles.item, focused && styles.itemActive]}>
        <SymbolView
          name={symbols}
          tintColor={focused ? c.tabIconSelected : c.tabIconDefault}
          size={20}
        />
        {focused ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    );

  return (
    <Tabs
      initialRouteName="generate"
      tabBar={desktopWeb ? () => null : undefined}
      screenOptions={{
        headerShown: false,
        // The label lives inside tabBarIcon so it can sit beside the icon in the pill.
        tabBarShowLabel: false,
        tabBarActiveTintColor: c.tabIconSelected,
        tabBarInactiveTintColor: c.tabIconDefault,
        tabBarStyle: desktopWeb
          ? { height: 0, overflow: 'hidden', borderTopWidth: 0 }
          : [
              styles.tabBar,
              {
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
          tabBarIcon: item(
            { ios: 'shuffle', android: 'shuffle', web: 'shuffle' },
            t('tabs.generate'),
          ),
        }}
      />
      <Tabs.Screen
        name="setlists"
        options={{
          title: t('tabs.setlists'),
          tabBarIcon: item(
            { ios: 'music.mic', android: 'mic', web: 'mic' },
            t('tabs.setlists'),
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.repertoire'),
          tabBarIcon: item(
            { ios: 'music.note.list', android: 'queue_music', web: 'queue_music' },
            t('tabs.repertoire'),
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: item(
            { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
            t('tabs.settings'),
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    // Centred and content-sized: this is what makes it a pill instead of a bar.
    alignSelf: 'center',
    left: undefined,
    right: undefined,
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
    // Let each item be as wide as its content (icon, or icon + label when focused).
    flex: 0,
    width: 'auto',
    paddingHorizontal: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minWidth: 40,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  itemActive: {
    backgroundColor: c.tintSoft,
    paddingHorizontal: 15,
  },
  label: {
    color: c.tabIconSelected,
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: -0.1,
    fontFamily: FontFamily.display,
  },
});
