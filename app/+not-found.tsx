import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen, useThemeColors } from '@/components/ui';

export default function NotFoundScreen() {
  const c = useThemeColors();
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={[styles.title, { color: c.text }]}>This screen doesn't exist.</Text>
        <Link href="/(tabs)/setlists" style={styles.link}>
          <Text style={[styles.linkText, { color: c.tint }]}>Go to setlists</Text>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
