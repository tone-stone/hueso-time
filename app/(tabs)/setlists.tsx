import { useState } from 'react';
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
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

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
import { GENRES } from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { formatMinutes } from '@/lib/id';
import { setlistDurationSec } from '@/lib/setMath';
import type { Genre } from '@/types/models';

export default function SetlistsScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const { setlists, songsById, createEmptySetlist, deleteSetlist, settings } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [setCount, setSetCount] = useState(String(settings.defaultSetCount));
  const [targetMinutes, setTargetMinutes] = useState(String(settings.defaultSetMinutes));
  const [genreFocus, setGenreFocus] = useState<Genre | undefined>('rock');

  async function create() {
    const count = Math.min(6, Math.max(1, Number(setCount) || settings.defaultSetCount));
    const mins = Math.min(90, Math.max(15, Number(targetMinutes) || settings.defaultSetMinutes));
    await createEmptySetlist({
      name: name.trim() || 'Show',
      venue: venue.trim() || undefined,
      setCount: count,
      targetMinutes: mins,
      genreFocus,
    });
    setOpen(false);
    setName('');
    setVenue('');
  }

  function confirmDelete(id: string, label: string) {
    Alert.alert(t('common.confirmDelete'), label, [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: () => void deleteSetlist(id),
      },
    ]);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Title>{t('setlists.title')}</Title>
          <Subtitle>{t('setlists.subtitle')}</Subtitle>
        </View>
        <Pressable onPress={() => setOpen(true)} style={[styles.fab, { backgroundColor: c.tint }]}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={setlists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <Card>
            <Body muted>{t('setlists.empty')}</Body>
          </Card>
        }
        renderItem={({ item }) => {
          const total = setlistDurationSec(item.sets, songsById);
          const songCount = item.sets.reduce((n, s) => n + s.songs.length, 0);
          return (
            <Card>
              <Link href={`/setlist/${item.id}`} asChild>
                <Pressable>
                  <Text style={[styles.name, { color: c.text }]}>{item.name}</Text>
                  {item.venue ? (
                    <Text style={{ color: c.textMuted, marginTop: 2 }}>{item.venue}</Text>
                  ) : null}
                  <View style={styles.metaRow}>
                    <MetaPill label={`${item.sets.length} ${t('common.sets')}`} />
                    <MetaPill label={`${songCount} ${t('common.songs')}`} />
                    <MetaPill label={formatMinutes(total)} />
                    {item.genreFocus ? (
                      <MetaPill label={t(`genres.${item.genreFocus}`)} />
                    ) : null}
                  </View>
                </Pressable>
              </Link>
              <View style={{ marginTop: 10 }}>
                <GhostButton
                  label={t('common.delete')}
                  danger
                  onPress={() => confirmDelete(item.id, item.name)}
                />
              </View>
            </Card>
          );
        }}
      />

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <Title>{t('setlists.newSetlist')}</Title>
            <Subtitle>{t('setlists.subtitle')}</Subtitle>

            <Field
              label={t('setlists.name')}
              value={name}
              onChangeText={setName}
              placeholder="Friday covers @ Blue Room"
            />
            <Field
              label={t('setlists.venue')}
              value={venue}
              onChangeText={setVenue}
            />
            <Field
              label={t('setlists.setCount')}
              value={setCount}
              keyboardType="numeric"
              onChangeText={setSetCount}
            />
            <Field
              label={t('setlists.targetMinutes')}
              value={targetMinutes}
              keyboardType="numeric"
              onChangeText={setTargetMinutes}
            />

            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
              {t('setlists.genreFocus')}
            </Text>
            <View style={styles.wrap}>
              {GENRES.map((g) => (
                <Chip
                  key={g}
                  label={t(`genres.${g}`)}
                  selected={genreFocus === g}
                  onPress={() => setGenreFocus(g)}
                />
              ))}
            </View>

            <View style={{ gap: 10, marginTop: 16 }}>
              <PrimaryButton
                label={t('common.create')}
                onPress={() => void create()}
              />
              <GhostButton label={t('common.cancel')} onPress={() => setOpen(false)} />
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
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: -2 },
  name: { fontSize: 18, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
