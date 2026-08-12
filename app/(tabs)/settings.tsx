import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { showToast } from '@/components/Toast';
import {
  Body,
  BrandMark,
  Card,
  Chip,
  Field,
  GhostButton,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';
import { BARRA_LIBRE_COUNT } from '@/data/seedBarraLibre';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { isAuthSkipped } from '@/lib/googleAuth';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <BrandMark />
          <Title>{t('settings.title')}</Title>
          <Subtitle>{t('settings.about')}</Subtitle>
        </View>

        <View style={styles.pad}>
          <Card>
            <Text style={[styles.label, { color: c.textMuted }]}>{t('settings.language')}</Text>
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

          <Card>
            <Text style={[styles.label, { color: c.textMuted }]}>{t('settings.defaults')}</Text>
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

          <Card>
            <Text style={[styles.label, { color: c.textMuted }]}>{t('settings.importSeed')}</Text>
            <Body muted>{t('settings.importSeedHint', { count: BARRA_LIBRE_COUNT })}</Body>
            <Text style={{ color: c.textMuted, marginTop: 8, marginBottom: 12 }}>
              {songs.length} / {BARRA_LIBRE_COUNT}
            </Text>
            <PrimaryButton label={t('settings.importSeed')} onPress={() => void onImport()} />
          </Card>

          <Card>
            <Text style={[styles.label, { color: c.textMuted }]}>{t('settings.storage')}</Text>
            <Body muted>{t('settings.storageHint')}</Body>
          </Card>

          <Card>
            <Text style={[styles.label, { color: c.textMuted }]}>{t('auth.account')}</Text>
            {skipAuth && !user ? (
              <Body muted>{t('auth.skipMode')}</Body>
            ) : (
              <>
                <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>
                  {user?.name ?? t('auth.signedIn')}
                </Text>
                <Text style={{ color: c.textMuted, marginTop: 4 }}>{user?.email}</Text>
              </>
            )}
            <View style={{ marginTop: 12 }}>
              <GhostButton label={t('auth.exit')} onPress={onExit} danger />
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8 },
  pad: { paddingHorizontal: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
