import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { SymbolView } from 'expo-symbols';
import { AppModal } from '@/components/AppModal';
import { showToast } from '@/components/Toast';
import { Body, Card, Chip, Field, GhostButton, Kicker, PageColumn, PageHeader, PrimaryButton, Screen, Title, useThemeColors, useDesktopWeb, ListGroup, ListRow } from '@/components/ui';
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
  const desktop = useDesktopWeb();
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
  const importPct = matched / BARRA_LIBRE_COUNT;
  async function onImport() {
    const added = await importBarraLibreSeed();
    showToast(t(added ? 'settings.importSeedDone' : 'settings.importSeedNone', { count: added }));
  }
  return (
    <Screen>
      <PageColumn maxWidth={720}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 + tabBarInset }}>
          <PageHeader title={t('settings.title')} />

          <View style={[styles.pad, desktop && styles.padDesktop]}>
            {error ? <Card><Body>{error}</Body><GhostButton label={t('ux.retry')} disabled={busy} onPress={retry} /></Card> : null}
            <View style={styles.section}>
              <Kicker style={styles.kicker}>{t('settings.defaults')}</Kicker>
              <Card>
                <Field label={t('settings.defaultSetMinutes')} keyboardType="numeric"
                  value={minutes} onChangeText={setMinutes} editable={!busy} />
                <Field label={t('settings.defaultSetCount')} keyboardType="numeric"
                  value={count} onChangeText={setCount} editable={!busy} />
                <PrimaryButton label={t('common.save')} disabled={busy || !dirty}
                  onPress={() => void run(saveDefaults)} />
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
                    {matched} / {BARRA_LIBRE_COUNT}
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
                  <PrimaryButton label={t(missing ? 'settings.importSeed' : 'ux.catalogComplete')} disabled={busy || !missing} onPress={() => void run(onImport)} />
                </View>
              </Card>

              <Card>
                <Text style={[styles.cardLabel, { color: c.textMuted }]}>{t('settings.storage')}</Text>
                <Body muted>{t(isApiEnabled() ? 'ux.remoteHint' : 'ux.localHint')}</Body>
              </Card>
            </View>

            <View style={styles.section}>
              <Kicker style={styles.kicker}>{t('ux.backups')}</Kicker>
              <Card>
                <Body muted>{t('ux.backupHint')}</Body>
                <View style={styles.actionSpacer}>
                  <PrimaryButton disabled={busy} label={t('ux.backupExport')} onPress={() => void run(async () => {
                    await shareTextFile(await exportBackupText(), `Hueso-Time-respaldo-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
                  })} />
                  {!isApiEnabled() ? <GhostButton disabled={busy} label={t('ux.backupImport')} onPress={() => void run(pickBackup)} /> : null}
                </View>
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
                    onPress={() => void run(() => updateSettings({ language: 'es' }))}
                  />
                  <Chip
                    label={t('settings.english')}
                    selected={settings.language === 'en'}
                    onPress={() => void run(() => updateSettings({ language: 'en' }))}
                  />
                </View>
              </Card>
            </View>

            <View style={styles.section}>
              <Kicker style={styles.kicker}>{t('auth.account')}</Kicker>
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
              <View style={[styles.actionSpacer, desktop && styles.actionNarrow]}>
                <GhostButton label={t('auth.exit')} onPress={onExit} disabled={busy} danger />
              </View>
            </View>

            <Text style={[styles.footerText, { color: c.textFaint }]}>{t('settings.about')}</Text>
          </View>
        </ScrollView>
      </PageColumn>
      <AppModal visible={!!backup} animationType="slide" onRequestClose={() => { if (!busy) setBackup(null); }}>
        <Screen safeTop={false}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
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
