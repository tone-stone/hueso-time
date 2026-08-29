import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';

import { showToast } from '@/components/Toast';
import {
  Body,
  Card,
  Chip,
  Field,
  GhostButton,
  Kicker,
  ListGroup,
  ListRow,
  PageColumn,
  PageHeader,
  PrimaryButton,
  Screen,
  useDesktopWeb,
  useThemeColors,
} from '@/components/ui';
import { BARRA_LIBRE_COUNT } from '@/data/seedBarraLibre';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { isAuthSkipped } from '@/lib/googleAuth';
import { useFloatingTabBarInset } from '@/lib/tabBarLayout';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const desktop = useDesktopWeb();
  const tabBarInset = useFloatingTabBarInset();
  const router = useRouter();
  const { settings, updateSettings, importBarraLibreSeed, songs } = useApp();
  const { user, exitToLogin } = useAuth();
  const skipAuth = isAuthSkipped();

  async function onImport() {
    const added = await importBarraLibreSeed();
    if (added === 0) {
      showToast(t('settings.importSeedNone'));
      return;
    }
    showToast(t('settings.importSeedDone', { count: added }));
  }

  async function doExit() {
    await exitToLogin();
    router.replace('/login');
  }

  function onExit() {
    if (Platform.OS === 'web') {
      const ok =
        typeof window !== 'undefined' &&
        window.confirm(`${t('auth.exit')}\n\n${t('auth.exitConfirm')}`);
      if (ok) void doExit();
      return;
    }

    Alert.alert(t('auth.exit'), t('auth.exitConfirm'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: () => void doExit(),
      },
    ]);
  }

  const importPct = Math.max(0, Math.min(1, songs.length / BARRA_LIBRE_COUNT));

  return (
    <Screen>
      <PageColumn maxWidth={720}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 + tabBarInset }}>
          <PageHeader title={t('settings.title')} />

          <View style={[styles.pad, desktop && styles.padDesktop]}>
            <View style={styles.section}>
              <Kicker style={styles.kicker}>{t('settings.defaults')}</Kicker>
              <Card>
                <Field
                  label={t('settings.defaultSetMinutes')}
                  keyboardType="numeric"
                  value={String(settings.defaultSetMinutes)}
                  onChangeText={(v) => {
                    const n = Number(v);
                    if (!Number.isNaN(n) && n > 0) {
                      void updateSettings({ defaultSetMinutes: n });
                    }
                  }}
                />
                <Field
                  label={t('settings.defaultSetCount')}
                  keyboardType="numeric"
                  value={String(settings.defaultSetCount)}
                  onChangeText={(v) => {
                    const n = Number(v);
                    if (!Number.isNaN(n) && n > 0) {
                      void updateSettings({ defaultSetCount: Math.min(6, n) });
                    }
                  }}
                />
              </Card>
            </View>

            <View style={styles.section}>
              <Kicker style={styles.kicker}>{t('settings.sources')}</Kicker>
              <Card>
                <Text style={[styles.cardLabel, { color: c.textMuted }]}>
                  {t('settings.importSeed')}
                </Text>
                <Body muted>{t('settings.importSeedHint', { count: BARRA_LIBRE_COUNT })}</Body>
                <View style={styles.importProgressRow}>
                  <Text style={{ color: c.textMuted, fontSize: 11.5 }}>
                    {songs.length} / {BARRA_LIBRE_COUNT}
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: c.tint, width: `${importPct * 100}%` },
                    ]}
                  />
                </View>
                <View style={[styles.actionSpacer, desktop && styles.actionNarrow]}>
                  <PrimaryButton label={t('settings.importSeed')} onPress={() => void onImport()} />
                </View>
              </Card>

              <Card>
                <Text style={[styles.cardLabel, { color: c.textMuted }]}>{t('settings.storage')}</Text>
                <Body muted>{t('settings.storageHint')}</Body>
              </Card>
            </View>

            <View style={styles.section}>
              <Kicker style={styles.kicker}>{t('settings.app')}</Kicker>
              <Card>
                <Text style={[styles.cardLabel, { color: c.textMuted }]}>{t('settings.language')}</Text>
                <View style={styles.row}>
                  <Chip
                    label={t('settings.spanish')}
                    selected={settings.language === 'es'}
                    onPress={() => void updateSettings({ language: 'es' })}
                  />
                  <Chip
                    label={t('settings.english')}
                    selected={settings.language === 'en'}
                    onPress={() => void updateSettings({ language: 'en' })}
                  />
                </View>
              </Card>
            </View>

            <View style={styles.section}>
              <Kicker style={styles.kicker}>{t('auth.account')}</Kicker>
              {skipAuth && !user ? (
                <Card>
                  <Body muted>{t('auth.skipMode')}</Body>
                </Card>
              ) : (
                <ListGroup>
                  <ListRow
                    icon={
                      <SymbolView
                        name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }}
                        tintColor={c.tint}
                        size={17}
                      />
                    }
                    label={t('auth.signedIn')}
                    value={
                      user?.email ? `${user?.name ?? t('auth.signedIn')} · ${user.email}` : user?.name
                    }
                    last
                  />
                </ListGroup>
              )}
              <View style={[styles.actionSpacer, desktop && styles.actionNarrow]}>
                <GhostButton label={t('auth.exit')} onPress={onExit} danger />
              </View>
            </View>

            <Text style={[styles.footerText, { color: c.textFaint }]}>{t('settings.about')}</Text>
          </View>
        </ScrollView>
      </PageColumn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  padDesktop: { paddingHorizontal: 0 },
  section: { marginBottom: 22 },
  kicker: { marginBottom: 8, marginLeft: 2 },
  actionSpacer: { marginTop: 12 },
  actionNarrow: {
    maxWidth: 280,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  importProgressRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
});
