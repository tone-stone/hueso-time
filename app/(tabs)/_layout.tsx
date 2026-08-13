import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDesktopWeb } from '@/components/ui';
import Colors from '@/constants/Colors';

const c = Colors.dark;

export const unstable_settings = {
  initialRouteName: 'setlists',
};

function TabBarBg() {
  return (
    <LinearGradient
      colors={['#12121E', '#0A0A14']}
      style={StyleSheet.absoluteFill}
    />
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const desktopWeb = useDesktopWeb();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 4);
  const tabBarHeight = 52 + bottomPad;

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
                height: tabBarHeight,
                paddingBottom: bottomPad,
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
    backgroundColor: c.tabBar,
    borderTopColor: 'rgba(255,45,123,0.28)',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
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
