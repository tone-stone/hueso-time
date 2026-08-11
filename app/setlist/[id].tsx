import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GenerateSetsForm } from '@/components/GenerateSetsForm';
import { SetsTables } from '@/components/SetsTables';
import {
  Body,
  BrandMark,
  Card,
  GhostButton,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { formatDuration, formatMinutes } from '@/lib/id';
import { setlistDurationSec } from '@/lib/setMath';
import type { SetBlock } from '@/types/models';

export default function SetlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const c = useThemeColors();
  const { setlists, songs, songsById, updateSetlistSets } = useApp();
  const setlist = setlists.find((s) => s.id === id);
  const [pickerSetId, setPickerSetId] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  const total = useMemo(
    () => (setlist ? setlistDurationSec(setlist.sets, songsById) : 0),
    [setlist, songsById],
  );

  if (!setlist) {
    return (
      <Screen>
        <View style={{ padding: 16 }}>
          <Title>{t('common.empty')}</Title>
        </View>
      </Screen>
    );
  }

  async function persist(sets: SetBlock[]) {
    await updateSetlistSets(setlist!.id, sets);
  }

  async function addSongToSet(setId: string, songId: string) {
    const sets = setlist!.sets.map((block) => {
      if (block.id !== setId) return block;
      if (block.songs.some((r) => r.songId === songId)) return block;
      return {
        ...block,
        songs: [...block.songs, { songId, order: block.songs.length }],
      };
    });
    await persist(sets);
    setPickerSetId(null);
  }

  async function removeSong(setId: string, songId: string) {
    const sets = setlist!.sets.map((block) => {
      if (block.id !== setId) return block;
      return {
        ...block,
        songs: block.songs
          .filter((r) => r.songId !== songId)
          .map((r, i) => ({ ...r, order: i })),
      };
    });
    await persist(sets);
  }

  async function applyGenerated(
    sets: SetBlock[],
    summary: { matched: number; placed: number },
  ) {
    await persist(sets);
    setGenerateOpen(false);
    Alert.alert(
      t('generate.title'),
      t('setlists.generateDone', {
        placed: summary.placed,
        matched: summary.matched,
      }),
    );
  }

  const usedIds = new Set(setlist.sets.flatMap((s) => s.songs.map((r) => r.songId)));
  const targetMinutes = setlist.sets[0]?.targetMinutes ?? 45;

  return (
    <Screen>
      <Stack.Screen options={{ title: setlist.name }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <BrandMark />
        <Title>{setlist.name}</Title>
        <Subtitle>
          {t('setlists.totalShow')}: {formatMinutes(total)}
          {setlist.genreFocus ? ` · ${t(`genres.${setlist.genreFocus}`)}` : ''}
        </Subtitle>

        <View style={{ marginBottom: 14 }}>
          <PrimaryButton
            label={t('setlists.generateRandom')}
            onPress={() => setGenerateOpen(true)}
          />
        </View>

        <SetsTables sets={setlist.sets} songsById={songsById} />

        <View style={{ marginTop: 16, gap: 10 }}>
          {setlist.sets.map((block, index) => (
            <Card key={`edit_${block.id}`} index={index}>
              <Text style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>
                {t('setlists.setLabel', { n: index + 1 })}
              </Text>
              {block.songs.map((ref) => {
                const song = songsById.get(ref.songId);
                if (!song) return null;
                return (
                  <View key={ref.songId} style={styles.editRow}>
                    <Text style={{ color: c.textMuted, flex: 1 }} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <GhostButton
                      label={t('setlists.removeFromSet')}
                      danger
                      onPress={() => void removeSong(block.id, song.id)}
                    />
                  </View>
                );
              })}
              <PrimaryButton
                label={t('setlists.addSongToSet')}
                onPress={() => setPickerSetId(block.id)}
              />
            </Card>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!pickerSetId} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <View style={{ padding: 16, flex: 1 }}>
            <Title>{t('setlists.pickSong')}</Title>
            <Subtitle>{t('repertoire.title')}</Subtitle>
            <ScrollView>
              {songs.map((song) => {
                const already = usedIds.has(song.id);
                return (
                  <Card
                    key={song.id}
                    onPress={() => {
                      if (!pickerSetId) return;
                      void addSongToSet(pickerSetId, song.id);
                    }}>
                    <Text style={{ color: c.text, fontWeight: '700' }}>{song.title}</Text>
                    <Text style={{ color: c.textMuted, marginTop: 2 }}>
                      {song.artist} · {song.bpm} BPM · {song.key} ·{' '}
                      {t(`genres.${song.genre}`)}
                      {already ? ' · ✓' : ''} · {formatDuration(song.durationSec)}
                    </Text>
                  </Card>
                );
              })}
              {songs.length === 0 ? (
                <Card>
                  <Body muted>{t('repertoire.empty')}</Body>
                </Card>
              ) : null}
            </ScrollView>
            <GhostButton label={t('common.cancel')} onPress={() => setPickerSetId(null)} />
          </View>
        </Screen>
      </Modal>

      <Modal visible={generateOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <View style={{ padding: 16, flex: 1 }}>
            <Title>{t('generate.title')}</Title>
            <Subtitle>{t('setlists.generateRandom')}</Subtitle>
            <GenerateSetsForm
              songs={songs}
              setCount={setlist.sets.length}
              targetMinutes={targetMinutes}
              existingSets={setlist.sets}
              onGenerated={(sets, summary) => void applyGenerated(sets, summary)}
              onCancel={() => setGenerateOpen(false)}
            />
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
});
