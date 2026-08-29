import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { GenerateSetsForm } from '@/components/GenerateSetsForm';
import { ShareSetlistMenu } from '@/components/ShareSetlistMenu';
import { isEmptyFilters } from '@/components/SongFilterFields';
import { SetsTables } from '@/components/SetsTables';
import { ShowModeView } from '@/components/ShowModeView';
import { showToast } from '@/components/Toast';
import {
  Body,
  Card,
  Chip,
  Divider,
  Field,
  GhostButton,
  ListGroup,
  ListRow,
  PageColumn,
  PrimaryButton,
  Screen,
  Segmented,
  Subtitle,
  Title,
  useDesktopWeb,
  useThemeColors,
} from '@/components/ui';
import { WebBackButton } from '@/components/WebTopNav';
import { FontFamily } from '@/constants/Fonts';
import { useApp } from '@/context/AppContext';
import { confirmDestructive } from '@/lib/confirm';
import { createId, formatDuration, formatMinutes } from '@/lib/id';
import { filterSongs } from '@/lib/randomSets';
import { setlistDurationSec } from '@/lib/setMath';
import type { SetBlock } from '@/types/models';

type PickerMode =
  | { type: 'add'; setId: string }
  | { type: 'replace'; setId: string; songId: string }
  | null;

const SHOW_MODE_OPTIONS = ['edit', 'show'] as const;
const MINUTES_OPTIONS = [30, 40, 45, 60];

export default function SetlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const c = useThemeColors();
  const desktop = useDesktopWeb();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setlists, songs, songsById, updateSetlistSets, upsertSetlist, deleteSetlist } = useApp();
  const setlist = setlists.find((s) => s.id === id);
  const [picker, setPicker] = useState<PickerMode>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [usePreferences, setUsePreferences] = useState(true);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [showMode, setShowMode] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editDate, setEditDate] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [addSetOpen, setAddSetOpen] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetMinutes, setNewSetMinutes] = useState(45);
  const [renameSetId, setRenameSetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/generate');
  }

  const total = useMemo(
    () => (setlist ? setlistDurationSec(setlist.sets, songsById) : 0),
    [setlist, songsById],
  );

  const hasSavedFilters = !!setlist?.songFilters && !isEmptyFilters(setlist.songFilters);

  useEffect(() => {
    if (!picker) return;
    setPickerQuery('');
    setUsePreferences(true);
  }, [picker]);

  const pickerSongs = useMemo(() => {
    let list = songs;
    if (usePreferences && hasSavedFilters && setlist?.songFilters) {
      list = filterSongs(list, setlist.songFilters);
    }
    const q = pickerQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q),
      );
    }
    return list;
  }, [songs, usePreferences, hasSavedFilters, setlist?.songFilters, pickerQuery]);

  if (!setlist) {
    return (
      <Screen>
        <View style={{ padding: 16, paddingTop: 24 }}>
          <Pressable onPress={goBack} hitSlop={12} style={{ marginBottom: 12 }}>
            <Text style={{ color: c.tint, fontWeight: '500', fontFamily: FontFamily.display }}>
              ← {t('common.back')}
            </Text>
          </Pressable>
          <Title>{t('common.empty')}</Title>
        </View>
      </Screen>
    );
  }

  const songCountTotal = setlist.sets.reduce((n, s) => n + s.songs.length, 0);

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
        songFilters: setlist!.songFilters,
        sets: setlist!.sets,
      },
      setlist!.id,
    );
    setEditOpen(false);
    showToast(t('toast.setlistUpdated'));
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

  function openAddSet() {
    setNewSetName('');
    setNewSetMinutes(setlist!.sets[setlist!.sets.length - 1]?.targetMinutes ?? 45);
    setAddSetOpen(true);
  }

  async function addSet() {
    const block: SetBlock = {
      id: createId('set'),
      name: newSetName.trim(),
      targetMinutes: newSetMinutes,
      songs: [],
    };
    await persist([...setlist!.sets, block]);
    setAddSetOpen(false);
    showToast(t('toast.setAdded'));
  }

  function openRenameSet(setId: string) {
    const block = setlist!.sets.find((s) => s.id === setId);
    setRenameValue(block?.name ?? '');
    setRenameSetId(setId);
  }

  async function saveRenameSet() {
    if (!renameSetId) return;
    const sets = setlist!.sets.map((b) =>
      b.id === renameSetId ? { ...b, name: renameValue.trim() } : b,
    );
    await persist(sets);
    setRenameSetId(null);
    showToast(t('toast.setRenamed'));
  }

  async function deleteSet(setId: string) {
    const sets = setlist!.sets.filter((b) => b.id !== setId);
    await persist(sets);
    showToast(t('toast.setDeleted'));
  }

  function confirmDeleteSet(setId: string) {
    if (setlist!.sets.length <= 1) {
      showToast(t('toast.setlistNeedsOneSet'));
      return;
    }
    const index = setlist!.sets.findIndex((s) => s.id === setId);
    const block = setlist!.sets[index];
    confirmDestructive({
      title: t('common.confirmDelete'),
      message: block?.name || t('setlists.setLabel', { n: index + 1 }),
      cancelLabel: t('common.no'),
      confirmLabel: t('common.yes'),
      onConfirm: () => void deleteSet(setId),
    });
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

  function confirmDeleteSetlist() {
    confirmDestructive({
      title: t('common.confirmDelete'),
      message: setlist!.name,
      cancelLabel: t('common.no'),
      confirmLabel: t('common.yes'),
      onConfirm: () => {
        void deleteSetlist(setlist!.id);
        setEditOpen(false);
        showToast(t('toast.setlistDeleted'));
        goBack();
      },
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
      <Screen safeTop={false}>
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
    <Screen safeTop={false}>
      <Stack.Screen
        options={{
          title: setlist.name,
          headerShown: !desktop,
          headerBackTitle: t('common.back'),
        }}
      />
      <PageColumn>
        <NestableScrollContainer
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: desktop ? 0 : 16,
            paddingTop: 12,
            paddingBottom: 20,
          }}>
          <WebBackButton onPress={goBack} />
          <View style={styles.headerRow}>
            {Platform.OS !== 'web' ? (
              <Pressable
                onPress={goBack}
                hitSlop={10}
                style={[styles.iconSquare, { borderColor: c.border }]}>
                <Text style={{ color: c.tint, fontSize: 17 }}>‹</Text>
              </Pressable>
            ) : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[styles.setlistName, { color: c.text }]}
                numberOfLines={1}>
                {setlist.name}
              </Text>
              <Text style={[styles.setlistMeta, { color: c.textMuted }]} numberOfLines={1}>
                {songCountTotal} {t('common.songs')} · {formatMinutes(total)}
                {setlist.venue ? ` · ${setlist.venue}` : ''}
                {setlist.date ? ` · ${setlist.date}` : ''}
                {setlist.genreFocus ? ` · ${t(`genres.${setlist.genreFocus}`)}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={openEdit}
              hitSlop={10}
              style={[styles.iconSquare, { borderColor: c.border }]}>
              <Text style={{ color: c.tint, fontSize: 15 }}>✎</Text>
            </Pressable>
            <Pressable
              onPress={() => setShareOpen(true)}
              hitSlop={10}
              style={[styles.iconSquare, { borderColor: c.border }]}>
              <Text style={{ color: c.tint, fontSize: 15 }}>↗</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 14, marginBottom: 16, alignItems: 'flex-start' }}>
            <Segmented
              options={SHOW_MODE_OPTIONS}
              labels={{ edit: t('setlists.editMode'), show: t('setlists.showMode') }}
              value={showMode ? 'show' : 'edit'}
              onChange={(next) => setShowMode(next === 'show')}
            />
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
            onAddSet={openAddSet}
            onRenameSet={openRenameSet}
            onDeleteSet={confirmDeleteSet}
          />
        </NestableScrollContainer>

        <View
          style={[
            styles.bottomBar,
            {
              borderTopColor: c.divider,
              backgroundColor: c.background,
              paddingBottom: 26 + insets.bottom,
            },
          ]}>
          <View style={{ flex: 1 }}>
            <GhostButton label={t('setlists.rollAgain')} onPress={() => setGenerateOpen(true)} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={t('common.save')}
              onPress={() => showToast(t('toast.setlistUpdated'))}
            />
          </View>
        </View>
      </PageColumn>

      <Modal visible={editOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen safeTop={false}>
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

            <Divider style={{ marginTop: 24, marginBottom: 18 }} />

            <ListGroup>
              <ListRow
                icon={<Text style={{ color: c.accentText, fontSize: 15 }}>🗑</Text>}
                label={t('setlists.deleteThisSetlist')}
                danger
                last
                onPress={confirmDeleteSetlist}
              />
            </ListGroup>
          </ScrollView>
        </Screen>
      </Modal>

      <Modal visible={!!picker} animationType="slide" presentationStyle="pageSheet">
        <Screen safeTop={false}>
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
            <Field
              label={t('common.search')}
              value={pickerQuery}
              onChangeText={setPickerQuery}
              placeholder={t('setlists.pickSongSearchPlaceholder')}
            />
            {hasSavedFilters ? (
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Chip
                  label={t('setlists.usePreferences')}
                  selected={usePreferences}
                  onPress={() => setUsePreferences((v) => !v)}
                />
              </View>
            ) : null}
            <ScrollView>
              {pickerSongs.map((song) => {
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
                    <Text style={{ color: c.text, fontWeight: '500', fontFamily: FontFamily.display }}>
                      {song.title}
                    </Text>
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
              ) : pickerSongs.length === 0 ? (
                <Card>
                  <Body muted>{t('setlists.pickSongNoMatches')}</Body>
                </Card>
              ) : null}
            </ScrollView>
            <GhostButton label={t('common.cancel')} onPress={() => setPicker(null)} />
          </View>
        </Screen>
      </Modal>

      <Modal visible={addSetOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen safeTop={false}>
          <View style={{ padding: 16, flex: 1 }}>
            <Title>{t('setlists.addSet')}</Title>
            <Subtitle>{t('setlists.addSetHint')}</Subtitle>
            <Field
              label={t('setlists.name')}
              value={newSetName}
              onChangeText={setNewSetName}
              placeholder={t('setlists.setLabel', { n: setlist.sets.length + 1 })}
            />
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
              {t('setlists.targetMinutes')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
              {MINUTES_OPTIONS.map((n) => (
                <Chip
                  key={n}
                  label={`${n} ${t('common.minutes')}`}
                  outlined={newSetMinutes === n}
                  onPress={() => setNewSetMinutes(n)}
                />
              ))}
            </View>
            <View style={{ gap: 10, marginTop: 18 }}>
              <PrimaryButton label={t('common.save')} onPress={() => void addSet()} />
              <GhostButton label={t('common.cancel')} onPress={() => setAddSetOpen(false)} />
            </View>
          </View>
        </Screen>
      </Modal>

      <Modal visible={!!renameSetId} animationType="slide" presentationStyle="pageSheet">
        <Screen safeTop={false}>
          <View style={{ padding: 16, flex: 1 }}>
            <Title>{t('setlists.renameSetTitle')}</Title>
            <Field
              label={t('setlists.name')}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder={t('setlists.namePlaceholder')}
            />
            <View style={{ gap: 10, marginTop: 18 }}>
              <PrimaryButton label={t('common.save')} onPress={() => void saveRenameSet()} />
              <GhostButton label={t('common.cancel')} onPress={() => setRenameSetId(null)} />
            </View>
          </View>
        </Screen>
      </Modal>

      <Modal visible={generateOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen safeTop={false}>
          <View style={{ padding: 16, flex: 1 }}>
            <Title>{t('setlists.generateRandom')}</Title>
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

      <ShareSetlistMenu
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        setlist={setlist}
        songsById={songsById}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  iconSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setlistName: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FontFamily.display,
  },
  setlistMeta: {
    fontSize: 11.5,
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FontFamily.display,
    letterSpacing: 1.4,
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
  },
});
