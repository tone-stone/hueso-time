import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GenerateSetsForm } from '@/components/GenerateSetsForm';
import { SetsTables } from '@/components/SetsTables';
import { ShowModeView } from '@/components/ShowModeView';
import { showToast } from '@/components/Toast';
import {
  Body,
  Card,
  Field,
  GhostButton,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { confirmDestructive } from '@/lib/confirm';
import { formatSetlistShareText } from '@/lib/exportSetlist';
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
  const { setlists, songs, songsById, updateSetlistSets, upsertSetlist } = useApp();
  const setlist = setlists.find((s) => s.id === id);
  const [picker, setPicker] = useState<PickerMode>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [showMode, setShowMode] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editDate, setEditDate] = useState('');

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

  function openEdit() {
    setEditName(setlist!.name);
    setEditVenue(setlist!.venue ?? '');
    setEditDate(setlist!.date ?? '');
    setEditOpen(true);
  }

  async function saveMeta() {
    if (!editName.trim()) return;
    await upsertSetlist(
      {
        name: editName.trim(),
        venue: editVenue.trim() || undefined,
        date: editDate.trim() || undefined,
        genreFocus: setlist!.genreFocus,
        sets: setlist!.sets,
      },
      setlist!.id,
    );
    setEditOpen(false);
    showToast(t('toast.setlistUpdated'));
  }

  async function shareSetlist() {
    const message = formatSetlistShareText(setlist!, songsById, {
      total: t('setlists.totalShow'),
      set: (n, name) => `${name || t('setlists.setLabel', { n })}`,
      bpm: 'BPM',
    });
    try {
      await Share.share({ message, title: setlist!.name });
    } catch {
      showToast(t('toast.shareFailed'));
    }
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
    showToast(t('toast.songAdded'));
  }

  async function replaceSongInSet(setId: string, oldSongId: string, newSongId: string) {
    if (newSongId === oldSongId) {
      setPicker(null);
      return;
    }

    const block = setlist!.sets.find((s) => s.id === setId);
    if (block?.songs.some((r) => r.songId === newSongId)) {
      showToast(t('toast.songAlreadyInSet'));
      return;
    }

    const sets = setlist!.sets.map((b) => {
      if (b.id !== setId) return b;
      return {
        ...b,
        songs: b.songs.map((r, i) =>
          r.songId === oldSongId ? { songId: newSongId, order: i } : { ...r, order: i },
        ),
      };
    });
    await persist(sets);
    setPicker(null);
    showToast(t('toast.songChanged'));
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
    showToast(t('toast.songRemoved'));
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
    confirmDestructive({
      title: t('common.confirmDelete'),
      message: song?.title ?? '',
      cancelLabel: t('common.no'),
      confirmLabel: t('common.yes'),
      onConfirm: () => void removeSong(setId, songId),
    });
  }

  async function applyGenerated(
    sets: SetBlock[],
    summary: { matched: number; placed: number },
  ) {
    await persist(sets);
    setGenerateOpen(false);
    showToast(
      t('setlists.generateDone', {
        placed: summary.placed,
        matched: summary.matched,
      }),
    );
  }

  const usedIds = new Set(setlist.sets.flatMap((s) => s.songs.map((r) => r.songId)));
  const targetMinutes = setlist.sets[0]?.targetMinutes ?? 45;
  const replacingId = picker?.type === 'replace' ? picker.songId : null;

  if (showMode) {
    return (
      <Screen>
        <Stack.Screen options={{ title: setlist.name, headerShown: false }} />
        <ShowModeView
          sets={setlist.sets}
          songsById={songsById}
          onExit={() => setShowMode(false)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: setlist.name }} />
      <NestableScrollContainer contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Title>{setlist.name}</Title>
        <Subtitle>
          {t('setlists.totalShow')}: {formatMinutes(total)}
          {setlist.venue ? ` · ${setlist.venue}` : ''}
          {setlist.date ? ` · ${setlist.date}` : ''}
          {setlist.genreFocus ? ` · ${t(`genres.${setlist.genreFocus}`)}` : ''}
        </Subtitle>

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setShowMode(false)}
            style={[
              styles.modeChip,
              {
                borderColor: c.tint,
                backgroundColor: c.tintSoft,
              },
            ]}>
            <Text style={{ color: c.tint, fontWeight: '700' }}>{t('setlists.editMode')}</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowMode(true)}
            style={[styles.modeChip, { borderColor: c.border }]}>
            <Text style={{ color: c.textMuted, fontWeight: '700' }}>{t('setlists.showMode')}</Text>
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <GhostButton label={t('common.edit')} onPress={openEdit} />
          <GhostButton label={t('setlists.share')} onPress={() => void shareSetlist()} />
        </View>

        <SetsTables
          sets={setlist.sets}
          songsById={songsById}
          nestable
          defaultExpanded={false}
          showMode={false}
          onRemoveSong={({ setId, songId }) => confirmRemove(setId, songId)}
          onChangeSong={({ setId, songId }) => setPicker({ type: 'replace', setId, songId })}
          onAddSong={(setId) => setPicker({ type: 'add', setId })}
          onReorderSongs={(setId, songIds) => void reorderSongs(setId, songIds)}
        />

        <View style={{ marginTop: 22, gap: 10 }}>
          <GhostButton
            label={t('setlists.generateRandom')}
            onPress={() => setGenerateOpen(true)}
          />
        </View>
      </NestableScrollContainer>

      <Modal visible={editOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <Title>{t('setlists.editMeta')}</Title>
            <Subtitle>{t('setlists.editMetaHint')}</Subtitle>
            <Field
              label={t('setlists.name')}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('setlists.namePlaceholder')}
            />
            <Field
              label={t('setlists.venue')}
              value={editVenue}
              onChangeText={setEditVenue}
              placeholder={t('setlists.venuePlaceholder')}
            />
            <Field
              label={t('setlists.date')}
              value={editDate}
              onChangeText={setEditDate}
              placeholder="2026-08-15"
            />
            <View style={{ gap: 10, marginTop: 12 }}>
              <PrimaryButton label={t('common.save')} onPress={() => void saveMeta()} />
              <GhostButton label={t('common.cancel')} onPress={() => setEditOpen(false)} />
            </View>
          </ScrollView>
        </Screen>
      </Modal>

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
                const blocked =
                  picker?.type === 'replace' && already && !isCurrent;
                return (
                  <Card
                    key={song.id}
                    onPress={() => {
                      if (!picker || blocked) return;
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
                      {isCurrent
                        ? ` · ${t('setlists.currentSong')}`
                        : already
                          ? ` · ${t('setlists.alreadyInShow')}`
                          : ''}{' '}
                      · {formatDuration(song.durationSec)}
                      {song.favorite ? ' · ★' : ''}
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

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  modeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
});
