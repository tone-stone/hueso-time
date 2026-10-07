import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Share, StyleSheet, Text, View, ScrollView } from 'react-native';
import { AppModal } from '@/components/AppModal';
import { Redirect } from 'expo-router';
import type { AuthSessionResult } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useTranslation } from 'react-i18next';

import {
  Body,
  BrandMark,
  Divider,
  GhostButton,
  PrimaryButton,
  Screen,
  Title,
  useThemeColors,
} from '@/components/ui';
import { FontFamily } from '@/constants/Fonts';
import { useAuth } from '@/context/AuthContext';
import { readLocalBackupText } from '@/data/localRepository';
import { getGoogleClientConfig, getGoogleSignInIssue, isAuthSkipped } from '@/lib/googleAuth';
import { getGoogleBrowserRedirectUri } from '@/lib/googleRedirect';
import {
  canUseNativeGoogleSignIn,
  signInWithNativeGoogle,
} from '@/lib/googleNativeSignIn';

type Clients = ReturnType<typeof getGoogleClientConfig>;

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
  const issue = getGoogleSignInIssue(Platform.OS, useNative,
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined);
  const browserReady = !issue && Platform.OS === 'web' && !!clients.webClientId;

  // Native path never mounts the Google auth-session hook.
  if (useNative) {
    return <LoginUI useNative promptAsync={null} requestReady />;
  }

  if (!browserReady) {
    return <LoginUI useNative={false} promptAsync={null} requestReady={false} issue={issue} />;
  }

  return <LoginWithBrowserAuth clients={clients} />;
}

function LoginWithBrowserAuth({ clients }: { clients: Clients }) {
  // Must match Authorized redirect URIs on the Google Cloud *Web* OAuth client.
  // Web local → http://localhost:8081/oauth. Native installs use the Google SDK.
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
  issue?: ReturnType<typeof getGoogleSignInIssue>;
};

function LoginUI({ useNative, promptAsync, requestReady, issue }: LoginUIProps) {
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
  const [legal, setLegal] = useState<'privacy' | 'terms' | null>(null);
  const [backup, setBackup] = useState<string | null>(null);
  const [sharingBackup, setSharingBackup] = useState(false);
  const clients = getGoogleClientConfig();
  const skipAuth = isAuthSkipped();
  const platformConfigured = !issue && (useNative
    ? googleConfigured
    : !!clients.webClientId);

  useEffect(() => {
    let alive = true;
    if (issue === 'nativeRequired') {
      void readLocalBackupText().then(raw => { if (alive) setBackup(raw); }).catch(() => undefined);
    }
    return () => { alive = false; };
  }, [issue]);

  async function exportBackup() {
    if (!backup || sharingBackup) return;
    setSharingBackup(true);
    try { await Share.share({ title: t('auth.backupTitle'), message: backup }); }
    catch { showAuthAlert(t('auth.errorTitle'), t('auth.backupError')); }
    finally { setSharingBackup(false); }
  }

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
      <ScrollView contentContainerStyle={styles.stage}>
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
                {issue ? t(`auth.${issue}`) : t('auth.missingConfig')}
              </Body>
            </View>
          ) : null}

          {issue === 'nativeRequired' && backup ? (
            <View style={[styles.banner, { borderColor: c.border, backgroundColor: c.surface }]}>
              <Body muted align="center">{t('auth.localBackupHint')}</Body>
              <PrimaryButton label={t('auth.exportBackup')} disabled={sharingBackup}
                onPress={() => void exportBackup()} />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('ux.privacy')} hitSlop={12} onPress={() => setLegal('privacy')}>
                <Text style={[styles.footerText, { color: c.textFaint }]}>{t('ux.privacy')}</Text>
              </Pressable>
              <Text style={[styles.footerText, { color: c.textFaint }]}>·</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('ux.terms')} hitSlop={12} onPress={() => setLegal('terms')}>
                <Text style={[styles.footerText, { color: c.textFaint }]}>{t('ux.terms')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
      <AppModal visible={!!legal} animationType="slide" onRequestClose={() => setLegal(null)}>
        <Screen safeTop={false}><ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <Title>{t(legal === 'privacy' ? 'ux.privacy' : 'ux.terms')}</Title>
          <Body>{t(legal === 'privacy' ? 'ux.privacyBody' : 'ux.termsBody')}</Body>
          <GhostButton label={t('common.back')} onPress={() => setLegal(null)} />
        </ScrollView></Screen>
      </AppModal>
    </Screen>
  );
}

const GLOW_SIZE = 280;

const styles = StyleSheet.create({
  stage: {
    flexGrow: 1,
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
