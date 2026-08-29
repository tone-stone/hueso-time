import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Body, Chip, GhostButton, PrimaryButton, useThemeColors } from '@/components/ui';
import { FontFamily } from '@/constants/Fonts';
import { SongFilterFields } from '@/components/SongFilterFields';
import { emptyFilters, filterSongs, generateRandomSets } from '@/lib/randomSets';
import type { SetBlock, Song, SongFilters } from '@/types/models';

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
  const [filters, setFilters] = useState<SongFilters>(emptyFilters());
  const [allowReuse, setAllowReuse] = useState(false);

  const matchedCount = useMemo(() => filterSongs(songs, filters).length, [songs, filters]);

  function generate() {
    const result = generateRandomSets({
      songs,
      setCount,
      targetMinutes,
      filters,
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

      <SongFilterFields songs={songs} value={filters} onChange={setFilters} />

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t('generate.options')}</Text>
      <View style={styles.wrap}>
        <Chip
          label={t('generate.noReuse')}
          outlined={!allowReuse}
          onPress={() => setAllowReuse(false)}
        />
        <Chip
          label={t('generate.allowReuse')}
          outlined={allowReuse}
          onPress={() => setAllowReuse(true)}
        />
      </View>

      <Text
        style={{
          color: c.accent,
          fontWeight: '500',
          fontFamily: FontFamily.display,
          marginTop: 8,
          marginBottom: 16,
        }}>
        {t('generate.matched', { count: matchedCount })}
      </Text>

      <View style={{ gap: 10 }}>
        <PrimaryButton label={t('generate.action')} onPress={generate} />
        <GhostButton label={t('common.cancel')} onPress={onCancel} />
      </View>
    </ScrollView>
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
});
