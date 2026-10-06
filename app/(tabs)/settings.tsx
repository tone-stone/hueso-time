import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { AppModal } from '@/components/AppModal';
import { showToast } from '@/components/Toast';
import { Body, Card, Chip, Field, GhostButton, Kicker, PageColumn, PageHeader, PrimaryButton, Screen, Title, useThemeColors } from '@/components/ui';
import { BARRA_LIBRE_COUNT, buildBarraLibreSongInputs } from '@/data/seedBarraLibre';
import { isApiEnabled } from '@/data/apiRepository';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { confirmDestructive } from '@/lib/confirm';
import { parseBackup } from '@/lib/backup';
import { shareTextFile } from '@/lib/shareFile';
import { useAsyncAction } from '@/lib/useAsyncAction';
import { useFloatingTabBarInset } from '@/lib/tabBarLayout';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const tabBarInset = useFloatingTabBarInset();
  const router = useRouter();
  const { settings, updateSettings, importBarraLibreSeed, songs, exportBackupText, restoreBackupText } = useApp();
  const { user, exitToLogin } = useAuth();
  const { busy, error, run, retry } = useAsyncAction();
  const [minutes, setMinutes] = useState(String(settings.defaultSetMinutes));
  const [count, setCount] = useState(String(settings.defaultSetCount));
  const [backup, setBackup] = useState<{ raw: string; songs: number; setlists: number } | null>(null);
  useEffect(() => {
    setMinutes(String(settings.defaultSetMinutes)); setCount(String(settings.defaultSetCount));
  }, [settings.defaultSetMinutes, settings.defaultSetCount]);
  const dirty = minutes !== String(settings.defaultSetMinutes) || count !== String(settings.defaultSetCount);
  const matched = useMemo(() => {
    const keys = new Set(songs.map(s => `${s.artist.trim().toLowerCase()}::${s.title.trim().toLowerCase()}`));
    return buildBarraLibreSongInputs().filter(s => keys.has(`${s.artist.trim().toLowerCase()}::${s.title.trim().toLowerCase()}`)).length;
  }, [songs]);
  const missing = BARRA_LIBRE_COUNT - matched;
  async function saveDefaults() {
    const setCount = Number(count), defaultSetMinutes = Number(minutes);
    if (!Number.isInteger(setCount) || setCount < 1 || setCount > 6 ||
      !Number.isInteger(defaultSetMinutes) || defaultSetMinutes < 1 || defaultSetMinutes > 240) throw new Error(t('ux.invalidFormat'));
    await updateSettings({ defaultSetCount: setCount, defaultSetMinutes });
    showToast(t('ux.defaultsSaved'));
  }
  async function pickBackup() {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 10 * 1024 * 1024) throw new Error(t('ux.invalidBackup'));
    const raw = Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
    try {
      const saved = parseBackup(raw);
      setBackup({ raw, songs: saved.songs.length, setlists: saved.setlists.length });
    } catch { throw new Error(t('ux.invalidBackup')); }
  }
  function restoreBackup() {
    if (!backup || busy) return;
    confirmDestructive({ title: t('ux.backupConfirm'), message: t('ux.backupReplace'),
      cancelLabel: t('common.cancel'), confirmLabel: t('ux.backupConfirm'),
      onConfirm: () => void run(async () => {
        await restoreBackupText(backup.raw); setBackup(null); showToast(t('ux.backupDone'));
      }),
    });
  }
  function onExit() {
    confirmDestructive({ title: t('auth.exit'), message: t('auth.exitConfirm'),
      cancelLabel: t('common.cancel'), confirmLabel: t('auth.exit'),
      onConfirm: () => void run(async () => { await exitToLogin(); router.replace('/login'); }),
    });
  }
  return (
    <Screen>
      <PageColumn maxWidth={720}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 + tabBarInset }}>
          <PageHeader title={t('settings.title')} />
          <View style={styles.content}>
            {error ? <Card><Text accessibilityRole="alert" style={{ color: c.danger }}>{error}</Text>
              <GhostButton label={t('ux.retry')} onPress={retry} disabled={busy} /></Card> : null}
            <Kicker>{t('settings.defaults')}</Kicker>
            <Card>
              <View style={styles.fields}>
                <Field style={{ flex: 1 }} label={t('settings.defaultSetMinutes')} keyboardType="number-pad"
                  value={minutes} onChangeText={setMinutes} editable={!busy} />
                <Field style={{ flex: 1 }} label={t('settings.defaultSetCount')} keyboardType="number-pad"
                  value={count} onChangeText={setCount} editable={!busy} />
              </View>
              <PrimaryButton label={busy ? t('ux.saving') : t('common.save')} disabled={busy || !dirty}
                onPress={() => void run(saveDefaults)} />
            </Card>
            <Kicker>{t('settings.sources')}</Kicker>
            <Card>
              <Body>{t('settings.importSeed')}</Body>
              <Body muted>{t('settings.importSeedHint', { count: BARRA_LIBRE_COUNT })}</Body>
              <Text style={{ color: c.textMuted, marginVertical: 12 }}>{matched} / {BARRA_LIBRE_COUNT}</Text>
              <View style={[styles.track, { backgroundColor: c.surfaceElevated }]}>
                <View style={{ height: 4, backgroundColor: c.tint, width: `${matched / BARRA_LIBRE_COUNT * 100}%` }} />
              </View>
              <PrimaryButton disabled={busy || missing === 0}
                label={missing ? t('ux.catalogImport', { count: missing }) : t('ux.catalogComplete')}
                onPress={() => void run(async () => {
                  const added = await importBarraLibreSeed();
                  showToast(t(added ? 'settings.importSeedDone' : 'settings.importSeedNone', { count: added }));
                })} />
            </Card>
            <Kicker>{t('ux.backups')}</Kicker>
            <Card>
              <Body>{t(isApiEnabled() ? 'ux.remoteStorage' : 'ux.localStorage')}</Body>
              <Body muted>{t(isApiEnabled() ? 'ux.remoteHint' : 'ux.localHint')}</Body>
              <View style={styles.actions}>
                <Body muted>{t('ux.backupHint')}</Body>
                <PrimaryButton disabled={busy} label={t('ux.backupExport')} onPress={() => void run(async () => {
                  await shareTextFile(await exportBackupText(), `Hueso-Time-respaldo-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
                })} />
                {!isApiEnabled() ? <GhostButton disabled={busy} label={t('ux.backupImport')} onPress={() => void run(pickBackup)} /> : null}
              </View>
            </Card>
            <Kicker>{t('settings.language')}</Kicker>
            <View style={styles.fields}>
              {(['es', 'en'] as const).map(language => <Chip key={language}
                label={t(language === 'es' ? 'settings.spanish' : 'settings.english')}
                selected={settings.language === language}
                onPress={() => void run(() => updateSettings({ language }))} />)}
            </View>
            <Kicker>{t('auth.account')}</Kicker>
            <Card><Body>{user?.name ?? t('ux.accountGuest')}</Body>
              {user?.email ? <Body muted>{user.email}</Body> : null}
            </Card>
            <GhostButton disabled={busy} label={t('auth.exit')} onPress={onExit} danger />
            <Body muted>{t('settings.about')}</Body>
          </View>
        </ScrollView>
      </PageColumn>
      <AppModal visible={!!backup} animationType="slide" onRequestClose={() => { if (!busy) setBackup(null); }}>
        <Screen safeTop={false}>
          <ScrollView contentContainerStyle={styles.content}>
            <Title>{t('ux.backupReview')}</Title>
            <Body>{t('ux.backupSummary', backup ?? {})}</Body>
            <Body muted>{t('ux.backupReplace')}</Body>
            <PrimaryButton disabled={busy} label={busy ? t('ux.saving') : t('ux.backupConfirm')} onPress={restoreBackup} />
            <GhostButton disabled={busy} label={t('common.cancel')} onPress={() => setBackup(null)} />
          </ScrollView>
        </Screen>
      </AppModal>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 }, fields: { flexDirection: 'row', gap: 12 },
  actions: { marginTop: 16, gap: 12 }, track: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
});
