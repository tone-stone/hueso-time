import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  useThemeColors,
} from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { isApiEnabled } from '@/data/apiRepository';
import { BARRA_LIBRE_COUNT } from '@/data/seedBarraLibre';
import { isPreloadedRepertoire } from '@/data/preloadedRepertoire';
import { createId } from '@/lib/id';
import { emptyFilters, filterSongs, generateRandomSets } from '@/lib/randomSets';
import { useFloatingTabBarInset } from '@/lib/tabBarLayout';
import type { SetBlock, Song, SongFilters } from '@/types/models';

/**
 * Generar — the redesign's home. One big tap target, three quick-adjust rows, and the
 * last few shows.
 *
 * All the generation logic is lib/randomSets.ts as-is: this screen only chooses the
 * options it passes in. Pool / Energía / Formato map to GenerateRandomSetsOptions —
 * nothing here reimplements set filling.
 */

type PoolId = 'all' | 'favorites' | 'ready';
type EnergyId = 'rising' | 'party' | 'calm' | 'varied';

const POOLS: PoolId[] = ['all', 'favorites', 'ready'];
const ENERGIES: EnergyId[] = ['rising', 'party', 'calm', 'varied'];
/** [setCount, targetMinutes] — the three shapes offered on the pill row. */
const SHAPES: [number, number][] = [
  [3, 45],
  [2, 50],
  [1, 60],
];

const ROLL_MS = 950;
const TICKER_MS = 95;

/** Pool narrows the song list before the generator sees it; it is not a SongFilters field. */
function poolSongs(songs: Song[], pool: PoolId): Song[] {
  if (pool === 'favorites') return songs.filter((s) => s.favorite);
  if (pool === 'ready') return songs.filter((s) => s.practiceStatus === 'ready');
  return songs;
}

/** Energía maps onto the pacing flags the generator already understands. */
function energyOptions(energy: EnergyId) {
  switch (energy) {
    case 'party':
      return { smartEnergy: false, preferVariety: true };
    case 'calm':
      return { smartEnergy: true, preferVariety: false };
    case 'varied':
      return { smartEnergy: false, preferVariety: true };
    case 'rising':
    default:
      return { smartEnergy: true, preferVariety: true };
  }
}

export default function GenerateScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const desktop = useDesktopWeb();
  const tabBarInset = useFloatingTabBarInset();
  const router = useRouter();
  const { ready, songs, setlists, settings, upsertSetlist, importBarraLibreSeed,
    localRecovery, recoverLocalData, recoverBackupText } = useApp();

  const [pool, setPool] = useState<PoolId>('all');
  const [energy, setEnergy] = useState<EnergyId>('rising');
  const [shape, setShape] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [tick, setTick] = useState(0);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const [recovering, setRecovering] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [backupText, setBackupText] = useState('');

  const [setCount, targetMinutes] = SHAPES[shape];
  const available = useMemo(() => poolSongs(songs, pool), [songs, pool]);
  const artistCount = useMemo(
    () => new Set(songs.map((s) => s.artist.trim()).filter(Boolean)).size,
    [songs],
  );
  const recent = useMemo(
    () =>
      [...setlists]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 2),
    [setlists],
  );
  const starterCatalog = useMemo(() => isPreloadedRepertoire({ songs, setlists, settings }),
    [songs, setlists, settings]);

  // The pulsing halo, and the spinner it becomes while generating. Reanimated so the
  // animation stays on the UI thread while generateRandomSets runs on the JS one.
  const pulse = useSharedValue(0);
  const spin = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (tickTimer.current) clearInterval(tickTimer.current);
      cancelAnimation(spin);
    };
  }, [spin]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: rolling ? 0 : 0.35 + pulse.value * 0.55,
    transform: [{ scale: 1 + pulse.value * 0.04 }],
  }));
  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: rolling ? 1 : 0,
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  function warn(titleKey: string, bodyKey: string) {
    warnMessage(titleKey, t(bodyKey));
  }
  function warnMessage(titleKey: string, body: string) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${t(titleKey)}\n\n${body}`);
      return;
    }
    Alert.alert(t(titleKey), body);
  }

  async function recover(action: () => Promise<unknown>) {
    if (recovering || rolling || !ready) return;
    setRecovering(true);
    try {
      await action();
      if (!mounted.current) return;
      setBackupOpen(false);
      setBackupText('');
      setPool('all');
      showToast(t('generate.recoveryDone'));
    } catch (error) {
      if (mounted.current) warnMessage('generate.errorTitle', error instanceof Error ? error.message : t('generate.errorBody'));
    } finally { if (mounted.current) setRecovering(false); }
  }

  function stopTicker() {
    if (tickTimer.current) clearInterval(tickTimer.current);
    tickTimer.current = null;
    cancelAnimation(spin);
    spin.value = 0;
    setRolling(false);
  }

  async function onRoll() {
    if (rolling || recovering || !ready) return;
    if (songs.length === 0) {
      warn('generate.emptyTitle', 'generate.emptyBody');
      return;
    }

    const filters: SongFilters = emptyFilters();
    const matched = filterSongs(available, filters);
    if (matched.length === 0) {
      warn('generate.noMatchTitle', 'generate.noMatchBody');
      return;
    }

    setRolling(true);
    setTick(0);
    spin.value = withRepeat(withTiming(1, { duration: 750, easing: Easing.linear }), -1);
    tickTimer.current = setInterval(() => setTick((n) => n + 1), TICKER_MS);

    try {
      await new Promise((r) => setTimeout(r, ROLL_MS));
      if (!mounted.current) return;
      const result = generateRandomSets({
        songs: available,
        setCount,
        targetMinutes,
        filters,
        allowReuse: false,
        ...energyOptions(energy),
      });
      if (result.placedCount === 0) {
        warn('generate.noPlaceTitle', 'generate.noPlaceBody');
        return;
      }
      const sets: SetBlock[] = result.sets.map((set, i) => ({
        ...set,
        id: set.id.startsWith('tmp_') ? createId('set') : set.id,
        name: set.name || `Set ${i + 1}`,
      }));
      const created = await upsertSetlist({
        name: t('setlists.variedShowName', { count: setCount, min: targetMinutes }),
        sets,
      });
      showToast(t('toast.setlistCreated'));
      router.push(`/setlist/${created.id}`);
    } catch (error) {
      if (mounted.current) warnMessage('generate.errorTitle', error instanceof Error ? error.message : t('generate.errorBody'));
    } finally { if (mounted.current) stopTicker(); }
  }

  const tickerLabel = rolling
    ? available[(tick * 7) % available.length]?.title ?? ''
    : t('generate.tapToRoll');

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
            {starterCatalog ? (
              <View style={[styles.recoveryPanel, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Body muted>{t('generate.preloadedCatalog', { count: songs.length })}</Body>
                {localRecovery ? <>
                  <Body>{t('generate.localBackupFound', localRecovery)}</Body>
                  <PrimaryButton label={t('generate.recoverLocal')} disabled={recovering}
                    onPress={() => void recover(recoverLocalData)} />
                </> : null}
                <PrimaryButton label={t('generate.recoverBackup')} disabled={recovering}
                  onPress={() => setBackupOpen(true)} />
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
                  disabled={recovering} onPress={() => setBackupOpen(true)} /> : null}
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
                onPress={() => void onRoll()}
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
                () => setPool(POOLS[(POOLS.indexOf(pool) + 1) % POOLS.length]),
              )}
              {row(
                { ios: 'waveform', android: 'graphic_eq', web: 'graphic_eq' },
                t('generate.energy'),
                t(`generate.energy_${energy}`),
                () => setEnergy(ENERGIES[(ENERGIES.indexOf(energy) + 1) % ENERGIES.length]),
              )}
              {row(
                { ios: 'clock', android: 'schedule', web: 'schedule' },
                t('generate.shapeLabel'),
                t('generate.shape', { count: setCount, min: targetMinutes }),
                () => setShape((s) => (s + 1) % SHAPES.length),
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
      <Modal visible={backupOpen} transparent animationType="fade" onRequestClose={() => setBackupOpen(false)}>
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
            <GhostButton label={t('generate.closeBackup')} onPress={() => setBackupOpen(false)} />
          </View>
        </View>
      </Modal>
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
