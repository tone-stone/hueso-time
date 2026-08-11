import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SymbolView } from 'expo-symbols';

import {
  Body,
  Card,
  Chip,
  Field,
  GhostButton,
  MetaPill,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';
import { GENRES, KEY_MODES, MUSICAL_KEYS } from '@/constants/Colors';
import { DEFAULT_SONG_DURATION_SEC } from '@/constants/defaults';
import { useApp } from '@/context/AppContext';
import { formatDuration } from '@/lib/id';
import type { Genre, KeyMode, MusicalKey, Song, SongInput } from '@/types/models';

const emptyForm = (): SongInput => ({
  title: '',
  artist: '',
  bpm: 120,
  key: 'C',
  keyMode: 'major',
  genre: 'rock',
  durationSec: DEFAULT_SONG_DURATION_SEC,
  notes: '',
});

export default function RepertoireScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const { songs, upsertSong, deleteSong } = useApp();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<Genre | 'all'>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Song | null>(null);
  const [form, setForm] = useState<SongInput>(emptyForm());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((s) => {
      if (genre !== 'all' && s.genre !== genre) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q)
      );
    });
  }, [songs, query, genre]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setEditorOpen(true);
  }

  function openEdit(song: Song) {
    setEditing(song);
    setForm({
      title: song.title,
      artist: song.artist,
      bpm: song.bpm,
      key: song.key,
      keyMode: song.keyMode,
      genre: song.genre,
      durationSec: song.durationSec,
      notes: song.notes ?? '',
    });
    setEditorOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.artist.trim()) return;
    await upsertSong(
      {
        ...form,
        title: form.title.trim(),
        artist: form.artist.trim(),
        bpm: Number(form.bpm) || 0,
        durationSec: Number(form.durationSec) || DEFAULT_SONG_DURATION_SEC,
      },
      editing?.id,
    );
    setEditorOpen(false);
  }

  function confirmDelete(song: Song) {
    Alert.alert(t('common.confirmDelete'), song.title, [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: () => void deleteSong(song.id),
      },
    ]);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Title>{t('repertoire.title')}</Title>
          <Subtitle>{t('repertoire.subtitle')}</Subtitle>
        </View>
        <Pressable
          onPress={openCreate}
          style={[styles.fab, { backgroundColor: c.tint }]}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.pad}>
        <Field
          label={t('common.search')}
          value={query}
          onChangeText={setQuery}
          placeholder="Artist / title / key"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <Chip
            label={t('repertoire.allGenres')}
            selected={genre === 'all'}
            onPress={() => setGenre('all')}
          />
          {GENRES.map((g) => (
            <Chip
              key={g}
              label={t(`genres.${g}`)}
              selected={genre === g}
              onPress={() => setGenre(g)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <Card>
            <Body muted>{t('repertoire.empty')}</Body>
          </Card>
        }
        renderItem={({ item }) => (
          <Card onPress={() => openEdit(item)}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.songTitle, { color: c.text }]}>{item.title}</Text>
                <Text style={{ color: c.textMuted, marginTop: 2 }}>{item.artist}</Text>
              </View>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                <SymbolView
                  name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                  size={20}
                  tintColor={c.tint}
                />
              </Pressable>
            </View>
            <View style={styles.metaRow}>
              <MetaPill label={`${item.bpm} BPM`} />
              <MetaPill
                label={`${item.key} ${item.keyMode === 'major' ? t('repertoire.major') : t('repertoire.minor')}`}
              />
              <MetaPill label={t(`genres.${item.genre}`)} />
              <MetaPill label={formatDuration(item.durationSec)} />
            </View>
          </Card>
        )}
      />

      <Modal visible={editorOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <Title>
              {editing ? t('repertoire.editSong') : t('repertoire.addSong')}
            </Title>
            <Subtitle>{t('appName')}</Subtitle>

            <Field
              label={t('repertoire.fields.title')}
              value={form.title}
              onChangeText={(title) => setForm((f) => ({ ...f, title }))}
            />
            <Field
              label={t('repertoire.fields.artist')}
              value={form.artist}
              onChangeText={(artist) => setForm((f) => ({ ...f, artist }))}
            />
            <Field
              label={t('repertoire.fields.bpm')}
              value={String(form.bpm)}
              keyboardType="numeric"
              onChangeText={(v) => setForm((f) => ({ ...f, bpm: Number(v) || 0 }))}
            />
            <Field
              label={t('repertoire.fields.duration')}
              value={String(form.durationSec)}
              keyboardType="numeric"
              onChangeText={(v) =>
                setForm((f) => ({ ...f, durationSec: Number(v) || 0 }))
              }
            />
            <Field
              label={t('repertoire.fields.notes')}
              value={form.notes}
              onChangeText={(notes) => setForm((f) => ({ ...f, notes }))}
            />

            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
              {t('repertoire.fields.key')}
            </Text>
            <View style={styles.wrap}>
              {MUSICAL_KEYS.map((k) => (
                <Chip
                  key={k}
                  label={k}
                  selected={form.key === k}
                  onPress={() => setForm((f) => ({ ...f, key: k as MusicalKey }))}
                />
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
              {t('repertoire.fields.mode')}
            </Text>
            <View style={styles.wrap}>
              {KEY_MODES.map((m) => (
                <Chip
                  key={m}
                  label={m === 'major' ? t('repertoire.major') : t('repertoire.minor')}
                  selected={form.keyMode === m}
                  onPress={() => setForm((f) => ({ ...f, keyMode: m as KeyMode }))}
                />
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
              {t('repertoire.fields.genre')}
            </Text>
            <View style={styles.wrap}>
              {GENRES.map((g) => (
                <Chip
                  key={g}
                  label={t(`genres.${g}`)}
                  selected={form.genre === g}
                  onPress={() => setForm((f) => ({ ...f, genre: g }))}
                />
              ))}
            </View>

            <View style={{ gap: 10, marginTop: 16 }}>
              <PrimaryButton label={t('common.save')} onPress={() => void save()} />
              <GhostButton label={t('common.cancel')} onPress={() => setEditorOpen(false)} />
            </View>
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pad: { paddingHorizontal: 16 },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: -2 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start' },
  songTitle: { fontSize: 17, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
