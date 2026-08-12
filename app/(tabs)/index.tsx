import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SymbolView } from 'expo-symbols';

import {
  Body,
  BrandMark,
  Card,
  Chip,
  Fab,
  Field,
  GhostButton,
  MetaPill,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';
import { Waveform } from '@/components/AmbientBackground';
import { MusicSearchField } from '@/components/MusicSearchField';
import { showToast } from '@/components/Toast';
import { GENRES, KEY_MODES, MUSICAL_KEYS } from '@/constants/Colors';
import { DEFAULT_SONG_DURATION_SEC } from '@/constants/defaults';
import { useApp } from '@/context/AppContext';
import { confirmDestructive } from '@/lib/confirm';
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
  favorite: false,
  practiceStatus: 'practice',
  imageUrl: undefined,
  spotifyId: undefined,
  externalUrl: undefined,
});

type ArtistSection = {
  title: string;
  data: Song[];
};

export default function RepertoireScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const { songs, upsertSong, deleteSong } = useApp();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<Genre | 'all'>('all');
  const [artist, setArtist] = useState<string | 'all'>('all');
  const [genreOpen, setGenreOpen] = useState(false);
  const [artistOpen, setArtistOpen] = useState(false);
  const [artistQuery, setArtistQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Song | null>(null);
  const [form, setForm] = useState<SongInput>(emptyForm());

  const artists = useMemo(() => {
    const set = new Set(songs.map((s) => s.artist.trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [songs]);

  const filteredArtists = useMemo(() => {
    const q = artistQuery.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => a.toLowerCase().includes(q));
  }, [artists, artistQuery]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((s) => {
      if (genre !== 'all' && s.genre !== genre) return false;
      if (artist !== 'all' && s.artist.trim() !== artist) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q)
      );
    });
  }, [songs, query, genre, artist]);

  const sections = useMemo<ArtistSection[]>(() => {
    const map = new Map<string, Song[]>();
    for (const song of filtered) {
      const key = song.artist.trim() || t('repertoire.unknownArtist');
      const list = map.get(key) ?? [];
      list.push(song);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .map(([title, data]) => ({
        title,
        data: data.sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
        ),
      }));
  }, [filtered, t]);

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
      favorite: !!song.favorite,
      practiceStatus: song.practiceStatus ?? 'practice',
      imageUrl: song.imageUrl,
      spotifyId: song.spotifyId,
      externalUrl: song.externalUrl,
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
    showToast(editing ? t('toast.songUpdated') : t('toast.songSaved'));
  }

  function confirmDelete(song: Song) {
    confirmDestructive({
      title: t('common.confirmDelete'),
      message: song.title,
      cancelLabel: t('common.no'),
      confirmLabel: t('common.yes'),
      onConfirm: () => {
        void deleteSong(song.id);
        showToast(t('toast.songDeleted'));
      },
    });
  }

  function clearFilters() {
    setQuery('');
    setGenre('all');
    setArtist('all');
  }

  const hasFilters = genre !== 'all' || artist !== 'all' || query.trim().length > 0;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
          <BrandMark subtitle={t('repertoire.subtitle')} showWave={false} />
          <Title>{t('repertoire.title')}</Title>
          <Subtitle>{t('repertoire.subtitle')}</Subtitle>
        </View>
        <View style={styles.headerTools}>
          <Waveform />
          <Fab onPress={openCreate} />
        </View>
      </View>

      <View style={styles.pad}>
        <Field
          label={t('common.search')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('repertoire.searchPlaceholder')}
        />
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setArtistOpen(true)}
            style={[styles.filterBtn, { borderColor: c.border, backgroundColor: c.surface }]}>
            <Text style={{ color: c.text, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>
              {artist === 'all' ? t('repertoire.allArtists') : artist}
            </Text>
            <Text style={{ color: c.accent, marginLeft: 8 }}>▾</Text>
          </Pressable>
          <Pressable
            onPress={() => setGenreOpen(true)}
            style={[styles.filterBtn, { borderColor: c.border, backgroundColor: c.surface }]}>
            <Text style={{ color: c.text, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>
              {genre === 'all' ? t('repertoire.allGenres') : t(`genres.${genre}`)}
            </Text>
            <Text style={{ color: c.accent, marginLeft: 8 }}>▾</Text>
          </Pressable>
        </View>
        {hasFilters ? (
          <Pressable onPress={clearFilters} hitSlop={8} style={{ marginBottom: 8 }}>
            <Text style={{ color: c.tint, fontWeight: '700' }}>{t('repertoire.clearFilters')}</Text>
          </Pressable>
        ) : null}
      </View>

      <SectionList
        sections={sections.map((section) => ({
          ...section,
          data: collapsed[section.title] ? [] : section.data,
        }))}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        style={{ width: '100%' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, width: '100%' }}
        ListEmptyComponent={
          <Card>
            <Body muted>
              {songs.length === 0 ? t('repertoire.empty') : t('repertoire.emptyFilter')}
            </Body>
            {songs.length === 0 ? (
              <View style={{ marginTop: 14 }}>
                <PrimaryButton label={t('repertoire.addSong')} onPress={openCreate} />
              </View>
            ) : (
              <View style={{ marginTop: 14 }}>
                <GhostButton label={t('repertoire.clearFilters')} onPress={clearFilters} />
              </View>
            )}
          </Card>
        }
        renderSectionHeader={({ section }) => {
          const full = sections.find((s) => s.title === section.title);
          const count = full?.data.length ?? 0;
          const isCollapsed = !!collapsed[section.title];
          return (
            <Pressable
              onPress={() =>
                setCollapsed((prev) => ({
                  ...prev,
                  [section.title]: !prev[section.title],
                }))
              }
              style={[
                styles.sectionHeader,
                { backgroundColor: c.background, borderColor: c.border },
              ]}>
              <Text style={[styles.sectionTitle, { color: c.text }]} numberOfLines={1}>
                {section.title}
              </Text>
              <Text style={{ color: c.textMuted, fontWeight: '700' }}>
                {count} {isCollapsed ? '▸' : '▾'}
              </Text>
            </Pressable>
          );
        }}
        renderItem={({ item, index }) => (
          <Card index={index} onPress={() => openEdit(item)}>
            <View style={styles.rowBetween}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              ) : null}
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
              <MetaPill accent label={`${item.bpm} BPM`} />
              <MetaPill
                label={`${item.key} ${item.keyMode === 'major' ? t('repertoire.major') : t('repertoire.minor')}`}
              />
              <MetaPill label={t(`genres.${item.genre}`)} />
              <MetaPill label={formatDuration(item.durationSec)} />
            </View>
          </Card>
        )}
      />

      <Modal visible={artistOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <Title>{t('repertoire.filterArtist')}</Title>
            <Subtitle>{t('repertoire.filterArtistHint')}</Subtitle>
            <Field
              label={t('common.search')}
              value={artistQuery}
              onChangeText={setArtistQuery}
              placeholder={t('repertoire.artistSearchPlaceholder')}
            />
            <View style={styles.wrap}>
              <Chip
                label={t('repertoire.allArtists')}
                selected={artist === 'all'}
                onPress={() => {
                  setArtist('all');
                  setArtistOpen(false);
                  setArtistQuery('');
                }}
              />
              {filteredArtists.map((name) => (
                <Chip
                  key={name}
                  label={name}
                  selected={artist === name}
                  onPress={() => {
                    setArtist(name);
                    setArtistOpen(false);
                    setArtistQuery('');
                  }}
                />
              ))}
            </View>
            {filteredArtists.length === 0 ? (
              <Body muted>{t('repertoire.emptyFilter')}</Body>
            ) : null}
            <View style={{ marginTop: 16 }}>
              <GhostButton
                label={t('common.cancel')}
                onPress={() => {
                  setArtistOpen(false);
                  setArtistQuery('');
                }}
              />
            </View>
          </ScrollView>
        </Screen>
      </Modal>

      <Modal visible={genreOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <Title>{t('repertoire.filterGenre')}</Title>
            <Subtitle>{t('repertoire.filterGenreHint')}</Subtitle>
            <View style={styles.wrap}>
              <Chip
                label={t('repertoire.allGenres')}
                selected={genre === 'all'}
                onPress={() => {
                  setGenre('all');
                  setGenreOpen(false);
                }}
              />
              {GENRES.map((g) => (
                <Chip
                  key={g}
                  label={t(`genres.${g}`)}
                  selected={genre === g}
                  onPress={() => {
                    setGenre(g);
                    setGenreOpen(false);
                  }}
                />
              ))}
            </View>
            <View style={{ marginTop: 16 }}>
              <GhostButton label={t('common.cancel')} onPress={() => setGenreOpen(false)} />
            </View>
          </ScrollView>
        </Screen>
      </Modal>

      <Modal visible={editorOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <Title>
              {editing ? t('repertoire.editSong') : t('repertoire.addSong')}
            </Title>
            <Subtitle>{t('appName')}</Subtitle>

            <MusicSearchField
              onSelect={(hit) => {
                setForm((f) => ({
                  ...f,
                  title: hit.title,
                  artist: hit.artist,
                  durationSec: hit.durationSec,
                  imageUrl: hit.imageUrl,
                  spotifyId: hit.spotifyId,
                  externalUrl: hit.externalUrl,
                  genre: hit.genre ?? f.genre,
                }));
              }}
            />

            {form.imageUrl ? (
              <Image source={{ uri: form.imageUrl }} style={styles.previewArt} />
            ) : null}

            <Field
              label={t('repertoire.fields.title')}
              value={form.title}
              onChangeText={(title) => setForm((f) => ({ ...f, title }))}
            />
            <Field
              label={t('repertoire.fields.artist')}
              value={form.artist}
              onChangeText={(next) => setForm((f) => ({ ...f, artist: next }))}
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
              {t('practice.favorite')}
            </Text>
            <View style={styles.wrap}>
              <Chip
                label={t('practice.favorite')}
                selected={!!form.favorite}
                onPress={() => setForm((f) => ({ ...f, favorite: !f.favorite }))}
              />
            </View>

            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
              {t('repertoire.fields.status')}
            </Text>
            <View style={styles.wrap}>
              {(['ready', 'practice', 'showstopper'] as const).map((status) => (
                <Chip
                  key={status}
                  label={t(`practice.${status}`)}
                  selected={form.practiceStatus === status}
                  onPress={() => setForm((f) => ({ ...f, practiceStatus: status }))}
                />
              ))}
            </View>

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
    width: '100%',
    maxWidth: '100%',
    gap: 12,
  },
  headerTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 4,
  },
  pad: { paddingHorizontal: 16, width: '100%', maxWidth: '100%' },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 6,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    paddingRight: 8,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  previewArt: {
    width: 96,
    height: 96,
    borderRadius: 14,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  songTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
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
