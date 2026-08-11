import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  Body,
  Card,
  GhostButton,
  MetaPill,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { formatDuration, formatMinutes } from '@/lib/id';
import { setDurationSec, setlistDurationSec } from '@/lib/setMath';
import type { SetBlock } from '@/types/models';

export default function SetlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const c = useThemeColors();
  const { setlists, songs, songsById, updateSetlistSets } = useApp();
  const setlist = setlists.find((s) => s.id === id);
  const [pickerSetId, setPickerSetId] = useState<string | null>(null);

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

  const usedIds = new Set(
    setlist.sets.flatMap((s) => s.songs.map((r) => r.songId)),
  );

  const available = songs.filter((s) => {
    if (setlist.genreFocus && s.genre !== setlist.genreFocus) {
      // still allow all, but sort focus first — show all
    }
    return true;
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: setlist.name }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Title>{setlist.name}</Title>
        <Subtitle>
          {t('setlists.totalShow')}: {formatMinutes(total)}
          {setlist.genreFocus ? ` · ${t(`genres.${setlist.genreFocus}`)}` : ''}
        </Subtitle>

        {setlist.sets.map((block, index) => {
          const dur = setDurationSec(block, songsById);
          const targetSec = block.targetMinutes * 60;
          const over = dur > targetSec;
          const remaining = Math.max(0, targetSec - dur);

          return (
            <Card key={block.id} style={{ marginBottom: 14 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.setTitle, { color: c.text }]}>
                  {t('setlists.setLabel', { n: index + 1 })}
                </Text>
                <MetaPill label={t('setlists.target', { min: block.targetMinutes })} />
              </View>

              <View style={styles.metaRow}>
                <MetaPill label={`${formatDuration(dur)}`} />
                <MetaPill
                  label={
                    over
                      ? t('setlists.overTarget')
                      : `${t('setlists.underTarget')}: ${formatDuration(remaining)}`
                  }
                />
              </View>

              <View
                style={[
                  styles.barTrack,
                  { backgroundColor: c.background, borderColor: c.border },
                ]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(100, (dur / targetSec) * 100)}%`,
                      backgroundColor: over ? c.warning : c.tint,
                    },
                  ]}
                />
              </View>

              {block.songs.length === 0 ? (
                <Body muted>{t('setlists.noSongsInSet')}</Body>
              ) : (
                block.songs.map((ref, i) => {
                  const song = songsById.get(ref.songId);
                  if (!song) return null;
                  return (
                    <View
                      key={`${block.id}_${ref.songId}`}
                      style={[styles.songRow, { borderColor: c.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: c.text, fontWeight: '700' }}>
                          {i + 1}. {song.title}
                        </Text>
                        <Text style={{ color: c.textMuted, marginTop: 2 }}>
                          {song.artist} · {song.bpm} BPM · {song.key} ·{' '}
                          {formatDuration(song.durationSec)}
                        </Text>
                      </View>
                      <GhostButton
                        label={t('setlists.removeFromSet')}
                        danger
                        onPress={() => void removeSong(block.id, song.id)}
                      />
                    </View>
                  );
                })
              )}

              <View style={{ marginTop: 10 }}>
                <PrimaryButton
                  label={t('setlists.addSongToSet')}
                  onPress={() => setPickerSetId(block.id)}
                />
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <Modal visible={!!pickerSetId} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <View style={{ padding: 16, flex: 1 }}>
            <Title>{t('setlists.pickSong')}</Title>
            <Subtitle>{t('repertoire.title')}</Subtitle>
            <ScrollView>
              {available.map((song) => {
                const already = usedIds.has(song.id);
                return (
                  <Card key={song.id} onPress={() => {
                    if (!pickerSetId) return;
                    void addSongToSet(pickerSetId, song.id);
                  }}>
                    <Text style={{ color: c.text, fontWeight: '700' }}>{song.title}</Text>
                    <Text style={{ color: c.textMuted, marginTop: 2 }}>
                      {song.artist} · {song.bpm} BPM · {song.key} ·{' '}
                      {t(`genres.${song.genre}`)}
                      {already ? ' · ✓' : ''}
                    </Text>
                  </Card>
                );
              })}
              {available.length === 0 ? (
                <Card>
                  <Body muted>{t('repertoire.empty')}</Body>
                </Card>
              ) : null}
            </ScrollView>
            <GhostButton label={t('common.cancel')} onPress={() => setPickerSetId(null)} />
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  setTitle: { fontSize: 18, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  barTrack: {
    height: 8,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: { height: '100%', borderRadius: 999 },
  songRow: {
    borderTopWidth: 1,
    paddingVertical: 10,
    gap: 8,
  },
});
