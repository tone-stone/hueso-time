import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { Body, Screen } from '@/components/ui';

/**
 * Popup / redirect landing page for Google browser OAuth on web.
 * Must call maybeCompleteAuthSession before any navigation away.
 */
export default function OAuthRedirectScreen() {
  useEffect(() => {
    const result = WebBrowser.maybeCompleteAuthSession();
    if (__DEV__) {
      console.log('[Google OAuth] maybeCompleteAuthSession', result);
    }
  }, []);

  return (
    <Screen>
      <View style={styles.wrap}>
        <ActivityIndicator />
        <Body muted>Completando inicio de sesión…</Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
});
