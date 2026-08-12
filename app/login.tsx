import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';

import {
  Body,
  BrandMark,
  GhostButton,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getGoogleClientConfig, isAuthSkipped } from '@/lib/googleAuth';
import {
  canUseNativeGoogleSignIn,
  signInWithNativeGoogle,
} from '@/lib/googleNativeSignIn';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const {
    ready,
    canAccessApp,
    googleConfigured,
    completeGoogleSignIn,
    enterAsGuest,
  } = useAuth();
  const [busy, setBusy] = useState(false);
  const clients = getGoogleClientConfig();
  const skipAuth = isAuthSkipped();
  const useNative = canUseNativeGoogleSignIn();

  // Fallback for web / Expo Go (browser OAuth)
  const [request, , promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId: clients.webClientId,
      iosClientId: clients.iosClientId,
      androidClientId: clients.androidClientId,
      selectAccount: true,
    },
    { scheme: 'huesotime', path: 'oauth' },
  );

  useEffect(() => {
    if (Platform.OS === 'web' || useNative) return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, [useNative]);

  async function onGooglePress() {
    if (!googleConfigured) {
      Alert.alert(t('auth.errorTitle'), t('auth.missingConfig'));
      return;
    }

    setBusy(true);
    try {
      let idToken: string;
      if (useNative) {
        idToken = await signInWithNativeGoogle();
      } else {
        const result = await promptAsync();
        if (result.type !== 'success') {
          if (result.type !== 'dismiss' && result.type !== 'cancel') {
            Alert.alert(t('auth.errorTitle'), t('auth.errorGeneric'));
          }
          return;
        }
        idToken = result.params.id_token;
        if (!idToken) {
          Alert.alert(t('auth.errorTitle'), t('auth.errorGeneric'));
          return;
        }
      }
      await completeGoogleSignIn(idToken);
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : 'error';
      if (code === 'cancelled') return;
      if (code === 'gmail_required') {
        Alert.alert(t('auth.errorTitle'), t('auth.gmailOnly'));
      } else if (code === 'play_services') {
        Alert.alert(t('auth.errorTitle'), t('auth.playServices'));
      } else if (code === 'missing_config') {
        Alert.alert(t('auth.errorTitle'), t('auth.missingConfig'));
      } else if (code === 'token_expired') {
        Alert.alert(t('auth.errorTitle'), t('auth.tokenExpired'));
      } else {
        Alert.alert(t('auth.errorTitle'), t('auth.errorGeneric'));
      }
    } finally {
      setBusy(false);
    }
  }

  if (ready && canAccessApp) {
    return <Redirect href="/(tabs)/setlists" />;
  }

  return (
    <Screen>
      <View style={styles.wrap}>
        <BrandMark subtitle={t('auth.tagline')} />
        <Title>{t('auth.title')}</Title>
        <Subtitle>{t('auth.subtitle')}</Subtitle>

        {!googleConfigured ? (
          <View style={[styles.banner, { borderColor: c.border, backgroundColor: c.surface }]}>
            <Body muted>{t('auth.missingConfig')}</Body>
          </View>
        ) : null}

        {busy ? (
          <ActivityIndicator color={c.tint} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.actions}>
            <PrimaryButton
              label={t('auth.continueGoogle')}
              onPress={() => void onGooglePress()}
              disabled={(!useNative && !request) || !googleConfigured}
            />
            {skipAuth ? (
              <GhostButton label={t('auth.continueGuest')} onPress={enterAsGuest} />
            ) : (
              <Body muted>{t('auth.gmailHint')}</Body>
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    justifyContent: 'center',
  },
  banner: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  actions: {
    marginTop: 28,
    gap: 12,
  },
});
