import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
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
  const { height } = useWindowDimensions();
  const items = useMemo(() => flatten(sets, songsById), [sets, songsById]);
  const [index, setIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [timerOn, setTimerOn] = useState(true);
  const started = useRef(Date.now());

  useEffect(() => {
    started.current = Date.now();
    setElapsedSec(0);
  }, []);

  useEffect(() => {
    if (!timerOn) return;
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [timerOn]);

  const current = items[index];
  const next = items[index + 1];
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

  if (!current) {
    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        <Text style={[styles.empty, { color: c.textMuted }]}>{t('show.empty')}</Text>
        <Pressable onPress={onExit} style={styles.exitBtn}>
          <Text style={{ color: c.tint, fontWeight: '800' }}>{t('show.exit')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.background, minHeight: height * 0.75 }]}>
      <View style={styles.topBar}>
        <Text style={{ color: c.accent, fontWeight: '800', fontSize: 13 }}>
          {current.setName} · {current.songIndex + 1}/
          {sets[current.setIndex]?.songs.length ?? 0}
        </Text>
        <Pressable onPress={() => setTimerOn((v) => !v)} hitSlop={8}>
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
        <Pressable onPress={onExit} hitSlop={8}>
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

        <View style={styles.metaRow}>
          <Text style={[styles.bpm, { color: c.tint }]}>{current.song.bpm}</Text>
          <Text style={[styles.bpmUnit, { color: c.tint }]}>BPM</Text>
        </View>
        <Text style={[styles.key, { color: c.accent }]}>
          {current.song.key}{' '}
          {current.song.keyMode === 'major' ? t('repertoire.major') : t('repertoire.minor')}
        </Text>
        <Text style={{ color: c.textMuted, marginTop: 8 }}>
          {formatDuration(current.song.durationSec)} · {t(`genres.${current.song.genre}`)}
          {current.song.favorite ? ` · ★` : ''}
        </Text>
      </Pressable>

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
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  stage: {
    alignItems: 'center',
    paddingVertical: 24,
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
