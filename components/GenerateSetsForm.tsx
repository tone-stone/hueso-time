import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Body,
  Chip,
  Field,
  GhostButton,
  PrimaryButton,
  useThemeColors,
} from '@/components/ui';
import { GENRES, MUSICAL_KEYS } from '@/constants/Colors';
import {
  emptyFilters,
  filterSongs,
  generateRandomSets,
  uniqueArtists,
  type SongFilters,
} from '@/lib/randomSets';
import type { Genre, MusicalKey, SetBlock, Song } from '@/types/models';

const BPM_PRESETS: { id: string; labelKey: string; min?: number; max?: number }[] = [
  { id: 'any', labelKey: 'generate.bpmAny' },
  { id: 'slow', labelKey: 'generate.bpmSlow', max: 89 },
  { id: 'mid', labelKey: 'generate.bpmMid', min: 90, max: 119 },
  { id: 'up', labelKey: 'generate.bpmUp', min: 120, max: 139 },
  { id: 'fast', labelKey: 'generate.bpmFast', min: 140 },
];

export function GenerateSetsForm({
  songs,
  setCount,
  targetMinutes,
  existingSets,
  onGenerated,
  onCancel,
}: {
  songs: Song[];
  setCount: number;
  targetMinutes: number;
  existingSets?: SetBlock[];
  onGenerated: (sets: SetBlock[], summary: { matched: number; placed: number }) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const artists = useMemo(() => uniqueArtists(songs), [songs]);
  const [filters, setFilters] = useState<SongFilters>(emptyFilters());
  const [bpmPreset, setBpmPreset] = useState('any');
  const [allowReuse, setAllowReuse] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');

  const matchedCount = useMemo(
    () => filterSongs(songs, withBpm(filters, bpmPreset, customMin, customMax)).length,
    [songs, filters, bpmPreset, customMin, customMax],
  );

  function toggleArtist(artist: string) {
    setFilters((f) => ({
      ...f,
      artists: f.artists.includes(artist)
        ? f.artists.filter((a) => a !== artist)
        : [...f.artists, artist],
    }));
  }

  function toggleGenre(genre: Genre) {
    setFilters((f) => ({
      ...f,
      genres: f.genres.includes(genre)
        ? f.genres.filter((g) => g !== genre)
        : [...f.genres, genre],
    }));
  }

  function toggleKey(key: MusicalKey) {
    setFilters((f) => ({
      ...f,
      keys: f.keys.includes(key) ? f.keys.filter((k) => k !== key) : [...f.keys, key],
    }));
  }

  function generate() {
    const applied = withBpm(filters, bpmPreset, customMin, customMax);
    const result = generateRandomSets({
      songs,
      setCount,
      targetMinutes,
      filters: applied,
      allowReuse,
      existingSets,
    });

    if (result.matchedCount === 0) {
      Alert.alert(t('generate.noMatchTitle'), t('generate.noMatchBody'));
      return;
    }
    if (result.placedCount === 0) {
      Alert.alert(t('generate.noPlaceTitle'), t('generate.noPlaceBody'));
      return;
    }

    onGenerated(result.sets, {
      matched: result.matchedCount,
      placed: result.placedCount,
    });
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <Body muted>{t('generate.hint')}</Body>

      <Text style={[styles.sectionLabel, { color: c.textMuted, marginTop: 16 }]}>
        {t('generate.artist')}
      </Text>
      {artists.length === 0 ? (
        <Body muted>{t('repertoire.empty')}</Body>
      ) : (
        <View style={styles.wrap}>
          <Chip
            label={t('generate.any')}
            selected={filters.artists.length === 0}
            onPress={() => setFilters((f) => ({ ...f, artists: [] }))}
          />
          {artists.map((artist) => (
            <Chip
              key={artist}
              label={artist}
              selected={filters.artists.includes(artist)}
              onPress={() => toggleArtist(artist)}
            />
          ))}
        </View>
      )}

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
        {t('generate.genre')}
      </Text>
      <View style={styles.wrap}>
        <Chip
          label={t('generate.any')}
          selected={filters.genres.length === 0}
          onPress={() => setFilters((f) => ({ ...f, genres: [] }))}
        />
        {GENRES.map((g) => (
          <Chip
            key={g}
            label={t(`genres.${g}`)}
            selected={filters.genres.includes(g)}
            onPress={() => toggleGenre(g)}
          />
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
        {t('generate.bpm')}
      </Text>
      <View style={styles.wrap}>
        {BPM_PRESETS.map((p) => (
          <Chip
            key={p.id}
            label={t(p.labelKey)}
            selected={bpmPreset === p.id}
            onPress={() => setBpmPreset(p.id)}
          />
        ))}
        <Chip
          label={t('generate.bpmCustom')}
          selected={bpmPreset === 'custom'}
          onPress={() => setBpmPreset('custom')}
        />
      </View>
      {bpmPreset === 'custom' ? (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field
              label={t('generate.bpmMin')}
              value={customMin}
              keyboardType="numeric"
              onChangeText={setCustomMin}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Field
              label={t('generate.bpmMax')}
              value={customMax}
              keyboardType="numeric"
              onChangeText={setCustomMax}
            />
          </View>
        </View>
      ) : null}

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
        {t('generate.key')}
      </Text>
      <View style={styles.wrap}>
        <Chip
          label={t('generate.any')}
          selected={filters.keys.length === 0}
          onPress={() => setFilters((f) => ({ ...f, keys: [] }))}
        />
        {MUSICAL_KEYS.map((k) => (
          <Chip
            key={k}
            label={k}
            selected={filters.keys.includes(k)}
            onPress={() => toggleKey(k)}
          />
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
        {t('generate.options')}
      </Text>
      <View style={styles.wrap}>
        <Chip
          label={t('generate.noReuse')}
          selected={!allowReuse}
          onPress={() => setAllowReuse(false)}
        />
        <Chip
          label={t('generate.allowReuse')}
          selected={allowReuse}
          onPress={() => setAllowReuse(true)}
        />
      </View>

      <Text style={{ color: c.accent, fontWeight: '700', marginTop: 8, marginBottom: 16 }}>
        {t('generate.matched', { count: matchedCount })}
      </Text>

      <View style={{ gap: 10 }}>
        <PrimaryButton label={t('generate.action')} onPress={generate} />
        <GhostButton label={t('common.cancel')} onPress={onCancel} />
      </View>
    </ScrollView>
  );
}

function withBpm(
  filters: SongFilters,
  preset: string,
  customMin: string,
  customMax: string,
): SongFilters {
  const next = { ...filters };
  const found = BPM_PRESETS.find((p) => p.id === preset);
  if (preset === 'custom') {
    next.bpmMin = customMin.trim() ? Number(customMin) : undefined;
    next.bpmMax = customMax.trim() ? Number(customMax) : undefined;
  } else if (found) {
    next.bpmMin = found.min;
    next.bpmMax = found.max;
  } else {
    next.bpmMin = undefined;
    next.bpmMax = undefined;
  }
  return next;
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  row: { flexDirection: 'row' },
});
