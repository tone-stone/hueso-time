import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SymbolView } from 'expo-symbols';

import {
  Body,
  Card,
  Chip,
  Fab,
  Field,
  GhostButton,
  Kicker,
  MetaPill,
  PageColumn,
  PageHeader,
  PrimaryButton,
  Screen,
  Segmented,
  Subtitle,
  Title,
  useDesktopWeb,
  useThemeColors,
} from '@/components/ui';
import { FontFamily } from '@/constants/Fonts';
import { useFloatingTabBarInset } from '@/lib/tabBarLayout';
import { Waveform } from '@/components/AmbientBackground';
import { MusicSearchField } from '@/components/MusicSearchField';
import { showToast } from '@/components/Toast';
import { GENRES, KEY_MODES, MUSICAL_KEYS } from '@/constants/Colors';
import { DEFAULT_SONG_DURATION_SEC } from '@/constants/defaults';
import { useApp } from '@/context/AppContext';
import { confirmDestructive } from '@/lib/confirm';
import { formatDuration } from '@/lib/id';
import { mapGenreHint, searchMusic, type MusicSearchHit } from '@/lib/musicSearch';
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

const PRACTICE_STATUSES = ['ready', 'practice', 'showstopper'] as const;

const SEARCH_ICON = { ios: 'magnifyingglass', android: 'search', web: 'search' } as const;
const MUSIC_NOTE_ICON = { ios: 'music.note', android: 'music_note', web: 'music_note' } as const;
const STAR_FILL_ICON = { ios: 'star.fill', android: 'star', web: 'star' } as const;
const STAR_OUTLINE_ICON = { ios: 'star', android: 'star_border', web: 'star_border' } as const;
const TRASH_ICON = { ios: 'trash', android: 'delete', web: 'delete' } as const;
const CLOSE_ICON = { ios: 'xmark', android: 'close', web: 'close' } as const;
const CARET_DOWN = { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' } as const;
const CARET_RIGHT = { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } as const;

type ArtistSection = {
  title: string;
  data: Song[];
};

/** "126 BPM · A mayor · 3:51" — the compact monospace meta line for a song row. */
function metaLine(song: Song, t: (key: string) => string) {
  const mode = song.keyMode === 'major' ? t('repertoire.major') : t('repertoire.minor');
  return `${song.bpm} BPM · ${song.key} ${mode} · ${formatDuration(song.durationSec)}`;
}

export default function RepertoireScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const desktop = useDesktopWeb();
  const tabBarInset = useFloatingTabBarInset();
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
  const [externalResults, setExternalResults] = useState<MusicSearchHit[]>([]);
  const [externalBusy, setExternalBusy] = useState(false);

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

  // When nothing in the repertoire matches what's typed, offer iTunes/Spotify
  // suggestions inline instead of leaving the user at a dead end.
  useEffect(() => {
    const trimmed = query.trim();
    if (filtered.length > 0 || trimmed.length < 2) {
      setExternalResults([]);
      setExternalBusy(false);
      return;
    }
    let cancelled = false;
    setExternalBusy(true);
    const timer = setTimeout(() => {
      void searchMusic(trimmed)
        .then(({ results }) => {
          if (cancelled) return;
          setExternalResults(results);
        })
        .catch(() => {
          if (!cancelled) setExternalResults([]);
        })
        .finally(() => {
          if (!cancelled) setExternalBusy(false);
        });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, filtered.length]);

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

  function openCreateFromHit(hit: MusicSearchHit) {
    setEditing(null);
    setForm({
      ...emptyForm(),
      title: hit.title,
      artist: hit.artist,
      durationSec: hit.durationSec,
      imageUrl: hit.imageUrl,
      spotifyId: hit.spotifyId,
      externalUrl: hit.externalUrl,
      genre: mapGenreHint(hit.genreHint) ?? emptyForm().genre,
    });
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
  const artistActive = artist !== 'all';
  const genreActive = genre !== 'all';

  return (
    <Screen>
      <PageColumn>
        <PageHeader
          title={t('repertoire.title')}
          subtitle={t('repertoire.subtitle')}
          brandSubtitle={t('repertoire.subtitle')}
          right={
            <>
              {!desktop ? <Waveform /> : null}
              <Fab onPress={openCreate} />
            </>
          }
        />

        <View style={[styles.pad, desktop && styles.padDesktop]}>
          <View style={[styles.searchBar, { borderColor: c.border, backgroundColor: c.surface }]}>
            <SymbolView name={SEARCH_ICON} size={15} tintColor={c.textFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('repertoire.searchPlaceholder')}
              placeholderTextColor={c.textFaint}
              style={[styles.searchInput, { color: c.text }]}
            />
          </View>
          <View style={styles.filterRow}>
            <Pressable
              onPress={() => setArtistOpen(true)}
              style={[
                styles.filterBtn,
                {
                  borderColor: artistActive ? c.tint : c.border,
                  backgroundColor: c.surface,
                },
              ]}>
              <Text
                style={[
                  styles.filterBtnText,
                  { color: artistActive ? c.accent : c.text },
                ]}
                numberOfLines={1}>
                {artist === 'all' ? t('repertoire.allArtists') : artist}
              </Text>
              <SymbolView name={CARET_DOWN} size={11} tintColor={c.accent} />
            </Pressable>
            <Pressable
              onPress={() => setGenreOpen(true)}
              style={[
                styles.filterBtn,
                {
                  borderColor: genreActive ? c.tint : c.border,
                  backgroundColor: c.surface,
                },
              ]}>
              <Text
                style={[
                  styles.filterBtnText,
                  { color: genreActive ? c.accent : c.text },
                ]}
                numberOfLines={1}>
                {genre === 'all' ? t('repertoire.allGenres') : t(`genres.${genre}`)}
              </Text>
              <SymbolView name={CARET_DOWN} size={11} tintColor={c.accent} />
            </Pressable>
          </View>
          {hasFilters ? (
            <Pressable onPress={clearFilters} hitSlop={8} style={styles.clearFilters}>
              <Text style={[styles.clearFiltersText, { color: c.accentText }]}>
                {t('repertoire.clearFilters')}
              </Text>
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
          contentContainerStyle={[
            styles.listContent,
            desktop && styles.listContentDesktop,
            !desktop && { paddingBottom: 32 + tabBarInset },
          ]}
          ItemSeparatorComponent={() => (
            <View style={[styles.rowDivider, { backgroundColor: c.divider }]} />
          )}
          ListEmptyComponent={
            <Card style={desktop ? styles.emptyCardDesktop : undefined}>
              <Body muted align={desktop ? 'center' : 'left'}>
                {songs.length === 0 ? t('repertoire.empty') : t('repertoire.emptyFilter')}
              </Body>
              {songs.length === 0 ? (
                <View style={[styles.emptyActions, desktop && styles.emptyActionsDesktop]}>
                  <PrimaryButton label={t('repertoire.addSong')} onPress={openCreate} />
                </View>
              ) : (
                <View style={[styles.emptyActions, desktop && styles.emptyActionsDesktop]}>
                  <GhostButton label={t('repertoire.clearFilters')} onPress={clearFilters} />
                </View>
              )}

              {query.trim().length >= 2 ? (
                <View style={{ marginTop: 18 }}>
                  <Kicker>{t('repertoire.externalSuggestions')}</Kicker>
                  {externalBusy ? (
                    <ActivityIndicator color={c.tint} style={{ marginVertical: 8 }} />
                  ) : null}
                  {!externalBusy && externalResults.length === 0 ? (
                    <Body muted>{t('musicSearch.empty')}</Body>
                  ) : null}
                  {externalResults.length > 0 ? (
                    <Body muted>{t('repertoire.externalHint')}</Body>
                  ) : null}
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {externalResults.map((hit) => (
                      <Pressable
                        key={hit.id}
                        onPress={() => openCreateFromHit(hit)}
                        style={[
                          styles.externalHit,
                          { borderColor: c.border, backgroundColor: c.surfaceElevated },
                        ]}>
                        {hit.imageUrl ? (
                          <Image source={{ uri: hit.imageUrl }} style={styles.thumb} />
                        ) : (
                          <View style={[styles.thumb, { backgroundColor: c.surfaceElevated }]}>
                            <SymbolView name={MUSIC_NOTE_ICON} size={16} tintColor={c.textFaint} />
                          </View>
                        )}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={[styles.externalHitTitle, { color: c.text }]}
                            numberOfLines={1}>
                            {hit.title}
                          </Text>
                          <Text
                            style={[styles.externalHitMeta, { color: c.textMuted }]}
                            numberOfLines={1}>
                            {hit.artist} · {formatDuration(hit.durationSec)}
                          </Text>
                        </View>
                        <Text style={[styles.externalHitAction, { color: c.accent }]}>
                          {t('repertoire.addSong')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
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
              style={[styles.sectionHeader, { backgroundColor: c.background }]}>
              <Kicker style={[styles.sectionTitle, { color: c.accent }]}>
                {section.title}
              </Kicker>
              <View style={styles.sectionMeta}>
                <Text style={[styles.sectionCount, { color: c.textFaint }]}>{count}</Text>
                <SymbolView
                  name={isCollapsed ? CARET_RIGHT : CARET_DOWN}
                  size={11}
                  tintColor={c.textFaint}
                />
              </View>
            </Pressable>
          );
        }}
        renderItem={({ item }) => {
          const status = item.practiceStatus ?? 'practice';
          return (
            <Pressable
              onPress={() => openEdit(item)}
              style={({ pressed, hovered }: any) => [
                styles.songRow,
                hovered && { backgroundColor: 'rgba(233, 233, 237, 0.05)' },
                pressed && { backgroundColor: c.surfaceElevated },
              ]}>
              <View style={[styles.thumb, { backgroundColor: c.surfaceElevated }]}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.thumbImg} />
                ) : (
                  <SymbolView name={MUSIC_NOTE_ICON} size={16} tintColor={c.textFaint} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.songTitleRow}>
                  <Text style={[styles.songTitle, { color: c.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.favorite ? (
                    <SymbolView name={STAR_FILL_ICON} size={11} tintColor={c.accent} />
                  ) : null}
                </View>
                <Text style={[styles.songMeta, { color: c.textMuted }]} numberOfLines={1}>
                  {metaLine(item, t)}
                </Text>
              </View>
              <View style={styles.statusTagWrap}>
                {status === 'ready' ? (
                  <MetaPill accent label={t('practice.ready')} />
                ) : status === 'showstopper' ? (
                  <Chip outlined label={t('practice.showstopper')} />
                ) : (
                  <MetaPill label={t('practice.practice')} />
                )}
              </View>
            </Pressable>
          );
        }}
      />
      </PageColumn>

      <Modal visible={artistOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen safeTop={false}>
          <ScrollView
            style={{ flex: 1, backgroundColor: c.surfaceSheet }}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
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
        <Screen safeTop={false}>
          <ScrollView
            style={{ flex: 1, backgroundColor: c.surfaceSheet }}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
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
        <Screen safeTop={false}>
          <ScrollView
            style={{ flex: 1, backgroundColor: c.surfaceSheet }}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <View style={[styles.grabHandle, { backgroundColor: c.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: c.text }]}>
                {editing ? t('repertoire.editSong') : t('repertoire.addSong')}
              </Text>
              <View style={styles.sheetHeaderActions}>
                {editing ? (
                  <Pressable onPress={() => confirmDelete(editing)} hitSlop={8}>
                    <SymbolView name={TRASH_ICON} size={18} tintColor={c.accentText} />
                  </Pressable>
                ) : null}
                <Pressable onPress={() => setEditorOpen(false)} hitSlop={8}>
                  <SymbolView name={CLOSE_ICON} size={18} tintColor={c.textMuted} />
                </Pressable>
              </View>
            </View>

            <View style={styles.coverRow}>
              <View
                style={[
                  styles.coverSlot,
                  { backgroundColor: c.surfaceElevated, borderColor: c.border },
                ]}>
                {form.imageUrl ? (
                  <Image source={{ uri: form.imageUrl }} style={styles.coverImg} />
                ) : (
                  <SymbolView name={MUSIC_NOTE_ICON} size={22} tintColor={c.textFaint} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
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
              </View>
            </View>

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

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Field
                  label={t('repertoire.fields.bpm')}
                  value={String(form.bpm)}
                  keyboardType="numeric"
                  onChangeText={(v) => setForm((f) => ({ ...f, bpm: Number(v) || 0 }))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label={t('repertoire.fields.duration')}
                  value={String(form.durationSec)}
                  keyboardType="numeric"
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, durationSec: Number(v) || 0 }))
                  }
                />
              </View>
            </View>

            <Kicker style={styles.sectionKicker}>{t('repertoire.fields.key')}</Kicker>
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
            <View style={styles.segmentedWrap}>
              <Segmented<KeyMode>
                options={KEY_MODES}
                labels={{ major: t('repertoire.major'), minor: t('repertoire.minor') }}
                value={form.keyMode}
                onChange={(next) => setForm((f) => ({ ...f, keyMode: next }))}
              />
            </View>

            <Kicker style={styles.sectionKicker}>{t('repertoire.fields.genre')}</Kicker>
            <View style={styles.wrap}>
              {GENRES.map((g) => (
                <Chip
                  key={g}
                  label={t(`genres.${g}`)}
                  selected={form.genre === g}
                  outlined={form.genre !== g}
                  onPress={() => setForm((f) => ({ ...f, genre: g }))}
                />
              ))}
            </View>

            <Kicker style={styles.sectionKicker}>{t('repertoire.fields.status')}</Kicker>
            <View style={styles.segmentedWrap}>
              <Segmented<(typeof PRACTICE_STATUSES)[number]>
                options={PRACTICE_STATUSES}
                labels={{
                  ready: t('practice.ready'),
                  practice: t('practice.practice'),
                  showstopper: t('practice.showstopper'),
                }}
                value={form.practiceStatus ?? 'practice'}
                onChange={(next) => setForm((f) => ({ ...f, practiceStatus: next }))}
              />
            </View>

            <Pressable
              onPress={() => setForm((f) => ({ ...f, favorite: !f.favorite }))}
              style={[styles.favoriteRow, { borderColor: c.border, backgroundColor: c.surface }]}>
              <Text style={[styles.favoriteLabel, { color: c.text }]}>
                {t('practice.favorite')}
              </Text>
              <SymbolView
                name={form.favorite ? STAR_FILL_ICON : STAR_OUTLINE_ICON}
                size={18}
                tintColor={form.favorite ? c.accent : c.textFaint}
              />
            </Pressable>

            <Field
              label={t('repertoire.fields.notes')}
              value={form.notes}
              onChangeText={(notes) => setForm((f) => ({ ...f, notes }))}
              multiline
              numberOfLines={3}
            />

            <View style={styles.footerRow}>
              <View style={{ flex: 1 }}>
                <GhostButton label={t('common.cancel')} onPress={() => setEditorOpen(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton label={t('common.save')} onPress={() => void save()} />
              </View>
            </View>
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16, width: '100%', maxWidth: '100%' },
  padDesktop: { paddingHorizontal: 0 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    width: '100%',
  },
  listContentDesktop: {
    paddingHorizontal: 0,
    paddingBottom: 48,
  },
  emptyCardDesktop: {
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
    marginTop: 16,
  },
  emptyActions: {
    marginTop: 14,
  },
  emptyActionsDesktop: {
    maxWidth: 280,
    alignSelf: 'center',
    width: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
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
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minWidth: 0,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
    fontFamily: FontFamily.display,
  },
  clearFilters: { marginBottom: 8, alignSelf: 'flex-start' },
  clearFiltersText: { fontSize: 12.5, fontWeight: '500', fontFamily: FontFamily.display },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: { flex: 1, paddingRight: 8 },
  sectionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionCount: { fontSize: 11.5, fontFamily: FontFamily.display },
  rowDivider: { height: 1, marginLeft: 52 },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  songTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  songTitle: { fontSize: 14, fontWeight: '500', flexShrink: 1 },
  songMeta: { fontSize: 11.5, marginTop: 2, fontFamily: FontFamily.display },
  statusTagWrap: { marginVertical: -8, marginRight: -8 },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: 42, height: 42 },
  externalHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  externalHitTitle: { fontSize: 13.5, fontWeight: '500' },
  externalHitMeta: { fontSize: 11.5, marginTop: 2, fontFamily: FontFamily.display },
  externalHitAction: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FontFamily.display,
  },
  grabHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 19, fontWeight: '500', letterSpacing: -0.02 * 19, fontFamily: FontFamily.display },
  sheetHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  coverRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  coverSlot: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImg: { width: 64, height: 64 },
  twoCol: { flexDirection: 'row', gap: 10 },
  sectionKicker: { marginBottom: 8, marginTop: 4 },
  segmentedWrap: { marginBottom: 14 },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  favoriteLabel: { fontSize: 13.5, fontWeight: '500' },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
