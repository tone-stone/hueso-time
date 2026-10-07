import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useTranslation } from 'react-i18next';

import { showToast } from '@/components/Toast';
import {
  Body,
  PageColumn,
  PageHeader,
  Screen,
  PrimaryButton,
  GhostButton,
  useDesktopWeb,
  Card, Field, ListRow, Title,
  useThemeColors,
} from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { isApiEnabled } from '@/data/apiRepository';
import { BARRA_LIBRE_COUNT } from '@/data/seedBarraLibre';
import { isPreloadedRepertoire } from '@/data/preloadedRepertoire';
import { createId } from '@/lib/id';
import { emptyFilters, generateRandomSets } from '@/lib/randomSets';
import { useFloatingTabBarInset } from '@/lib/tabBarLayout';

import { AppModal } from '@/components/AppModal';
import { useAsyncAction } from '@/lib/useAsyncAction';

type Pool = 'all' | 'favorites' | 'ready';
type Pacing = 'flow' | 'variety' | 'random';
const pools: Pool[] = ['all', 'favorites', 'ready'];
const pacings: Pacing[] = ['flow', 'variety', 'random'];
const pacingLabels = { flow: 'pacingFlow', variety: 'pacingVariety', random: 'pacingRandom' } as const;
const presets = [[3, 45], [2, 50], [1, 60]] as const;

export default function GenerateScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const desktop = useDesktopWeb();
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
  const recent = useMemo(() => [...setlists].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 2), [setlists]);
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
  const rolling = busy;
  const recovering = busy;
  const artistCount = artists;
  const starterCatalog = canRecover;
  const tabBarInset = inset;
  const tickerLabel = busy ? t('ux.generating') : t('generate.tapToRoll');
  const pulse = useSharedValue(0);
  const spin = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(pulse);
  }, [pulse]);
  useEffect(() => {
    if (busy) spin.value = withRepeat(withTiming(1, { duration: 750, easing: Easing.linear }), -1);
    else { cancelAnimation(spin); spin.value = 0; }
    return () => cancelAnimation(spin);
  }, [busy, spin]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: busy ? 0 : 0.35 + pulse.value * 0.55,
    transform: [{ scale: 1 + pulse.value * 0.04 }],
  }));
  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: busy ? 1 : 0,
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  async function recover(action: () => Promise<unknown>) {
    if (await run(action)) {
      setSelector(null); setBackupText(''); setPool('all');
      showToast(t('generate.recoveryDone'));
    }
  }
  /** One grouped row: icon, label, current value, chevron. Tapping cycles the value. */
  const row = (
    icon: SymbolViewProps['name'],
    label: string,
    value: string,
    onPress: () => void,
    last = false,
  ) => (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? c.surfaceElevated : c.surface },
        !last && { borderBottomWidth: 1, borderBottomColor: c.divider },
      ]}>
      <SymbolView name={icon} tintColor={c.tint} size={15} style={styles.rowIcon} />
      <Text style={[styles.rowLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.text }]} numberOfLines={1}>
        {value}
      </Text>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        tintColor={c.textFaint}
        size={13}
      />
    </Pressable>
  );

  return (
    <Screen>
      <PageColumn maxWidth={920}>
        <ScrollView
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingBottom: 32 + tabBarInset }}>
          <PageHeader
            title={t('generate.title')}
            subtitle={t('generate.subtitle', { songs: songs.length, artists: artistCount })}
            brandSubtitle={t('generate.subtitle', {
              songs: songs.length,
              artists: artistCount,
            })}
          />

          <View style={[styles.pad, desktop && styles.padDesktop]}>
            {error ? <View style={[styles.recoveryPanel, { borderColor: c.border }]}><Body>{error}</Body>
              <GhostButton label={t('ux.retry')} onPress={retry} disabled={busy} /></View> : null}
            {starterCatalog ? (
              <View style={[styles.recoveryPanel, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Body muted>{t('generate.preloadedCatalog', { count: songs.length })}</Body>
                {localRecovery ? <>
                  <Body>{t('generate.localBackupFound', localRecovery)}</Body>
                  <PrimaryButton label={t('generate.recoverLocal')} disabled={recovering}
                    onPress={() => void recover(recoverLocalData)} />
                </> : null}
                <PrimaryButton label={t('generate.recoverBackup')} disabled={recovering}
                  onPress={() => setSelector('backup')} />
              </View>
            ) : null}
            {songs.length === 0 ? (
              <View style={[styles.recoveryPanel, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.recentTitle, { color: c.text }]}>{t('generate.emptyTitle')}</Text>
                <Body muted>{t('generate.emptyBody')}</Body>
                {localRecovery ? <>
                  <Body>{t('generate.localBackupFound', localRecovery)}</Body>
                  <PrimaryButton label={t('generate.recoverLocal')} disabled={recovering}
                    onPress={() => void recover(recoverLocalData)} />
                </> : null}
                {isApiEnabled() ? <PrimaryButton label={t('generate.recoverBackup')}
                  disabled={recovering} onPress={() => setSelector('backup')} /> : null}
                <PrimaryButton label={t('generate.importCatalog', { count: BARRA_LIBRE_COUNT })}
                  disabled={recovering} onPress={() => void recover(importBarraLibreSeed)} />
                <GhostButton label={t('generate.openRepertoire')}
                  onPress={() => router.push('/(tabs)')} />
              </View>
            ) : available.length === 0 ? (
              <View style={[styles.recoveryPanel, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Body muted>{t('generate.emptyPool', { pool: t(`generate.pool_${pool}`) })}</Body>
                <PrimaryButton label={t('generate.useAll')} onPress={() => setPool('all')} />
              </View>
            ) : null}
            <View style={styles.triggerWrap}>
              <Pressable
                onPress={() => void run(generate)}
                disabled={rolling || recovering || !ready || songs.length === 0}
                accessibilityRole="button"
                accessibilityLabel={t('generate.cta')}
                style={({ pressed }) => [
                  styles.trigger,
                  {
                    borderColor: c.tint,
                    backgroundColor: pressed ? c.tintFaint : 'transparent',
                  },
                ]}>
                <Animated.View
                  pointerEvents="none"
                  style={[styles.halo, { borderColor: c.tintGlow }, haloStyle]}
                />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.halo,
                    { borderColor: c.tintGlow, borderTopColor: c.tint },
                    spinnerStyle,
                  ]}
                />
                <SymbolView
                  name={{ ios: 'shuffle', android: 'shuffle', web: 'shuffle' }}
                  tintColor={c.tint}
                  size={30}
                />
                <Text style={[styles.triggerLabel, { color: c.text }]}>
                  {t('generate.cta')}
                </Text>
                <Text style={[styles.triggerSub, { color: c.textMuted }]}>
                  {t('generate.shape', { count: setCount, min: targetMinutes })}
                </Text>
              </Pressable>
              <Text style={[styles.ticker, { color: c.textFaint }]} numberOfLines={1}>
                {tickerLabel}
              </Text>
            </View>

            <View style={[styles.group, { backgroundColor: c.divider }]}>
              {row(
                { ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' },
                t('generate.pool'),
                t(`generate.pool_${pool}`),
                () => setSelector('pool'),
              )}
              {row(
                { ios: 'waveform', android: 'graphic_eq', web: 'graphic_eq' },
                t('generate.energy'),
                t(`ux.${pacingLabels[pacing]}`),
                () => setSelector('pacing'),
              )}
              {row(
                { ios: 'clock', android: 'schedule', web: 'schedule' },
                t('generate.shapeLabel'),
                t('generate.shape', { count: setCount, min: targetMinutes }),
                openFormat,
                true,
              )}
            </View>
            <Body muted>{t('generate.available', { count: available.length })}</Body>

            {recent.length > 0 ? (
              <>
                <Text style={[styles.kicker, { color: c.textFaint }]}>
                  {t('generate.recent')}
                </Text>
                <View style={{ gap: 8 }}>
                  {recent.map((item) => {
                    const songCount = item.sets.reduce((n, s) => n + s.songs.length, 0);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => router.push(`/setlist/${item.id}`)}
                        style={styles.recentRow}>
                        <View style={[styles.recentThumb, { backgroundColor: c.surfaceAccent }]}>
                          <SymbolView
                            name={{ ios: 'music.note', android: 'music_note', web: 'music_note' }}
                            tintColor={c.accent}
                            size={16}
                          />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.recentTitle, { color: c.text }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={[styles.recentSub, { color: c.textMuted }]} numberOfLines={1}>
                            {t('generate.recentMeta', {
                              sets: item.sets.length,
                              songs: songCount,
                            })}
                          </Text>
                        </View>
                        <SymbolView
                          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                          tintColor={c.textFaint}
                          size={13}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <Body muted>{t('generate.recentEmpty')}</Body>
            )}
          </View>
        </ScrollView>
      </PageColumn>
      <Modal visible={selector === 'backup'} transparent animationType="fade" onRequestClose={() => setSelector(null)}>
        <View style={styles.backupOverlay}>
          <View style={[styles.backupDialog, { backgroundColor: c.surface }]}>
            <Text style={[styles.recentTitle, { color: c.text }]}>{t('generate.recoverBackup')}</Text>
            <Body muted>{t('generate.backupHint')}</Body>
            <TextInput multiline value={backupText} onChangeText={setBackupText}
              accessibilityLabel={t('generate.backupText')} placeholder={t('generate.backupText')}
              placeholderTextColor={c.textMuted} autoCapitalize="none" autoCorrect={false}
              style={[styles.backupInput, { color: c.text, borderColor: c.border }]} />
            <PrimaryButton label={t('generate.restoreBackup')} disabled={recovering || !backupText.trim()}
              onPress={() => void recover(() => recoverBackupText(backupText))} />
            <GhostButton label={t('generate.closeBackup')} onPress={() => setSelector(null)} />
          </View>
        </View>
      </Modal>
      <AppModal visible={!!selector && selector !== 'backup'} animationType="slide" onRequestClose={() => { if (!busy) setSelector(null); }}>
        <Screen safeTop={false}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
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
  recoveryPanel: { padding: 16, borderRadius: 8, borderWidth: 1, gap: 12 },
  backupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  backupDialog: { width: '100%', maxWidth: 480, padding: 20, borderRadius: 12, gap: 14 },
  backupInput: { minHeight: 100, maxHeight: 180, borderWidth: 1, borderRadius: 8, padding: 12, textAlignVertical: 'top' },
  pad: { paddingHorizontal: 22, gap: 20 },
  padDesktop: { paddingHorizontal: 0 },

  triggerWrap: { alignItems: 'center', gap: 16, marginTop: 6 },
  trigger: {
    width: 212,
    height: 212,
    borderRadius: 106,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  halo: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 112,
    borderWidth: 1,
  },
  triggerLabel: { fontSize: 20, fontWeight: '500', letterSpacing: 0.4 },
  triggerSub: { fontSize: 11.5, textAlign: 'center', maxWidth: 150 },
  ticker: { fontSize: 11, height: 14 },

  group: { borderRadius: 8, overflow: 'hidden', gap: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, paddingHorizontal: 14 },
  rowIcon: { width: 18 },
  rowLabel: { fontSize: 13, flex: 1 },
  rowValue: { fontSize: 13, fontWeight: '500', flexShrink: 1 },

  kicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: -8,
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  recentThumb: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  recentTitle: { fontSize: 13.5, fontWeight: '500' },
  recentSub: { fontSize: 11.5, marginTop: 2 },
});
