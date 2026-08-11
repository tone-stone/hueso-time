import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/Colors';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

const c = Colors.dark;

function TabBarBg() {
  return (
    <LinearGradient
      colors={['#0C0E14', '#090A0F']}
      style={StyleSheet.absoluteFill}
    />
  );
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.tint,
        tabBarInactiveTintColor: c.tabIconDefault,
        headerShown: useClientOnlyValue(false, true),
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <TabBarBg />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.repertoire'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <SymbolView
                name={{ ios: 'music.note.list', android: 'queue_music', web: 'queue_music' }}
                tintColor={color}
                size={24}
              />
            </View>
          ),
        }}
      />
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
                size={24}
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
                size={24}
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
    borderTopColor: 'rgba(255,107,74,0.25)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 28,
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,107,74,0.14)',
  },
});
