import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Body,
  Chip,
  Field,
  GhostButton,
  PrimaryButton,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';
import { SongFilterFields, isEmptyFilters } from '@/components/SongFilterFields';
import { emptyFilters } from '@/lib/randomSets';
import type { Song, SongFilters } from '@/types/models';

const SET_COUNT_OPTIONS = [1, 2, 3, 4];
const MINUTES_OPTIONS = [30, 40, 45, 60];

export function CreateManualSetlistForm({
  songs,
  defaultSetCount,
  defaultMinutes,
  onCreate,
  onCancel,
}: {
  songs: Song[];
  defaultSetCount: number;
  defaultMinutes: number;
  onCreate: (payload: {
    name: string;
    venue?: string;
    setCount: number;
    targetMinutes: number;
    songFilters?: SongFilters;
  }) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [setCount, setSetCount] = useState(defaultSetCount);
  const [targetMinutes, setTargetMinutes] = useState(defaultMinutes);
  const [filters, setFilters] = useState<SongFilters>(emptyFilters());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterCount =
    filters.artists.length + filters.genres.length + filters.keys.length +
    (filters.bpmMin != null || filters.bpmMax != null ? 1 : 0);

  return (
    <View style={styles.wrap}>
      <Title>{t('setlists.createManual')}</Title>
      <Subtitle>{t('setlists.createManualHint')}</Subtitle>
      <Body muted>{t('setlists.createManualBody')}</Body>

      <View style={{ marginTop: 14 }}>
        <Field
          label={t('setlists.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('setlists.namePlaceholder')}
        />
        <Field
          label={t('setlists.venue')}
          value={venue}
          onChangeText={setVenue}
          placeholder={t('setlists.venuePlaceholder')}
        />
      </View>

      <Text style={[styles.label, { color: c.textMuted }]}>{t('setlists.setCount')}</Text>
      <View style={styles.wrapChips}>
        {SET_COUNT_OPTIONS.map((n) => (
          <Chip
            key={n}
            label={String(n)}
            selected={setCount === n}
            onPress={() => setSetCount(n)}
          />
        ))}
      </View>

      <Text style={[styles.label, { color: c.textMuted }]}>
        {t('setlists.targetMinutes')}
      </Text>
      <View style={styles.wrapChips}>
        {MINUTES_OPTIONS.map((n) => (
          <Chip
            key={n}
            label={`${n} ${t('common.minutes')}`}
            selected={targetMinutes === n}
            onPress={() => setTargetMinutes(n)}
          />
        ))}
      </View>

      <Pressable
        onPress={() => setFiltersOpen((v) => !v)}
        style={[styles.disclosure, { borderColor: c.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: c.textMuted, marginTop: 0, marginBottom: 2 }]}>
            {t('setlists.preferencesTitle')}
            {filterCount > 0 ? ` (${filterCount})` : ''}
          </Text>
          {!filtersOpen ? (
            <Text style={{ color: c.textMuted, fontSize: 12 }}>
              {t('setlists.preferencesHint')}
            </Text>
          ) : null}
        </View>
        <Text style={{ color: c.accent, fontSize: 18, fontWeight: '700' }}>
          {filtersOpen ? '▾' : '▸'}
        </Text>
      </Pressable>
      {filtersOpen ? (
        <View style={{ marginTop: 4 }}>
          <SongFilterFields songs={songs} value={filters} onChange={setFilters} />
        </View>
      ) : null}

      <View style={{ gap: 10, marginTop: 18 }}>
        <PrimaryButton
          label={t('setlists.createManualAction')}
          onPress={() =>
            onCreate({
              name: name.trim() || t('setlists.manualDefaultName'),
              venue: venue.trim() || undefined,
              setCount,
              targetMinutes,
              songFilters: isEmptyFilters(filters) ? undefined : filters,
            })
          }
        />
        <GhostButton label={t('common.cancel')} onPress={onCancel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  disclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
});
