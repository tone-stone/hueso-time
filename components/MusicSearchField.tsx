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

import { Body, Field, useThemeColors } from '@/components/ui';
import { formatDuration } from '@/lib/id';
import {
  mapGenreHint,
  searchMusic,
  type MusicSearchHit,
} from '@/lib/musicSearch';
import type { Genre } from '@/types/models';

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
        <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 6 }}>
          {t('musicSearch.source', { source: source === 'spotify' ? 'Spotify' : 'iTunes' })}
        </Text>
      ) : null}
      {error ? <Body muted>{error}</Body> : null}

      <View style={{ gap: 8 }}>
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
            style={[
              styles.hit,
              { borderColor: c.border, backgroundColor: c.surfaceElevated },
            ]}>
            {hit.imageUrl ? (
              <Image source={{ uri: hit.imageUrl }} style={styles.art} />
            ) : (
              <View style={[styles.art, { backgroundColor: c.tintSoft }]} />
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: c.text, fontWeight: '700' }} numberOfLines={1}>
                {hit.title}
              </Text>
              <Text style={{ color: c.textMuted, marginTop: 2 }} numberOfLines={1}>
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
  hit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
});
