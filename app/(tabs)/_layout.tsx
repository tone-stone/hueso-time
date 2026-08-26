import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/Glass';
import { useDesktopWeb } from '@/components/ui';
import Colors from '@/constants/Colors';
import { FontFamily } from '@/constants/Fonts';
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT, TAB_BAR_RADIUS, TAB_BAR_SIDE_GAP } from '@/lib/tabBarLayout';

const c = Colors.dark;

function TabBarBg() {
  return <GlassSurface radius={TAB_BAR_RADIUS} intensity={80} style={StyleSheet.absoluteFill} />;
}

export const unstable_settings = {
  initialRouteName: 'setlists',
};

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const desktopWeb = useDesktopWeb();

  return (
    <Tabs
      initialRouteName="setlists"
      tabBar={desktopWeb ? () => null : undefined}
      screenOptions={{
        tabBarActiveTintColor: c.tint,
        tabBarInactiveTintColor: c.tabIconDefault,
        headerShown: false,
        tabBarStyle: desktopWeb
          ? { height: 0, overflow: 'hidden', borderTopWidth: 0 }
          : [
              styles.tabBar,
              {
                bottom: insets.bottom + TAB_BAR_BOTTOM_GAP,
                left: TAB_BAR_SIDE_GAP,
                right: TAB_BAR_SIDE_GAP,
                height: TAB_BAR_HEIGHT,
              },
            ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: desktopWeb ? undefined : () => <TabBarBg />,
      }}>
      <Tabs.Screen
        name="setlists"
        options={{
          title: t('tabs.setlists'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <SymbolView
                name={{
                  ios: 'music.mic',
                  android: 'mic',
                  web: 'mic',
                }}
                tintColor={color}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.repertoire'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <SymbolView
                name={{ ios: 'music.note.list', android: 'queue_music', web: 'queue_music' }}
                tintColor={color}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <SymbolView
                name={{
                  ios: 'slider.horizontal.3',
                  android: 'tune',
                  web: 'tune',
                }}
                tintColor={color}
                size={22}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderRadius: TAB_BAR_RADIUS,
    overflow: 'hidden',
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
    fontFamily: FontFamily.display,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 26,
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,45,123,0.16)',
  },
});
