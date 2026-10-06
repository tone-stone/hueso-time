import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppModal } from '@/components/AppModal';
import { Body, Card, Field, GhostButton, ListGroup, ListRow, PageColumn, PageHeader, PrimaryButton, Screen, Title, useThemeColors, useWideLayout } from '@/components/ui';
import { showToast } from '@/components/Toast';
import { useApp } from '@/context/AppContext';
import { isApiEnabled } from '@/data/apiRepository';
import { BARRA_LIBRE_COUNT } from '@/data/seedBarraLibre';
import { isPreloadedRepertoire } from '@/data/preloadedRepertoire';
import { createId } from '@/lib/id';
import { emptyFilters, generateRandomSets } from '@/lib/randomSets';
import { useAsyncAction } from '@/lib/useAsyncAction';
import { useFloatingTabBarInset } from '@/lib/tabBarLayout';

type Pool = 'all' | 'favorites' | 'ready';
type Pacing = 'flow' | 'variety' | 'random';
const pools: Pool[] = ['all', 'favorites', 'ready'];
const pacings: Pacing[] = ['flow', 'variety', 'random'];
const pacingLabels = { flow: 'pacingFlow', variety: 'pacingVariety', random: 'pacingRandom' } as const;
const presets = [[3, 45], [2, 50], [1, 60]] as const;

export default function GenerateScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const wide = useWideLayout();
  const inset = useFloatingTabBarInset();
  const router = useRouter();
  const { ready, songs, setlists, settings, upsertSetlist, importBarraLibreSeed,
    localRecovery, recoverLocalData, recoverBackupText } = useApp();
  const { busy, error, run, retry } = useAsyncAction();
  const [pool, setPool] = useState<Pool>('all');
  const [pacing, setPacing] = useState<Pacing>('flow');
  const [format, setFormat] = useState<[number, number] | null>(null);
  const [selector, setSelector] = useState<'pool' | 'pacing' | 'format' | 'backup' | null>(null);
  const [countText, setCountText] = useState('');
  const [minutesText, setMinutesText] = useState('');
  const [formatError, setFormatError] = useState(false);
  const [backupText, setBackupText] = useState('');
  const setCount = format?.[0] ?? settings.defaultSetCount;
  const targetMinutes = format?.[1] ?? settings.defaultSetMinutes;
  const available = useMemo(() => songs.filter(s => pool === 'all' || (pool === 'favorites' ? s.favorite : s.practiceStatus === 'ready')), [songs, pool]);
  const availableMinutes = Math.floor(available.reduce((n, s) => n + s.durationSec, 0) / 60);
  const recent = useMemo(() => [...setlists].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3), [setlists]);
  const artists = new Set(songs.map(s => s.artist.trim())).size;
  const canRecover = isApiEnabled() && (!songs.length || isPreloadedRepertoire({ songs, setlists, settings }));
  function openFormat() {
    setCountText(String(setCount)); setMinutesText(String(targetMinutes)); setFormatError(false); setSelector('format');
  }
  function applyFormat() {
    const count = Number(countText), min = Number(minutesText);
    if (!Number.isInteger(count) || count < 1 || count > 6 || !Number.isInteger(min) || min < 1 || min > 240) { setFormatError(true); return; }
    setFormat([count, min]); setSelector(null);
  }
  async function generate() {
    const result = generateRandomSets({ songs: available, setCount, targetMinutes, filters: emptyFilters(), allowReuse: false,
      smartEnergy: pacing === 'flow', preferVariety: pacing === 'variety' });
    if (!result.placedCount) throw new Error(t('generate.noPlaceBody'));
    const created = await upsertSetlist({ name: t('setlists.variedShowName', { count: setCount, min: targetMinutes }),
      sets: result.sets.map((set, i) => ({ ...set, id: createId('set'), name: set.name || t('setlists.setLabel', { n: i + 1 }) })) });
    showToast(t('toast.setlistCreated')); router.push(`/setlist/${created.id}`);
  }
  const configuration = <View style={styles.configuration}>
    <ListGroup>
      <ListRow label={t('ux.pool')} value={t(`generate.pool_${pool}`)} onPress={() => { if (!busy) setSelector('pool'); }} />
      <ListRow label={t('ux.pacing')} value={t(`ux.${pacingLabels[pacing]}`)} onPress={() => { if (!busy) setSelector('pacing'); }} />
      <ListRow label={t('ux.format')} value={t('generate.shape', { count: setCount, min: targetMinutes })} onPress={openFormat} last />
    </ListGroup>
    <Body muted>{t('generate.available', { count: available.length })}</Body>
    {availableMinutes < setCount * targetMinutes && available.length ? <Card>
      <Body>{t('ux.insufficient', { minutes: availableMinutes, target: setCount * targetMinutes })}</Body>
    </Card> : null}
    <Body muted>{t(`ux.${pacingLabels[pacing]}Hint`)}</Body>
  </View>;
  return (
    <Screen>
      <PageColumn maxWidth={1100}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: inset + 24 }}>
          <PageHeader title={t('generate.title')} subtitle={t('generate.subtitle', { songs: songs.length, artists })} />
          <View style={styles.content}>
            {error ? <Card><Text accessibilityRole="alert" style={{ color: c.danger }}>{error}</Text>
              <GhostButton label={t('ux.retry')} disabled={busy} onPress={retry} /></Card> : null}
            {!songs.length ? <Card>
              <Body>{t('generate.emptyBody')}</Body>
              <PrimaryButton disabled={busy} label={t('generate.importCatalog', { count: BARRA_LIBRE_COUNT })}
                onPress={() => void run(async () => { await importBarraLibreSeed(); })} />
              <GhostButton label={t('generate.openRepertoire')} onPress={() => router.push('/(tabs)')} />
            </Card> : null}
            {songs.length > 0 && !available.length ? <Card>
              <Body>{t('generate.emptyPool', { pool: t(`generate.pool_${pool}`) })}</Body>
              <GhostButton label={t('generate.useAll')} onPress={() => setPool('all')} />
            </Card> : null}
            {canRecover ? <Card>
              {localRecovery ? <PrimaryButton label={t('generate.recoverLocal')} disabled={busy}
                onPress={() => void run(recoverLocalData)} /> : null}
              <GhostButton label={t('generate.recoverBackup')} onPress={() => setSelector('backup')} />
            </Card> : null}
            <View style={[styles.workspace, wide && styles.workspaceWide]}>
              <View style={[styles.generatePanel, wide && styles.generatePanelWide]}>
                {busy ? <ActivityIndicator color={c.tint} accessibilityLabel={t('ux.generating')} /> : null}
                <Title>{t('generate.shape', { count: setCount, min: targetMinutes })}</Title>
                <PrimaryButton label={busy ? t('ux.generating') : t('generate.cta')}
                  disabled={busy || !ready || !available.length} onPress={() => void run(generate)} />
              </View>
              {configuration}
            </View>
            <Title>{t('generate.recent')}</Title>
            {recent.map(show => <Card key={show.id} onPress={() => router.push(`/setlist/${show.id}`)}>
              <Text style={{ color: c.text, fontSize: 17 }}>{show.name}</Text>
              <Body muted>{t('generate.recentMeta', { sets: show.sets.length, songs: show.sets.reduce((n, s) => n + s.songs.length, 0) })}</Body>
            </Card>)}
            {!recent.length ? <Body muted>{t('generate.recentEmpty')}</Body> : null}
          </View>
        </ScrollView>
      </PageColumn>
      <AppModal visible={!!selector} animationType="slide" onRequestClose={() => { if (!busy) setSelector(null); }}>
        <Screen safeTop={false}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <Title>{t(selector === 'pool' ? 'ux.pool' : selector === 'pacing' ? 'ux.pacing' : selector === 'backup' ? 'generate.recoverBackup' : 'ux.format')}</Title>
            {selector === 'pool' ? pools.map(value => <ListRow key={value} label={t(`generate.pool_${value}`)} value={pool === value ? '✓' : ''}
              onPress={() => { setPool(value); setSelector(null); }} />) : null}
            {selector === 'pacing' ? pacings.map(value => <Card key={value}>
              <ListRow label={t(`ux.${pacingLabels[value]}`)} value={pacing === value ? '✓' : ''}
                onPress={() => { setPacing(value); setSelector(null); }} />
              <Body muted>{t(`ux.${pacingLabels[value]}Hint`)}</Body>
            </Card>) : null}
            {selector === 'format' ? <>
              <GhostButton label={t('ux.useDefaults')} onPress={() => { setFormat(null); setSelector(null); }} />
              {presets.map(([count, min]) => <ListRow key={`${count}-${min}`} label={t('generate.shape', { count, min })}
                onPress={() => { setFormat([count, min]); setSelector(null); }} />)}
              <Body>{t('ux.customFormat')}</Body>
              <Field label={t('settings.defaultSetCount')} keyboardType="number-pad" value={countText} onChangeText={setCountText} />
              <Field label={t('settings.defaultSetMinutes')} keyboardType="number-pad" value={minutesText} onChangeText={setMinutesText} />
              {formatError ? <Text accessibilityRole="alert" style={{ color: c.danger }}>{t('ux.invalidFormat')}</Text> : null}
              <PrimaryButton label={t('ux.apply')} onPress={applyFormat} />
            </> : null}
            {selector === 'backup' ? <>
              <Body muted>{t('generate.backupHint')}</Body>
              <TextInput accessibilityLabel={t('generate.backupText')} multiline value={backupText} onChangeText={setBackupText}
                style={{ color: c.text, minHeight: 160, padding: 12, borderWidth: 1, borderColor: c.border }} />
              <PrimaryButton label={t('generate.restoreBackup')} disabled={busy || !backupText.trim()}
                onPress={() => void run(async () => { await recoverBackupText(backupText); setSelector(null); setBackupText(''); })} />
            </> : null}
            <GhostButton label={t('common.cancel')} disabled={busy} onPress={() => setSelector(null)} />
          </ScrollView>
        </Screen>
      </AppModal>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 }, workspace: { gap: 20 }, workspaceWide: { flexDirection: 'row', alignItems: 'flex-start' },
  generatePanel: { gap: 14, paddingVertical: 16 }, generatePanelWide: { width: 280, flexShrink: 0 },
  configuration: { flex: 1, minWidth: 0, gap: 12 },
});
