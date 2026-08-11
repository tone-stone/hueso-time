import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CreateSetlistWizard } from '@/components/CreateSetlistWizard';
import {
  Body,
  BrandMark,
  Card,
  Fab,
  GhostButton,
  MetaPill,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { createId, formatMinutes } from '@/lib/id';
import { setlistDurationSec } from '@/lib/setMath';
import type { Genre, SetBlock } from '@/types/models';

export default function SetlistsScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const router = useRouter();
  const {
    setlists,
    songs,
    songsById,
    upsertSetlist,
    deleteSetlist,
    settings,
  } = useApp();
  const [open, setOpen] = useState(false);

  async function saveWizard(payload: {
    name: string;
    venue?: string;
    genreFocus?: Genre;
    sets: SetBlock[];
  }) {
    const sets = payload.sets.map((set, i) => ({
      ...set,
      id: set.id.startsWith('tmp_') ? createId('set') : set.id,
      name: set.name || `Set ${i + 1}`,
    }));
    const created = await upsertSetlist({
      name: payload.name,
      venue: payload.venue,
      genreFocus: payload.genreFocus,
      sets,
    });
    setOpen(false);
    router.push(`/setlist/${created.id}`);
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
          <BrandMark subtitle={t('setlists.subtitle')} />
          <Title>{t('setlists.title')}</Title>
          <Subtitle>{t('setlists.subtitle')}</Subtitle>
        </View>
        <Fab onPress={() => setOpen(true)} />
      </View>

      <FlatList
        data={setlists}
        keyExtractor={(item) => item.id}
        style={{ width: '100%' }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, width: '100%' }}
        ListEmptyComponent={
          <Card>
            <Body muted>{t('setlists.empty')}</Body>
          </Card>
        }
        renderItem={({ item, index }) => {
          const total = setlistDurationSec(item.sets, songsById);
          const songCount = item.sets.reduce((n, s) => n + s.songs.length, 0);
          return (
            <Card index={index}>
              <Link href={`/setlist/${item.id}`} asChild>
                <Pressable>
                  <Text style={[styles.name, { color: c.text }]}>{item.name}</Text>
                  {item.venue ? (
                    <Text style={{ color: c.textMuted, marginTop: 2 }}>{item.venue}</Text>
                  ) : null}
                  <View style={styles.metaRow}>
                    <MetaPill accent label={`${item.sets.length} ${t('common.sets')}`} />
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
          <CreateSetlistWizard
            songs={songs}
            songsById={songsById}
            defaultSetCount={settings.defaultSetCount}
            defaultMinutes={settings.defaultSetMinutes}
            onSave={(payload) => void saveWizard(payload)}
            onCancel={() => setOpen(false)}
          />
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
  },
  name: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
});
