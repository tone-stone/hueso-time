import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, {
  NestableDraggableFlatList,
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';

import { Body, Card, MetaPill, useThemeColors } from '@/components/ui';
import { formatDuration } from '@/lib/id';
import { setDurationSec } from '@/lib/setMath';
import type { SetBlock, SetSongRef, Song } from '@/types/models';

type SongAction = {
  setId: string;
  songId: string;
};

type SongRow = {
  key: string;
  songId: string;
  song: Song;
};

function toRows(refs: SetSongRef[], songsById: Map<string, Song>): SongRow[] {
  return [...refs]
    .sort((a, b) => a.order - b.order)
    .map((ref) => {
      const song = songsById.get(ref.songId);
      if (!song) return null;
      return { key: ref.songId, songId: ref.songId, song };
    })
    .filter(Boolean) as SongRow[];
}

export function SetsTables({
  sets,
  songsById,
  onRemoveSong,
  onChangeSong,
  onAddSong,
  onReorderSongs,
  nestable = false,
  defaultExpanded = true,
  showMode = false,
}: {
  sets: SetBlock[];
  songsById: Map<string, Song>;
  onRemoveSong?: (action: SongAction) => void;
  onChangeSong?: (action: SongAction) => void;
  onAddSong?: (setId: string) => void;
  onReorderSongs?: (setId: string, songIds: string[]) => void;
  /** Use NestableDraggableFlatList when inside NestableScrollContainer. */
  nestable?: boolean;
  defaultExpanded?: boolean;
  /** Stage view: no edit actions, all sets expanded. */
  showMode?: boolean;
}) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const canEdit = !showMode && !!(onRemoveSong || onChangeSong || onReorderSongs);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev };
      for (const block of sets) {
        if (showMode) {
          next[block.id] = true;
        } else if (next[block.id] === undefined) {
          next[block.id] = defaultExpanded;
        }
      }
      return next;
    });
  }, [sets, defaultExpanded, showMode]);

  const List = nestable ? NestableDraggableFlatList : DraggableFlatList;
  const allowReorder = !showMode && !!onReorderSongs;

  return (
    <View style={{ gap: 14, width: '100%' }}>
      {sets.map((block, index) => {
        const dur = setDurationSec(block, songsById);
        const targetSec = block.targetMinutes * 60;
        const over = dur > targetSec;
        const expanded = open[block.id] ?? defaultExpanded;
        const rows = toRows(block.songs, songsById);

        return (
          <Card key={block.id} index={index} style={{ marginBottom: 0 }}>
            <Pressable
              onPress={() => {
                if (showMode) return;
                setOpen((prev) => ({ ...prev, [block.id]: !expanded }));
              }}
              style={styles.headPress}>
              <View style={styles.headTop}>
                <Text style={[styles.setTitle, { color: c.text }]}>
                  {block.name || t('setlists.setLabel', { n: index + 1 })}
                </Text>
                {!showMode ? (
                  <Text style={[styles.chevron, { color: c.accent }]}>
                    {expanded ? '▾' : '▸'}
                  </Text>
                ) : null}
              </View>
              <View style={styles.pills}>
                {!showMode ? (
                  <MetaPill accent label={t('setlists.target', { min: block.targetMinutes })} />
                ) : null}
                <MetaPill label={formatDuration(dur)} />
                <MetaPill
                  label={`${block.songs.length} ${t('common.songs')}${!showMode && over ? ` · ${t('setlists.overTarget')}` : ''}`}
                />
              </View>
              {!expanded && !showMode ? (
                <Text style={{ color: c.textMuted, marginTop: 8, fontSize: 12 }}>
                  {t('setlists.tapToExpand')}
                </Text>
              ) : null}
            </Pressable>

            {expanded ? (
              <View style={styles.body}>
                {rows.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <Body muted>{t('setlists.noSongsInSet')}</Body>
                  </View>
                ) : (
                  <>
                    {allowReorder ? (
                      <Text style={[styles.dragHint, { color: c.textMuted }]}>
                        {t('setlists.dragHint')}
                      </Text>
                    ) : null}
                    <List
                      data={rows}
                      keyExtractor={(item) => item.key}
                      scrollEnabled={false}
                      activationDistance={8}
                      containerStyle={{ width: '100%' }}
                      onDragEnd={({ data }) => {
                        if (!allowReorder) return;
                        onReorderSongs?.(
                          block.id,
                          data.map((row) => row.songId),
                        );
                      }}
                      renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<SongRow>) => {
                        const i = getIndex() ?? 0;
                        return (
                          <ScaleDecorator>
                            <Pressable
                              onLongPress={allowReorder ? drag : undefined}
                              delayLongPress={180}
                              disabled={isActive || showMode}
                              style={[
                                styles.songRow,
                                {
                                  borderColor: c.border,
                                  backgroundColor: isActive
                                    ? c.tintSoft
                                    : i % 2 === 1
                                      ? c.backgroundAlt
                                      : 'transparent',
                                  opacity: isActive ? 0.95 : 1,
                                },
                              ]}>
                              <View style={styles.songTop}>
                                {allowReorder ? (
                                  <Pressable onPressIn={drag} hitSlop={8} style={styles.handle}>
                                    <Text style={{ color: c.textMuted, fontSize: 16 }}>⠿</Text>
                                  </Pressable>
                                ) : null}
                                <Text style={[styles.songIndex, { color: c.textMuted }]}>
                                  {i + 1}.
                                </Text>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text
                                    style={[styles.songTitle, { color: c.text }]}
                                    numberOfLines={2}>
                                    {item.song.title}
                                  </Text>
                                  <Text
                                    style={{ color: c.textMuted, marginTop: 2 }}
                                    numberOfLines={1}>
                                    {item.song.artist}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.metaActions}>
                                <View style={[styles.pills, { flex: 1 }]}>
                                  <MetaPill accent label={`${item.song.bpm} BPM`} />
                                  <MetaPill
                                    label={`${item.song.key}${item.song.keyMode === 'minor' ? 'm' : ''}`}
                                  />
                                  {!showMode ? (
                                    <MetaPill label={formatDuration(item.song.durationSec)} />
                                  ) : null}
                                </View>
                                {canEdit && (onChangeSong || onRemoveSong) ? (
                                  <View style={styles.actions}>
                                    {onChangeSong ? (
                                      <Pressable
                                        onPress={() =>
                                          onChangeSong({
                                            setId: block.id,
                                            songId: item.songId,
                                          })
                                        }
                                        style={[styles.actionBtn, { borderColor: c.border }]}>
                                        <Text
                                          style={{
                                            color: c.text,
                                            fontWeight: '700',
                                            fontSize: 12,
                                          }}>
                                          {t('setlists.changeSong')}
                                        </Text>
                                      </Pressable>
                                    ) : null}
                                    {onRemoveSong ? (
                                      <Pressable
                                        onPress={() =>
                                          onRemoveSong({
                                            setId: block.id,
                                            songId: item.songId,
                                          })
                                        }
                                        style={[styles.actionBtn, { borderColor: c.tint }]}>
                                        <Text
                                          style={{
                                            color: c.tint,
                                            fontWeight: '700',
                                            fontSize: 12,
                                          }}>
                                          {t('setlists.removeFromSet')}
                                        </Text>
                                      </Pressable>
                                    ) : null}
                                  </View>
                                ) : null}
                              </View>
                            </Pressable>
                          </ScaleDecorator>
                        );
                      }}
                    />
                  </>
                )}

                {!showMode && onAddSong ? (
                  <Pressable
                    onPress={() => onAddSong(block.id)}
                    style={[
                      styles.addBtn,
                      { borderColor: c.tint, backgroundColor: c.tintSoft },
                    ]}>
                    <Text style={{ color: c.tint, fontWeight: '800' }}>
                      + {t('setlists.addSongToSet')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  headPress: { marginBottom: 2 },
  headTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  setTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  chevron: { fontSize: 22, fontWeight: '700', marginLeft: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
  body: { marginTop: 8 },
  emptyRow: { paddingVertical: 10 },
  dragHint: { fontSize: 12, marginBottom: 8 },
  songRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  songTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  handle: { paddingHorizontal: 4, paddingTop: 2 },
  songIndex: { fontSize: 13, fontWeight: '700', width: 22, marginTop: 2 },
  songTitle: { fontSize: 15, fontWeight: '700' },
  metaActions: { gap: 8 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
