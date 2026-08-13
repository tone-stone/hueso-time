import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import { useTranslation } from 'react-i18next';

import { SetsTables } from '@/components/SetsTables';
import {
  Body,
  Chip,
  Field,
  GhostButton,
  PrimaryButton,
  Subtitle,
  Title,
  useDesktopWeb,
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

const SET_COUNT_OPTIONS = [2, 3, 4];
const MINUTES_OPTIONS = [30, 40, 45, 60];

type Step = 'filters' | 'preview';

export function CreateSetlistWizard({
  songs,
  songsById,
  defaultSetCount,
  defaultMinutes,
  defaultName,
  initialArtists,
  onSave,
  onCancel,
}: {
  songs: Song[];
  songsById: Map<string, Song>;
  defaultSetCount: number;
  defaultMinutes: number;
  defaultName?: string;
  initialArtists?: string[];
  onSave: (payload: {
    name: string;
    venue?: string;
    genreFocus?: Genre;
    sets: SetBlock[];
  }) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const desktop = useDesktopWeb();
  const artists = useMemo(() => uniqueArtists(songs), [songs]);

  const [step, setStep] = useState<Step>('filters');
  const [name, setName] = useState(defaultName ?? '');
  const [venue, setVenue] = useState('');
  const [setCount, setSetCount] = useState(defaultSetCount);
  const [targetMinutes, setTargetMinutes] = useState(defaultMinutes);
  const [filters, setFilters] = useState<SongFilters>(() => ({
    ...emptyFilters(),
    genres: ['rock'],
    artists: initialArtists ?? [],
  }));
  const [bpmPreset, setBpmPreset] = useState('any');
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');
  const [allowReuse, setAllowReuse] = useState(false);
  const [previewSets, setPreviewSets] = useState<SetBlock[] | null>(null);

  const appliedFilters = useMemo(
    () => withBpm(filters, bpmPreset, customMin, customMax),
    [filters, bpmPreset, customMin, customMax],
  );

  const matchedCount = useMemo(
    () => filterSongs(songs, appliedFilters).length,
    [songs, appliedFilters],
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

  function buildSets(): SetBlock[] | null {
    const result = generateRandomSets({
      songs,
      setCount,
      targetMinutes,
      filters: appliedFilters,
      allowReuse,
      preferVariety: true,
    });

    if (result.matchedCount === 0) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`${t('generate.noMatchTitle')}\n\n${t('generate.noMatchBody')}`);
      } else {
        Alert.alert(t('generate.noMatchTitle'), t('generate.noMatchBody'));
      }
      return null;
    }
    if (result.placedCount === 0) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`${t('generate.noPlaceTitle')}\n\n${t('generate.noPlaceBody')}`);
      } else {
        Alert.alert(t('generate.noPlaceTitle'), t('generate.noPlaceBody'));
      }
      return null;
    }
    return result.sets;
  }

  function onArmar() {
    const sets = buildSets();
    if (!sets) return;
    setPreviewSets(sets);
    setStep('preview');
  }

  function onRegenerate() {
    const sets = buildSets();
    if (!sets) return;
    setPreviewSets(sets);
  }

  function onConfirmSave() {
    if (!previewSets) return;
    onSave({
      name: name.trim() || t('setlists.variedShowName', { count: setCount, min: targetMinutes }),
      venue: venue.trim() || undefined,
      genreFocus: filters.genres[0],
      sets: previewSets,
    });
  }

  if (step === 'preview' && previewSets) {
    return (
      <NestableScrollContainer contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Title>{t('generate.previewTitle')}</Title>
        <Subtitle>
          {t('generate.previewSubtitle', {
            count: setCount,
            min: targetMinutes,
            songs: previewSets.reduce((n, s) => n + s.songs.length, 0),
          })}
        </Subtitle>

        <SetsTables
          sets={previewSets}
          songsById={songsById}
          nestable
          defaultExpanded={false}
          onReorderSongs={(setId, songIds) => {
            setPreviewSets((prev) =>
              (prev ?? []).map((block) =>
                block.id !== setId
                  ? block
                  : {
                      ...block,
                      songs: songIds.map((songId, order) => ({ songId, order })),
                    },
              ),
            );
          }}
        />

        <View style={{ gap: 10, marginTop: 18, maxWidth: desktop ? 360 : undefined }}>
          <PrimaryButton label={t('generate.saveShow')} onPress={onConfirmSave} />
          <PrimaryButton label={t('generate.again')} onPress={onRegenerate} />
          <GhostButton
            label={t('generate.backFilters')}
            onPress={() => setStep('filters')}
          />
          <GhostButton label={t('common.cancel')} onPress={onCancel} />
        </View>
      </NestableScrollContainer>
    );
  }

  const setupColumn = (
    <View style={[styles.column, desktop && styles.setupColumn]}>
      <Title>{t('setlists.newSetlist')}</Title>
      <Subtitle>{t('generate.createHint')}</Subtitle>

      <Field
        label={t('setlists.name')}
        value={name}
        onChangeText={setName}
        placeholder={t('setlists.variedShowName', { count: setCount, min: targetMinutes })}
      />
      <Field label={t('setlists.venue')} value={venue} onChangeText={setVenue} />

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
        {t('setlists.setCount')}
      </Text>
      <View style={styles.wrap}>
        {SET_COUNT_OPTIONS.map((n) => (
          <Chip
            key={n}
            label={`${n}`}
            selected={setCount === n}
            onPress={() => setSetCount(n)}
          />
        ))}
      </View>
      <Field
        label={t('generate.customSets')}
        value={String(setCount)}
        keyboardType="numeric"
        onChangeText={(v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) setSetCount(Math.min(6, Math.max(1, n)));
        }}
      />

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
        {t('setlists.targetMinutes')}
      </Text>
      <View style={styles.wrap}>
        {MINUTES_OPTIONS.map((n) => (
          <Chip
            key={n}
            label={`${n} ${t('common.minutes')}`}
            selected={targetMinutes === n}
            onPress={() => setTargetMinutes(n)}
          />
        ))}
      </View>
      <Field
        label={t('generate.customMinutes')}
        value={String(targetMinutes)}
        keyboardType="numeric"
        onChangeText={(v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) setTargetMinutes(Math.min(120, Math.max(10, n)));
        }}
      />

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

      <Text style={{ color: c.accent, fontWeight: '700', marginTop: 10, marginBottom: 16 }}>
        {t('generate.planSummary', {
          count: setCount,
          min: targetMinutes,
          matches: matchedCount,
        })}
      </Text>

      <View style={{ gap: 10 }}>
        <PrimaryButton label={t('generate.action')} onPress={onArmar} />
        <GhostButton
          label={t('generate.emptyOnly')}
          onPress={() =>
            onSave({
              name: name.trim() || 'Show',
              venue: venue.trim() || undefined,
              genreFocus: filters.genres[0],
              sets: Array.from({ length: setCount }, (_, i) => ({
                id: `tmp_${i}`,
                name: `Set ${i + 1}`,
                targetMinutes,
                songs: [],
              })),
            })
          }
        />
        <GhostButton label={t('common.cancel')} onPress={onCancel} />
      </View>
    </View>
  );

  const selectColumn = (
    <View
      style={[
        styles.column,
        desktop && styles.selectColumn,
        desktop && { borderColor: c.border, backgroundColor: c.surface },
      ]}>
      {desktop ? (
        <>
          <Text style={[styles.panelTitle, { color: c.text }]}>{t('setlists.selectPanelTitle')}</Text>
          <Body muted>{t('setlists.selectPanelHint')}</Body>
        </>
      ) : null}

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
        {t('generate.artist')}
      </Text>
      {artists.length === 0 ? (
        <Body muted>{t('repertoire.empty')}</Body>
      ) : (
        <View style={styles.wrap}>
          <Chip
            label={t('generate.anyVaried')}
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
    </View>
  );

  if (desktop) {
    return (
      <ScrollView contentContainerStyle={styles.desktopScroll}>
        <View style={styles.split}>
          {setupColumn}
          {selectColumn}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      {setupColumn}
      {selectColumn}
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
  desktopScroll: {
    paddingBottom: 48,
    paddingHorizontal: 4,
  },
  split: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    width: '100%',
  },
  column: {
    width: '100%',
  },
  setupColumn: {
    flex: 0.42,
    minWidth: 280,
    maxWidth: 420,
  },
  selectColumn: {
    flex: 1,
    minWidth: 320,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
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
