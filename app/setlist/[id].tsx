import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
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

type PickerMode =
  | { type: 'add'; setId: string }
  | { type: 'replace'; setId: string; songId: string }
  | null;

export default function SetlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const c = useThemeColors();
  const { setlists, songs, songsById, updateSetlistSets } = useApp();
  const setlist = setlists.find((s) => s.id === id);
  const [picker, setPicker] = useState<PickerMode>(null);
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
    setPicker(null);
  }

  async function replaceSongInSet(setId: string, oldSongId: string, newSongId: string) {
    const sets = setlist!.sets.map((block) => {
      if (block.id !== setId) return block;
      if (newSongId !== oldSongId && block.songs.some((r) => r.songId === newSongId)) {
        // already in set — just remove old
        return {
          ...block,
          songs: block.songs
            .filter((r) => r.songId !== oldSongId)
            .map((r, i) => ({ ...r, order: i })),
        };
      }
      return {
        ...block,
        songs: block.songs.map((r, i) =>
          r.songId === oldSongId ? { songId: newSongId, order: i } : { ...r, order: i },
        ),
      };
    });
    await persist(sets);
    setPicker(null);
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

  async function reorderSongs(setId: string, songIds: string[]) {
    const sets = setlist!.sets.map((block) => {
      if (block.id !== setId) return block;
      return {
        ...block,
        songs: songIds.map((songId, order) => ({ songId, order })),
      };
    });
    await persist(sets);
  }

  function confirmRemove(setId: string, songId: string) {
    const song = songsById.get(songId);
    Alert.alert(t('common.confirmDelete'), song?.title ?? '', [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: () => void removeSong(setId, songId),
      },
    ]);
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
  const replacingId = picker?.type === 'replace' ? picker.songId : null;

  return (
    <Screen>
      <Stack.Screen options={{ title: setlist.name }} />
      <NestableScrollContainer contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
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

        <SetsTables
          sets={setlist.sets}
          songsById={songsById}
          nestable
          defaultExpanded={false}
          onRemoveSong={({ setId, songId }) => confirmRemove(setId, songId)}
          onChangeSong={({ setId, songId }) =>
            setPicker({ type: 'replace', setId, songId })
          }
          onAddSong={(setId) => setPicker({ type: 'add', setId })}
          onReorderSongs={(setId, songIds) => void reorderSongs(setId, songIds)}
        />
      </NestableScrollContainer>

      <Modal visible={!!picker} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <View style={{ padding: 16, flex: 1 }}>
            <Title>
              {picker?.type === 'replace'
                ? t('setlists.changeSong')
                : t('setlists.pickSong')}
            </Title>
            <Subtitle>
              {picker?.type === 'replace'
                ? t('setlists.changeSongHint')
                : t('repertoire.title')}
            </Subtitle>
            <ScrollView>
              {songs.map((song) => {
                const already = usedIds.has(song.id);
                const isCurrent = replacingId === song.id;
                return (
                  <Card
                    key={song.id}
                    onPress={() => {
                      if (!picker) return;
                      if (picker.type === 'add') {
                        void addSongToSet(picker.setId, song.id);
                        return;
                      }
                      void replaceSongInSet(picker.setId, picker.songId, song.id);
                    }}>
                    <Text style={{ color: c.text, fontWeight: '700' }}>{song.title}</Text>
                    <Text style={{ color: c.textMuted, marginTop: 2 }}>
                      {song.artist} · {song.bpm} BPM · {song.key} ·{' '}
                      {t(`genres.${song.genre}`)}
                      {isCurrent ? ` · ${t('setlists.currentSong')}` : already ? ' · ✓' : ''} ·{' '}
                      {formatDuration(song.durationSec)}
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
            <GhostButton label={t('common.cancel')} onPress={() => setPicker(null)} />
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
