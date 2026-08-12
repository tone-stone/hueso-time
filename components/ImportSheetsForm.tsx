import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Body,
  Field,
  GhostButton,
  PrimaryButton,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';

/** Playlist musical compartida (Canciones). */
export const DEFAULT_PLAYLIST_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1v-LNZv4MG8Lqjp5UA6j5MFZG3LpfwY5P/edit?usp=sharing';

export function ImportSheetsForm({
  onImport,
  onCancel,
  busy,
}: {
  onImport: (payload: { url: string; name: string }) => Promise<void>;
  onCancel: () => void;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const [url, setUrl] = useState(DEFAULT_PLAYLIST_SHEET_URL);
  const [name, setName] = useState('Playlist musical');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!url.trim()) {
      setError(t('sheetsImport.urlRequired'));
      return;
    }
    if (!/docs\.google\.com\/spreadsheets/i.test(url)) {
      setError(t('sheetsImport.invalidUrl'));
      return;
    }
    try {
      await onImport({ url: url.trim(), name: name.trim() });
    } catch (err) {
      const code = err instanceof Error ? err.message : 'error';
      if (code === 'sheet_not_public') setError(t('sheetsImport.notPublic'));
      else if (code === 'empty_sheet' || code === 'no_songs') setError(t('sheetsImport.noSongs'));
      else if (code === 'invalid_url') setError(t('sheetsImport.invalidUrl'));
      else setError(t('sheetsImport.error'));
    }
  }

  return (
    <View style={styles.wrap}>
      <Title>{t('sheetsImport.title')}</Title>
      <Subtitle>{t('sheetsImport.subtitle')}</Subtitle>
      <Body muted>{t('sheetsImport.formatHint')}</Body>

      <View style={{ marginTop: 12 }}>
        <Field
          label={t('sheetsImport.url')}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://docs.google.com/spreadsheets/d/..."
        />
        <Field
          label={t('sheetsImport.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('sheetsImport.namePlaceholder')}
        />
      </View>

      {error ? (
        <View style={[styles.err, { borderColor: c.tint }]}>
          <Body>{error}</Body>
        </View>
      ) : null}

      {busy ? (
        <ActivityIndicator color={c.tint} style={{ marginVertical: 16 }} />
      ) : (
        <View style={{ gap: 10, marginTop: 12 }}>
          <PrimaryButton label={t('sheetsImport.action')} onPress={() => void submit()} />
          <GhostButton label={t('common.cancel')} onPress={onCancel} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  err: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
});
