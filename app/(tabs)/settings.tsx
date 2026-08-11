import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Body,
  Card,
  Chip,
  Field,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';
import { useApp } from '@/context/AppContext';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const { settings, updateSettings } = useApp();

  return (
    <Screen>
      <View style={styles.header}>
        <Title>{t('settings.title')}</Title>
        <Subtitle>{t('settings.about')}</Subtitle>
      </View>

      <View style={styles.pad}>
        <Card>
          <Text style={[styles.label, { color: c.textMuted }]}>{t('settings.language')}</Text>
          <View style={styles.row}>
            <Chip
              label={t('settings.spanish')}
              selected={settings.language === 'es'}
              onPress={() => void updateSettings({ language: 'es' })}
            />
            <Chip
              label={t('settings.english')}
              selected={settings.language === 'en'}
              onPress={() => void updateSettings({ language: 'en' })}
            />
          </View>
        </Card>

        <Card>
          <Text style={[styles.label, { color: c.textMuted }]}>{t('settings.defaults')}</Text>
          <Field
            label={t('settings.defaultSetMinutes')}
            keyboardType="numeric"
            value={String(settings.defaultSetMinutes)}
            onChangeText={(v) => {
              const n = Number(v);
              if (!Number.isNaN(n) && n > 0) {
                void updateSettings({ defaultSetMinutes: n });
              }
            }}
          />
          <Field
            label={t('settings.defaultSetCount')}
            keyboardType="numeric"
            value={String(settings.defaultSetCount)}
            onChangeText={(v) => {
              const n = Number(v);
              if (!Number.isNaN(n) && n > 0) {
                void updateSettings({ defaultSetCount: Math.min(6, n) });
              }
            }}
          />
        </Card>

        <Card>
          <Text style={[styles.label, { color: c.textMuted }]}>{t('settings.storage')}</Text>
          <Body muted>{t('settings.storageHint')}</Body>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8 },
  pad: { paddingHorizontal: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
