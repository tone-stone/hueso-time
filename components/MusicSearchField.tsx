import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { SymbolView } from 'expo-symbols';

import { Body, Field, useThemeColors } from '@/components/ui';
import { FontFamily } from '@/constants/Fonts';
import { formatDuration } from '@/lib/id';
import {
  mapGenreHint,
  searchMusic,
  type MusicSearchHit,
} from '@/lib/musicSearch';
import type { Genre } from '@/types/models';

const MUSIC_NOTE_ICON = { ios: 'music.note', android: 'music_note', web: 'music_note' } as const;

export type MusicSearchSelection = {
  title: string;
  artist: string;
  durationSec: number;
  imageUrl?: string;
  spotifyId?: string;
  externalUrl?: string;
  genre?: Genre;
};

export function MusicSearchField({
  onSelect,
}: {
  onSelect: (hit: MusicSearchSelection) => void;
}) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<MusicSearchHit[]>([]);
  const [source, setSource] = useState<'spotify' | 'itunes' | 'none'>('none');
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function onChangeQuery(text: string) {
    setQ(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void runSearch(text);
    }, 400);
  }

  async function runSearch(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSource('none');
      setError(null);
      setBusy(false);
      return;
    }

    const id = ++reqId.current;
    setBusy(true);
    setError(null);
    try {
      const { results: hits, source: src } = await searchMusic(trimmed);
      if (id !== reqId.current) return;
      setResults(hits);
      setSource(src);
      if (!hits.length) setError(t('musicSearch.empty'));
    } catch {
      if (id !== reqId.current) return;
      setResults([]);
      setSource('none');
      setError(t('musicSearch.error'));
    } finally {
      if (id === reqId.current) setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Field
        label={t('musicSearch.label')}
        value={q}
        onChangeText={onChangeQuery}
        placeholder={t('musicSearch.placeholder')}
        autoCorrect={false}
      />
      {busy ? <ActivityIndicator color={c.tint} style={{ marginVertical: 8 }} /> : null}
      {source !== 'none' && results.length > 0 ? (
        <Text style={[styles.sourceLabel, { color: c.textFaint }]}>
          {t('musicSearch.source', { source: source === 'spotify' ? 'Spotify' : 'iTunes' })}
        </Text>
      ) : null}
      {error ? <Body muted>{error}</Body> : null}

      <View style={{ gap: 6 }}>
        {results.map((hit) => (
          <Pressable
            key={hit.id}
            onPress={() => {
              onSelect({
                title: hit.title,
                artist: hit.artist,
                durationSec: hit.durationSec,
                imageUrl: hit.imageUrl,
                spotifyId: hit.spotifyId,
                externalUrl: hit.externalUrl,
                genre: mapGenreHint(hit.genreHint),
              });
              setQ(`${hit.title} — ${hit.artist}`);
              setResults([]);
              setError(null);
            }}
            style={({ pressed, hovered }: any) => [
              styles.hit,
              { borderColor: c.border, backgroundColor: c.surfaceElevated },
              hovered && { backgroundColor: 'rgba(233, 233, 237, 0.05)' },
              pressed && { backgroundColor: c.surface },
            ]}>
            <View style={[styles.art, { backgroundColor: c.surfaceElevated }]}>
              {hit.imageUrl ? (
                <Image source={{ uri: hit.imageUrl }} style={styles.artImg} />
              ) : (
                <SymbolView name={MUSIC_NOTE_ICON} size={15} tintColor={c.textFaint} />
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.hitTitle, { color: c.text }]} numberOfLines={1}>
                {hit.title}
              </Text>
              <Text style={[styles.hitMeta, { color: c.textMuted }]} numberOfLines={1}>
                {hit.artist} · {formatDuration(hit.durationSec)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Body muted>{t('musicSearch.hint')}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8, gap: 4 },
  sourceLabel: { fontSize: 11, marginBottom: 6, fontFamily: FontFamily.display },
  hit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  art: {
    width: 42,
    height: 42,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artImg: { width: 42, height: 42 },
  hitTitle: { fontSize: 14, fontWeight: '500' },
  hitMeta: { fontSize: 11.5, marginTop: 2, fontFamily: FontFamily.display },
});
