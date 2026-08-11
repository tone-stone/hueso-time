import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Body, Card, MetaPill, useThemeColors } from '@/components/ui';
import { formatDuration } from '@/lib/id';
import { setDurationSec } from '@/lib/setMath';
import type { SetBlock, Song } from '@/types/models';

export function SetsTables({
  sets,
  songsById,
}: {
  sets: SetBlock[];
  songsById: Map<string, Song>;
}) {
  const { t } = useTranslation();
  const c = useThemeColors();

  return (
    <View style={{ gap: 14 }}>
      {sets.map((block, index) => {
        const dur = setDurationSec(block, songsById);
        const targetSec = block.targetMinutes * 60;
        const over = dur > targetSec;

        return (
          <Card key={block.id} index={index} style={{ marginBottom: 0 }}>
            <View style={styles.head}>
              <Text style={[styles.setTitle, { color: c.text }]}>
                {t('setlists.setLabel', { n: index + 1 })}
              </Text>
              <View style={styles.pills}>
                <MetaPill accent label={t('setlists.target', { min: block.targetMinutes })} />
                <MetaPill label={formatDuration(dur)} />
                <MetaPill
                  label={`${block.songs.length} ${t('common.songs')}${over ? ` · ${t('setlists.overTarget')}` : ''}`}
                />
              </View>
            </View>

            <View style={[styles.tableHead, { borderColor: c.border, backgroundColor: c.backgroundAlt }]}>
              <Text style={[styles.th, styles.colN, { color: c.textMuted }]}>#</Text>
              <Text style={[styles.th, styles.colSong, { color: c.textMuted }]}>
                {t('repertoire.fields.title')}
              </Text>
              <Text style={[styles.th, styles.colArtist, { color: c.textMuted }]}>
                {t('repertoire.fields.artist')}
              </Text>
              <Text style={[styles.th, styles.colMeta, { color: c.textMuted }]}>BPM</Text>
              <Text style={[styles.th, styles.colMeta, { color: c.textMuted }]}>
                {t('repertoire.fields.key')}
              </Text>
              <Text style={[styles.th, styles.colTime, { color: c.textMuted }]}>
                {t('setlists.duration')}
              </Text>
            </View>

            {block.songs.length === 0 ? (
              <View style={styles.emptyRow}>
                <Body muted>{t('setlists.noSongsInSet')}</Body>
              </View>
            ) : (
              block.songs.map((ref, i) => {
                const song = songsById.get(ref.songId);
                if (!song) return null;
                const zebra = i % 2 === 1;
                return (
                  <View
                    key={`${block.id}_${ref.songId}`}
                    style={[
                      styles.tr,
                      {
                        borderColor: c.border,
                        backgroundColor: zebra ? c.backgroundAlt : 'transparent',
                      },
                    ]}>
                    <Text style={[styles.td, styles.colN, { color: c.textMuted }]}>{i + 1}</Text>
                    <Text style={[styles.td, styles.colSong, { color: c.text }]} numberOfLines={2}>
                      {song.title}
                    </Text>
                    <Text
                      style={[styles.td, styles.colArtist, { color: c.textMuted }]}
                      numberOfLines={1}>
                      {song.artist}
                    </Text>
                    <Text style={[styles.td, styles.colMeta, { color: c.accent }]}>{song.bpm}</Text>
                    <Text style={[styles.td, styles.colMeta, { color: c.text }]}>
                      {song.key}
                      {song.keyMode === 'minor' ? 'm' : ''}
                    </Text>
                    <Text style={[styles.td, styles.colTime, { color: c.textMuted }]}>
                      {formatDuration(song.durationSec)}
                    </Text>
                  </View>
                );
              })
            )}
          </Card>
        );
      })}
    </View>
  );
}

/** Horizontal scroll wrapper for narrow screens — tables stay readable. */
export function SetsTablesScroll({
  sets,
  songsById,
}: {
  sets: SetBlock[];
  songsById: Map<string, Song>;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ minWidth: 640, flex: 1 }}>
        <SetsTables sets={sets} songsById={songsById} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { marginBottom: 10 },
  setTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  th: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  td: { fontSize: 12, fontWeight: '600' },
  colN: { width: 28 },
  colSong: { flex: 1.4, paddingRight: 6 },
  colArtist: { flex: 1.1, paddingRight: 6 },
  colMeta: { width: 48, textAlign: 'center' },
  colTime: { width: 48, textAlign: 'right' },
  emptyRow: { paddingVertical: 14, paddingHorizontal: 8 },
});
