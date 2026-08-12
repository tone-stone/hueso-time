import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

const SET_COUNT_OPTIONS = [1, 2, 3, 4];
const MINUTES_OPTIONS = [30, 40, 45, 60];

export function CreateManualSetlistForm({
  defaultSetCount,
  defaultMinutes,
  onCreate,
  onCancel,
}: {
  defaultSetCount: number;
  defaultMinutes: number;
  onCreate: (payload: {
    name: string;
    venue?: string;
    setCount: number;
    targetMinutes: number;
  }) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [setCount, setSetCount] = useState(defaultSetCount);
  const [targetMinutes, setTargetMinutes] = useState(defaultMinutes);

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

      <View style={{ gap: 10, marginTop: 18 }}>
        <PrimaryButton
          label={t('setlists.createManualAction')}
          onPress={() =>
            onCreate({
              name: name.trim() || t('setlists.manualDefaultName'),
              venue: venue.trim() || undefined,
              setCount,
              targetMinutes,
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
});
