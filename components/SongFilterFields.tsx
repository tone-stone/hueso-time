import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Body, Chip, Field, useThemeColors } from '@/components/ui';
import { GENRES, MUSICAL_KEYS } from '@/constants/Colors';
import { FontFamily } from '@/constants/Fonts';
import { searchArtists } from '@/lib/musicSearch';
import { emptyFilters, uniqueArtists } from '@/lib/randomSets';
import type { Genre, MusicalKey, Song, SongFilters } from '@/types/models';

/** Chips shown before "collapsing" the artist list behind a "show more". */
const ARTIST_PAGE_SIZE = 8;

const BPM_PRESETS: { id: string; labelKey: string; min?: number; max?: number }[] = [
  { id: 'any', labelKey: 'generate.bpmAny' },
  { id: 'slow', labelKey: 'generate.bpmSlow', max: 89 },
  { id: 'mid', labelKey: 'generate.bpmMid', min: 90, max: 119 },
  { id: 'up', labelKey: 'generate.bpmUp', min: 120, max: 139 },
  { id: 'fast', labelKey: 'generate.bpmFast', min: 140 },
];

/** Artist/genre/BPM/key picker — shared by the manual-create and random-generate flows. */
export function SongFilterFields({
  songs,
  value,
  onChange,
}: {
  songs: Song[];
  value: SongFilters;
  onChange: (next: SongFilters) => void;
}) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const artists = useMemo(() => uniqueArtists(songs), [songs]);
  const [bpmPreset, setBpmPreset] = useState('any');
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');
  const [artistQuery, setArtistQuery] = useState('');
  const [showAllArtists, setShowAllArtists] = useState(false);
  const [externalArtists, setExternalArtists] = useState<{ id: string; name: string }[]>([]);
  const [externalArtistsBusy, setExternalArtistsBusy] = useState(false);

  const filteredArtists = useMemo(() => {
    const q = artistQuery.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => a.toLowerCase().includes(q));
  }, [artists, artistQuery]);
  const visibleArtists =
    artistQuery.trim() || showAllArtists
      ? filteredArtists
      : filteredArtists.slice(0, ARTIST_PAGE_SIZE);
  const hiddenArtistCount = filteredArtists.length - visibleArtists.length;

  /** Already-picked artists that aren't in the local repertoire (added via Spotify search). */
  const selectedExternalArtists = useMemo(
    () => value.artists.filter((a) => !artists.includes(a)),
    [value.artists, artists],
  );

  // When nothing in the repertoire matches, offer Spotify/iTunes artist
  // suggestions so you can tag a preference before loading their songs.
  useEffect(() => {
    const trimmed = artistQuery.trim();
    if (filteredArtists.length > 0 || trimmed.length < 2) {
      setExternalArtists([]);
      setExternalArtistsBusy(false);
      return;
    }
    let cancelled = false;
    setExternalArtistsBusy(true);
    const timer = setTimeout(() => {
      void searchArtists(trimmed)
        .then(({ results }) => {
          if (cancelled) return;
          setExternalArtists(results);
        })
        .catch(() => {
          if (!cancelled) setExternalArtists([]);
        })
        .finally(() => {
          if (!cancelled) setExternalArtistsBusy(false);
        });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [artistQuery, filteredArtists.length]);

  function applyBpm(preset: string, min: string, max: string) {
    const found = BPM_PRESETS.find((p) => p.id === preset);
    if (preset === 'custom') {
      onChange({ ...value, bpmMin: min.trim() ? Number(min) : undefined, bpmMax: max.trim() ? Number(max) : undefined });
    } else {
      onChange({ ...value, bpmMin: found?.min, bpmMax: found?.max });
    }
  }

  function toggleArtist(artist: string) {
    onChange({
      ...value,
      artists: value.artists.includes(artist)
        ? value.artists.filter((a) => a !== artist)
        : [...value.artists, artist],
    });
  }

  function toggleGenre(genre: Genre) {
    onChange({
      ...value,
      genres: value.genres.includes(genre)
        ? value.genres.filter((g) => g !== genre)
        : [...value.genres, genre],
    });
  }

  function toggleKey(key: MusicalKey) {
    onChange({
      ...value,
      keys: value.keys.includes(key) ? value.keys.filter((k) => k !== key) : [...value.keys, key],
    });
  }

  return (
    <View>
      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t('generate.artist')}</Text>
      {artists.length === 0 ? (
        <Body muted>{t('repertoire.empty')}</Body>
      ) : (
        <>
          {artists.length > ARTIST_PAGE_SIZE ? (
            <Field
              label={t('common.search')}
              value={artistQuery}
              onChangeText={(v) => {
                setArtistQuery(v);
                setShowAllArtists(false);
              }}
              placeholder={t('setlists.filterArtistPlaceholder')}
            />
          ) : null}
          <View style={styles.wrap}>
            <Chip
              label={t('generate.anyVaried')}
              selected={value.artists.length === 0}
              onPress={() => onChange({ ...value, artists: [] })}
            />
            {selectedExternalArtists.map((artist) => (
              <Chip key={artist} label={`${artist} ★`} selected onPress={() => toggleArtist(artist)} />
            ))}
            {visibleArtists.map((artist) => (
              <Chip
                key={artist}
                label={artist}
                selected={value.artists.includes(artist)}
                onPress={() => toggleArtist(artist)}
              />
            ))}
            {hiddenArtistCount > 0 ? (
              <Chip
                label={t('setlists.showMoreArtists', { count: hiddenArtistCount })}
                onPress={() => setShowAllArtists(true)}
              />
            ) : null}
          </View>
          {filteredArtists.length === 0 ? (
            <View>
              <Body muted>{t('setlists.pickSongNoMatches')}</Body>
              {artistQuery.trim().length >= 2 ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 6 }}>
                    {t('setlists.artistExternalHint')}
                  </Text>
                  {externalArtistsBusy ? (
                    <ActivityIndicator color={c.tint} style={{ marginVertical: 6 }} />
                  ) : null}
                  <View style={styles.wrap}>
                    {externalArtists.map((hit) => (
                      <Chip
                        key={hit.id}
                        label={hit.name}
                        selected={value.artists.includes(hit.name)}
                        onPress={() => toggleArtist(hit.name)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t('generate.genre')}</Text>
      <View style={styles.wrap}>
        <Chip
          label={t('generate.any')}
          selected={value.genres.length === 0}
          onPress={() => onChange({ ...value, genres: [] })}
        />
        {GENRES.map((g) => (
          <Chip
            key={g}
            label={t(`genres.${g}`)}
            selected={value.genres.includes(g)}
            onPress={() => toggleGenre(g)}
          />
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t('generate.bpm')}</Text>
      <View style={styles.wrap}>
        {BPM_PRESETS.map((p) => (
          <Chip
            key={p.id}
            label={t(p.labelKey)}
            outlined={bpmPreset === p.id}
            onPress={() => {
              setBpmPreset(p.id);
              applyBpm(p.id, customMin, customMax);
            }}
          />
        ))}
        <Chip
          label={t('generate.bpmCustom')}
          outlined={bpmPreset === 'custom'}
          onPress={() => {
            setBpmPreset('custom');
            applyBpm('custom', customMin, customMax);
          }}
        />
      </View>
      {bpmPreset === 'custom' ? (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field
              label={t('generate.bpmMin')}
              value={customMin}
              keyboardType="numeric"
              onChangeText={(v) => {
                setCustomMin(v);
                applyBpm('custom', v, customMax);
              }}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Field
              label={t('generate.bpmMax')}
              value={customMax}
              keyboardType="numeric"
              onChangeText={(v) => {
                setCustomMax(v);
                applyBpm('custom', customMin, v);
              }}
            />
          </View>
        </View>
      ) : null}

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t('generate.key')}</Text>
      <View style={styles.wrap}>
        <Chip
          label={t('generate.any')}
          selected={value.keys.length === 0}
          onPress={() => onChange({ ...value, keys: [] })}
        />
        {MUSICAL_KEYS.map((k) => (
          <Chip key={k} label={k} selected={value.keys.includes(k)} onPress={() => toggleKey(k)} />
        ))}
      </View>
    </View>
  );
}

export function isEmptyFilters(filters: SongFilters): boolean {
  const empty = emptyFilters();
  return (
    filters.artists.length === empty.artists.length &&
    filters.genres.length === empty.genres.length &&
    filters.keys.length === empty.keys.length &&
    filters.bpmMin === empty.bpmMin &&
    filters.bpmMax === empty.bpmMax
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FontFamily.display,
    marginBottom: 8,
    marginTop: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  row: { flexDirection: 'row' },
});
