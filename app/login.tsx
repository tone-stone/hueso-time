import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import type { AuthSessionResult } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';

import {
  Body,
  BrandMark,
  Divider,
  GhostButton,
  PrimaryButton,
  Screen,
  useThemeColors,
} from '@/components/ui';
import { FontFamily } from '@/constants/Fonts';
import { useAuth } from '@/context/AuthContext';
import { getGoogleClientConfig, isAuthSkipped } from '@/lib/googleAuth';
import { getGoogleBrowserRedirectUri } from '@/lib/googleRedirect';
import {
  canUseNativeGoogleSignIn,
  signInWithNativeGoogle,
} from '@/lib/googleNativeSignIn';

type Clients = ReturnType<typeof getGoogleClientConfig>;

/** Browser OAuth (Expo Go / web) needs the platform-specific client id. */
function hasBrowserClientIds(clients: Clients) {
  if (Platform.OS === 'ios') return !!clients.iosClientId;
  if (Platform.OS === 'android') return !!clients.androidClientId;
  return !!clients.webClientId;
}

function showAuthAlert(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function LoginScreen() {
  const clients = getGoogleClientConfig();
  const useNative = canUseNativeGoogleSignIn();
  const browserReady = !useNative && hasBrowserClientIds(clients);

  // Native path never mounts the Google auth-session hook.
  if (useNative) {
    return <LoginUI useNative promptAsync={null} requestReady />;
  }

  if (!browserReady) {
    return <LoginUI useNative={false} promptAsync={null} requestReady={false} />;
  }

  return <LoginWithBrowserAuth clients={clients} />;
}

function LoginWithBrowserAuth({ clients }: { clients: Clients }) {
  // Must match Authorized redirect URIs on the Google Cloud *Web* OAuth client.
  // Web local → http://localhost:8081/oauth  |  native fallback → huesotime://oauth
  const redirectUri = getGoogleBrowserRedirectUri();

  const [request, , promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId: clients.webClientId,
      iosClientId: clients.iosClientId,
      androidClientId: clients.androidClientId,
      selectAccount: true,
      redirectUri,
    },
    { scheme: 'huesotime', path: 'oauth', native: 'huesotime://oauth' },
  );

  useEffect(() => {
    if (__DEV__) {
      console.log('[Google OAuth] redirectUri =', redirectUri);
    }
  }, [redirectUri]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  return (
    <LoginUI
      useNative={false}
      promptAsync={promptAsync}
      requestReady={!!request}
    />
  );
}

type LoginUIProps = {
  useNative: boolean;
  promptAsync: null | (() => Promise<AuthSessionResult>);
  requestReady: boolean;
};

function LoginUI({ useNative, promptAsync, requestReady }: LoginUIProps) {
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
  const platformConfigured = useNative
    ? googleConfigured
    : hasBrowserClientIds(clients);

  async function onGooglePress() {
    if (!platformConfigured) {
      showAuthAlert(t('auth.errorTitle'), t('auth.missingConfig'));
      return;
    }

    setBusy(true);
    try {
      let idToken: string;
      if (useNative) {
        idToken = await signInWithNativeGoogle();
      } else {
        if (!promptAsync) {
          showAuthAlert(t('auth.errorTitle'), t('auth.missingConfig'));
          return;
        }
        const result = await promptAsync();
        if (result.type !== 'success') {
          if (result.type !== 'dismiss' && result.type !== 'cancel') {
            showAuthAlert(t('auth.errorTitle'), t('auth.errorGeneric'));
          }
          return;
        }
        idToken = result.params.id_token;
        if (!idToken) {
          showAuthAlert(t('auth.errorTitle'), t('auth.errorGeneric'));
          return;
        }
      }
      await completeGoogleSignIn(idToken);
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : 'error';
      if (code === 'cancelled') return;
      if (code === 'gmail_required') {
        showAuthAlert(t('auth.errorTitle'), t('auth.gmailOnly'));
      } else if (code === 'play_services') {
        showAuthAlert(t('auth.errorTitle'), t('auth.playServices'));
      } else if (code === 'missing_config') {
        showAuthAlert(t('auth.errorTitle'), t('auth.missingConfig'));
      } else if (code === 'developer_error') {
        showAuthAlert(t('auth.errorTitle'), t('auth.developerError'));
      } else if (code === 'token_expired') {
        showAuthAlert(t('auth.errorTitle'), t('auth.tokenExpired'));
      } else {
        showAuthAlert(t('auth.errorTitle'), t('auth.errorGeneric'));
      }
    } finally {
      setBusy(false);
    }
  }

  if (ready && canAccessApp) {
    return <Redirect href="/(tabs)/generate" />;
  }

  return (
    <Screen>
      <View style={styles.stage}>
        <View style={[styles.panel, Platform.OS === 'web' && styles.panelWeb]}>
          <View style={styles.glowWrap} pointerEvents="none">
            <View style={[styles.glowRing, styles.glowOuter, { backgroundColor: c.tintFaint }]} />
            <View style={[styles.glowRing, styles.glowMid, { backgroundColor: c.tintGlow }]} />
            <View style={[styles.glowRing, styles.glowInner, { backgroundColor: c.tintSoft }]} />
          </View>

          <BrandMark size="hero" showWave={false} />

          <Text style={[styles.headline, { color: c.text }]}>{t('auth.heroTitle')}</Text>
          <Text style={[styles.heroBody, { color: c.textMuted }]}>{t('auth.subtitle')}</Text>

          {!platformConfigured ? (
            <View style={[styles.banner, { borderColor: c.border, backgroundColor: c.surface }]}>
              <Body muted align="center">
                {t('auth.missingConfig')}
              </Body>
            </View>
          ) : null}

          {busy ? (
            <ActivityIndicator color={c.tint} style={{ marginTop: 24 }} />
          ) : (
            <View style={styles.actions}>
              <PrimaryButton
                label={t('auth.continueGoogle')}
                onPress={() => void onGooglePress()}
                disabled={(!useNative && !requestReady) || !platformConfigured}
              />
              {skipAuth ? (
                <GhostButton label={t('auth.continueGuest')} onPress={enterAsGuest} />
              ) : (
                <Body muted align="center">
                  {t('auth.gmailHint')}
                </Body>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <Divider />
            <Text style={[styles.footerText, { color: c.textFaint }]}>{t('auth.footerLinks')}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const GLOW_SIZE = 420;

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  panel: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  panelWeb: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    backgroundColor: 'rgba(18,18,32,0.78)',
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  glowWrap: {
    position: 'absolute',
    top: -140,
    left: '50%',
    marginLeft: -GLOW_SIZE / 2,
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOuter: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  glowMid: {
    width: GLOW_SIZE * 0.62,
    height: GLOW_SIZE * 0.62,
  },
  glowInner: {
    width: GLOW_SIZE * 0.33,
    height: GLOW_SIZE * 0.33,
  },
  headline: {
    marginTop: 14,
    fontSize: 31,
    fontWeight: '500',
    letterSpacing: -0.81,
    lineHeight: 36,
    textAlign: 'center',
    fontFamily: FontFamily.display,
  },
  heroBody: {
    marginTop: 10,
    maxWidth: 280,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  banner: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  actions: {
    marginTop: 28,
    gap: 12,
    width: '100%',
    alignItems: 'stretch',
  },
  footer: {
    marginTop: 26,
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    fontSize: 11.5,
  },
});
