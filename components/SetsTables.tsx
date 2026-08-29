import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, {
  NestableDraggableFlatList,
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';

import { Body, Card, Kicker, MetaPill, useThemeColors } from '@/components/ui';
import { FontFamily } from '@/constants/Fonts';
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
  onAddSet,
  onRenameSet,
  onDeleteSet,
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
  onAddSet?: () => void;
  onRenameSet?: (setId: string) => void;
  onDeleteSet?: (setId: string) => void;
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
  /** Which set block currently has a row lifted for reorder — dims its siblings. */
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);

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
        const progress = targetSec > 0 ? Math.min(1, dur / targetSec) : 0;
        const expanded = open[block.id] ?? defaultExpanded;
        const rows = toRows(block.songs, songsById);
        const isDraggingHere = draggingBlockId === block.id;

        return (
          <Card key={block.id} index={index} style={{ marginBottom: 0 }}>
            <Pressable
              onPress={() => {
                if (showMode) return;
                setOpen((prev) => ({ ...prev, [block.id]: !expanded }));
              }}
              style={styles.headPress}>
              <View style={styles.headTop}>
                <Kicker style={{ color: c.accent }}>
                  {block.name || t('setlists.setLabel', { n: index + 1 })}
                </Kicker>
                <View style={styles.headRight}>
                  <Text
                    style={[
                      styles.headMeta,
                      { color: c.textMuted, fontFamily: FontFamily.display },
                    ]}>
                    {formatDuration(dur)} / {block.targetMinutes} {t('common.minutes')}
                  </Text>
                  {!showMode ? (
                    <Text style={[styles.chevron, { color: c.accent }]}>
                      {expanded ? '▾' : '▸'}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: c.divider }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: c.tint,
                    },
                  ]}
                />
              </View>

              {!showMode ? (
                <View style={styles.pills}>
                  <MetaPill
                    label={`${block.songs.length} ${t('common.songs')}${over ? ` · ${t('setlists.overTarget')}` : ''}`}
                  />
                </View>
              ) : null}
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
                      onDragBegin={() => setDraggingBlockId(block.id)}
                      onDragEnd={({ data }) => {
                        setDraggingBlockId(null);
                        if (!allowReorder) return;
                        onReorderSongs?.(
                          block.id,
                          data.map((row) => row.songId),
                        );
                      }}
                      renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<SongRow>) => {
                        const i = getIndex() ?? 0;
                        const dimmed = isDraggingHere && !isActive;
                        return (
                          <ScaleDecorator>
                            <Pressable
                              onLongPress={allowReorder ? drag : undefined}
                              delayLongPress={180}
                              disabled={isActive || showMode}
                              style={[
                                styles.songRow,
                                {
                                  borderColor: isActive ? c.tint : c.border,
                                  borderWidth: isActive ? 1 : StyleSheet.hairlineWidth,
                                  backgroundColor: isActive
                                    ? c.surfaceAccent
                                    : i % 2 === 1
                                      ? c.backgroundAlt
                                      : 'transparent',
                                  opacity: dimmed ? 0.55 : 1,
                                  transform: isActive ? [{ rotate: '-0.4deg' }] : undefined,
                                },
                              ]}>
                              <View style={styles.songTop}>
                                {allowReorder ? (
                                  <Pressable onPressIn={drag} hitSlop={8} style={styles.handle}>
                                    <Text style={{ color: c.textMuted, fontSize: 16 }}>⠿</Text>
                                  </Pressable>
                                ) : null}
                                <Text
                                  style={[
                                    styles.songIndex,
                                    { color: c.textMuted, fontFamily: FontFamily.display },
                                  ]}>
                                  {String(i + 1).padStart(2, '0')}
                                </Text>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text
                                    style={[styles.songTitle, { color: c.text }]}
                                    numberOfLines={2}>
                                    {item.song.title}
                                  </Text>
                                  <Text
                                    style={[styles.songSub, { color: c.textMuted }]}
                                    numberOfLines={1}>
                                    {item.song.artist} · {item.song.bpm} BPM · {item.song.key}
                                    {item.song.keyMode === 'minor' ? 'm' : ''}
                                  </Text>
                                </View>
                                {canEdit && onChangeSong ? (
                                  <Pressable
                                    onPress={() =>
                                      onChangeSong({
                                        setId: block.id,
                                        songId: item.songId,
                                      })
                                    }
                                    style={({ hovered }: any) => [
                                      styles.iconBtn,
                                      { borderColor: hovered ? c.tint : c.border },
                                    ]}>
                                    <Text style={{ color: c.tint, fontSize: 14 }}>⇄</Text>
                                  </Pressable>
                                ) : null}
                                {canEdit && onRemoveSong ? (
                                  <Pressable
                                    onPress={() =>
                                      onRemoveSong({
                                        setId: block.id,
                                        songId: item.songId,
                                      })
                                    }
                                    style={({ hovered }: any) => [
                                      styles.iconBtn,
                                      { borderColor: hovered ? c.tint : c.border },
                                    ]}>
                                    <Text style={{ color: c.accentText, fontSize: 15 }}>×</Text>
                                  </Pressable>
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
                      { borderColor: c.tint, backgroundColor: c.tintFaint },
                    ]}>
                    <Text style={{ color: c.tint, fontWeight: '500', fontFamily: FontFamily.display }}>
                      + {t('setlists.addSongToSet')}
                    </Text>
                  </Pressable>
                ) : null}

                {!showMode && (onRenameSet || onDeleteSet) ? (
                  <View style={styles.setActionsRow}>
                    {onRenameSet ? (
                      <Pressable onPress={() => onRenameSet(block.id)} hitSlop={6}>
                        <Text
                          style={[
                            styles.setActionText,
                            { color: c.textMuted, fontFamily: FontFamily.display },
                          ]}>
                          ✎ {t('setlists.renameSet')}
                        </Text>
                      </Pressable>
                    ) : null}
                    {onDeleteSet ? (
                      <Pressable onPress={() => onDeleteSet(block.id)} hitSlop={6}>
                        <Text
                          style={[
                            styles.setActionText,
                            { color: c.accentText, fontFamily: FontFamily.display },
                          ]}>
                          🗑 {t('setlists.deleteSet')}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>
        );
      })}

      {!showMode && onAddSet ? (
        <Pressable
          onPress={onAddSet}
          style={[
            styles.addSetBtn,
            { borderColor: c.tint, backgroundColor: c.tintFaint },
          ]}>
          <Text style={{ color: c.tint, fontWeight: '500', fontFamily: FontFamily.display }}>
            + {t('setlists.addSet')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headPress: { marginBottom: 2 },
  headTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headMeta: { fontSize: 11.5 },
  chevron: { fontSize: 16, fontWeight: '500', marginLeft: 4 },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: { height: 3, borderRadius: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  body: { marginTop: 8 },
  emptyRow: { paddingVertical: 10 },
  dragHint: { fontSize: 12, marginBottom: 8 },
  songRow: {
    paddingVertical: 10,
    borderRadius: 8,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  songTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handle: { paddingHorizontal: 4, paddingVertical: 2 },
  songIndex: { fontSize: 12, width: 20 },
  songTitle: { fontSize: 13.5, fontWeight: '500' },
  songSub: { fontSize: 11.5, marginTop: 2 },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addSetBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  setActionsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  setActionText: { fontSize: 12, fontWeight: '500' },
});
