import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useThemeColors } from '@/components/ui';
import { formatDuration, formatMinutes } from '@/lib/id';
import { setDurationSec } from '@/lib/setMath';
import type { SetBlock, Song } from '@/types/models';

type FlatItem = {
  key: string;
  setIndex: number;
  setName: string;
  songIndex: number;
  song: Song;
};

function flatten(sets: SetBlock[], songsById: Map<string, Song>): FlatItem[] {
  const items: FlatItem[] = [];
  sets.forEach((block, setIndex) => {
    const refs = [...block.songs].sort((a, b) => a.order - b.order);
    refs.forEach((ref, songIndex) => {
      const song = songsById.get(ref.songId);
      if (!song) return;
      items.push({
        key: `${block.id}:${ref.songId}`,
        setIndex,
        setName: block.name,
        songIndex,
        song,
      });
    });
  });
  return items;
}

export function ShowModeView({
  sets,
  songsById,
  onExit,
}: {
  sets: SetBlock[];
  songsById: Map<string, Song>;
  onExit: () => void;
}) {
  useKeepAwake();
  const { t } = useTranslation();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const items = useMemo(() => flatten(sets, songsById), [sets, songsById]);
  const [index, setIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [songElapsedSec, setSongElapsedSec] = useState(0);
  const [timerOn, setTimerOn] = useState(true);
  const started = useRef(Date.now());
  const songStarted = useRef(Date.now());
  const songPausedAt = useRef<number | null>(null);
  const songPausedAccum = useRef(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressWidth = Math.max(width - Math.max(insets.left, 16) * 2 - Math.max(insets.right, 16) * 2, 120);
  const rootPad = {
    paddingTop: Math.max(insets.top, 12),
    paddingBottom: Math.max(insets.bottom, 16),
    paddingLeft: Math.max(insets.left, 16),
    paddingRight: Math.max(insets.right, 16),
  };

  useEffect(() => {
    started.current = Date.now();
    setElapsedSec(0);
  }, []);

  // Reset song progress when the current song changes
  useEffect(() => {
    songStarted.current = Date.now();
    songPausedAt.current = null;
    songPausedAccum.current = 0;
    setSongElapsedSec(0);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
  }, [index, progressAnim]);

  useEffect(() => {
    if (!timerOn) {
      if (songPausedAt.current == null) songPausedAt.current = Date.now();
      progressAnim.stopAnimation();
      return;
    }
    if (songPausedAt.current != null) {
      songPausedAccum.current += Date.now() - songPausedAt.current;
      songPausedAt.current = null;
    }

    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started.current) / 1000));
      const songMs = Date.now() - songStarted.current - songPausedAccum.current;
      setSongElapsedSec(Math.max(0, Math.floor(songMs / 1000)));
    }, 250);
    return () => clearInterval(id);
  }, [timerOn, progressAnim]);

  const current = items[index];
  const next = items[index + 1];

  // Smooth fill animation for the current song (restarts on song change / resume)
  useEffect(() => {
    if (!current || !timerOn) return;
    const duration = Math.max(current.song.durationSec || 1, 1);
    const elapsedMs = Date.now() - songStarted.current - songPausedAccum.current;
    const progress = Math.min(1, Math.max(0, elapsedMs / (duration * 1000)));
    const remainingMs = Math.max(0, duration * 1000 - elapsedMs);
    progressAnim.stopAnimation();
    progressAnim.setValue(progress);
    if (remainingMs <= 0) {
      progressAnim.setValue(1);
      return;
    }
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [current?.key, timerOn, progressAnim]);

  // BPM pulse to keep stage attention
  useEffect(() => {
    if (!current || !timerOn) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      return;
    }
    const bpm = Math.max(60, Math.min(current.song.bpm || 120, 200));
    const beatMs = Math.round(60000 / bpm);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: Math.max(80, beatMs * 0.18),
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: Math.max(120, beatMs * 0.82),
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [current?.key, current?.song.bpm, timerOn, pulseAnim]);

  const songDuration = Math.max(current?.song.durationSec ?? 1, 1);
  const songProgress = Math.min(1, songElapsedSec / songDuration);
  const songRemaining = Math.max(0, songDuration - songElapsedSec);
  const setTargetSec = current
    ? (sets[current.setIndex]?.targetMinutes ?? 45) * 60
    : 0;
  const setPlayedSec = current
    ? (() => {
        const block = sets[current.setIndex];
        if (!block) return 0;
        const refs = [...block.songs]
          .sort((a, b) => a.order - b.order)
          .slice(0, current.songIndex + 1);
        return setDurationSec({ ...block, songs: refs }, songsById);
      })()
    : 0;
  const overrun = setPlayedSec > setTargetSec * 1.05;
  const nearEnd = songProgress >= 0.85;

  if (!current) {
    return (
      <View style={[styles.root, rootPad, { backgroundColor: c.background }]}>
        <Text style={[styles.empty, { color: c.textMuted }]}>{t('show.empty')}</Text>
        <Pressable onPress={onExit} style={styles.exitBtn} hitSlop={12}>
          <Text style={{ color: c.tint, fontWeight: '800' }}>{t('show.exit')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        rootPad,
        { backgroundColor: c.background, minHeight: height * 0.75 },
      ]}>
      <View style={styles.topBar}>
        <Text
          style={[styles.setLabel, { color: c.accent }]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {current.setName} · {current.songIndex + 1}/
          {sets[current.setIndex]?.songs.length ?? 0}
        </Text>
        <Pressable onPress={() => setTimerOn((v) => !v)} hitSlop={12} style={styles.topAction}>
          <Text
            style={{
              color: overrun ? c.tint : c.textMuted,
              fontWeight: '800',
              fontSize: 13,
            }}>
            {formatDuration(elapsedSec)}
            {overrun ? ` · ${t('show.overrun')}` : ''}
          </Text>
        </Pressable>
        <Pressable onPress={onExit} hitSlop={12} style={styles.topAction}>
          <Text style={{ color: c.tint, fontWeight: '800' }}>{t('show.exit')}</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.stage}
        onPress={() => setIndex((i) => Math.min(items.length - 1, i + 1))}>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={3}>
          {current.song.title}
        </Text>
        <Text style={[styles.artist, { color: c.textMuted }]}>{current.song.artist}</Text>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.metaRow}>
            <Text style={[styles.bpm, { color: nearEnd ? c.accent : c.tint }]}>
              {current.song.bpm}
            </Text>
            <Text style={[styles.bpmUnit, { color: nearEnd ? c.accent : c.tint }]}>BPM</Text>
          </View>
        </Animated.View>
        <Text style={[styles.key, { color: c.accent }]}>
          {current.song.key}{' '}
          {current.song.keyMode === 'major' ? t('repertoire.major') : t('repertoire.minor')}
        </Text>
        <Text style={{ color: c.textMuted, marginTop: 8 }}>
          {formatDuration(current.song.durationSec)} · {t(`genres.${current.song.genre}`)}
          {current.song.favorite ? ` · ★` : ''}
        </Text>
      </Pressable>

      <View style={styles.progressBlock}>
        <View style={styles.progressTimes}>
          <Text style={{ color: c.textMuted, fontWeight: '700', fontSize: 12 }}>
            {formatDuration(songElapsedSec)}
          </Text>
          <Text
            style={{
              color: nearEnd ? c.tint : c.textMuted,
              fontWeight: '800',
              fontSize: 12,
            }}>
            {timerOn ? t('show.remaining', { time: formatDuration(songRemaining) }) : t('show.paused')}
          </Text>
          <Text style={{ color: c.textMuted, fontWeight: '700', fontSize: 12 }}>
            {formatDuration(songDuration)}
          </Text>
        </View>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: c.surface, borderColor: c.border, width: progressWidth },
          ]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: nearEnd ? c.accent : c.tint,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, progressWidth],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.progressGlowWrap,
              {
                transform: [
                  {
                    translateX: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.max(progressWidth - 14, 0)],
                    }),
                  },
                ],
              },
            ]}>
            <Animated.View
              style={[
                styles.progressGlow,
                {
                  backgroundColor: nearEnd ? c.accent : c.tint,
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.08],
                    outputRange: [0.3, 0.85],
                  }),
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          </Animated.View>
        </View>
      </View>

      <View style={styles.nav}>
        <Pressable
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          style={[styles.navBtn, { borderColor: c.border }]}
          disabled={index === 0}>
          <Text style={{ color: index === 0 ? c.textMuted : c.text, fontWeight: '700' }}>
            {t('show.prev')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
          style={[styles.navBtn, { borderColor: c.border }]}
          disabled={index >= items.length - 1}>
          <Text
            style={{
              color: index >= items.length - 1 ? c.textMuted : c.text,
              fontWeight: '700',
            }}>
            {t('show.next')}
          </Text>
        </Pressable>
      </View>

      {next ? (
        <View style={[styles.nextBox, { borderColor: c.border }]}>
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>
            {t('show.upNext')}
          </Text>
          <Text style={{ color: c.text, fontWeight: '700', marginTop: 4 }} numberOfLines={1}>
            {next.song.title}
          </Text>
          <Text style={{ color: c.textMuted, marginTop: 2 }} numberOfLines={1}>
            {next.song.artist} · {next.song.bpm} BPM · {next.song.key}
          </Text>
        </View>
      ) : (
        <Text style={{ color: c.textMuted, textAlign: 'center', marginTop: 16 }}>
          {t('show.end')} · {formatMinutes(elapsedSec)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
    width: '100%',
  },
  setLabel: {
    flex: 1,
    minWidth: 0,
    fontWeight: '800',
    fontSize: 13,
  },
  topAction: {
    flexShrink: 0,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  artist: {
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 28,
    gap: 8,
  },
  bpm: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 70,
  },
  bpmUnit: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  key: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  progressBlock: {
    marginBottom: 8,
    gap: 8,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  progressGlowWrap: {
    position: 'absolute',
    left: 0,
    width: 14,
    height: 14,
  },
  progressGlow: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  nav: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  navBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextBox: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  empty: { textAlign: 'center', marginTop: 40 },
  exitBtn: { alignItems: 'center', marginTop: 16 },
});
