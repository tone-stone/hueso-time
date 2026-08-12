import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CreateManualSetlistForm } from '@/components/CreateManualSetlistForm';
import { CreateSetlistWizard } from '@/components/CreateSetlistWizard';
import { ImportSheetsForm } from '@/components/ImportSheetsForm';
import { Waveform } from '@/components/AmbientBackground';
import { showToast } from '@/components/Toast';
import {
  Body,
  BrandMark,
  Card,
  Fab,
  GhostButton,
  MetaPill,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/ui';
import { confirmDestructive } from '@/lib/confirm';
import { useApp } from '@/context/AppContext';
import { createId, formatMinutes } from '@/lib/id';
import { setlistDurationSec } from '@/lib/setMath';
import type { Genre, SetBlock } from '@/types/models';

type CreateMode = 'choose' | 'manual' | 'generate' | null;

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
    createEmptySetlist,
    settings,
    importSetlistFromGoogleSheet,
  } = useApp();
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

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
    setCreateMode(null);
    showToast(t('toast.setlistCreated'));
    router.push(`/setlist/${created.id}`);
  }

  async function onCreateManual(payload: {
    name: string;
    venue?: string;
    setCount: number;
    targetMinutes: number;
  }) {
    const created = await createEmptySetlist({
      name: payload.name,
      venue: payload.venue,
      setCount: payload.setCount,
      targetMinutes: payload.targetMinutes,
    });
    setCreateMode(null);
    showToast(t('toast.setlistCreated'));
    router.push(`/setlist/${created.id}`);
  }

  async function onImportSheet(payload: { url: string; name: string }) {
    setImportBusy(true);
    try {
      const result = await importSetlistFromGoogleSheet(payload.url, payload.name);
      setImportOpen(false);
      showToast(
        t('sheetsImport.done', {
          songs: result.songsAdded,
          sets: result.setlist.sets.length,
        }),
      );
      router.push(`/setlist/${result.setlist.id}`);
    } finally {
      setImportBusy(false);
    }
  }

  function confirmDelete(id: string, label: string) {
    confirmDestructive({
      title: t('common.confirmDelete'),
      message: label,
      cancelLabel: t('common.no'),
      confirmLabel: t('common.yes'),
      onConfirm: () => {
        void deleteSetlist(id);
        showToast(t('toast.setlistDeleted'));
      },
    });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
          <BrandMark subtitle={t('setlists.subtitle')} showWave={false} />
          <Title>{t('setlists.title')}</Title>
          <Subtitle>{t('setlists.subtitle')}</Subtitle>
        </View>
        <View style={styles.headerTools}>
          <Waveform />
          <Fab onPress={() => setCreateMode('choose')} />
        </View>
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
            <View style={{ gap: 10, marginTop: 14 }}>
              <PrimaryButton
                label={t('setlists.createManual')}
                onPress={() => setCreateMode('manual')}
              />
              <GhostButton
                label={t('setlists.createGenerate')}
                onPress={() => setCreateMode('generate')}
              />
              <GhostButton
                label={t('sheetsImport.open')}
                onPress={() => setImportOpen(true)}
              />
            </View>
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

      <Modal
        visible={createMode === 'choose'}
        animationType="slide"
        presentationStyle="pageSheet">
        <Screen>
          <View style={{ padding: 16, gap: 12 }}>
            <Title>{t('setlists.newSetlist')}</Title>
            <Subtitle>{t('setlists.chooseCreate')}</Subtitle>
            <PrimaryButton
              label={t('setlists.createManual')}
              onPress={() => setCreateMode('manual')}
            />
            <PrimaryButton
              label={t('setlists.createGenerate')}
              onPress={() => setCreateMode('generate')}
            />
            <GhostButton
              label={t('sheetsImport.open')}
              onPress={() => {
                setCreateMode(null);
                setImportOpen(true);
              }}
            />
            <GhostButton label={t('common.cancel')} onPress={() => setCreateMode(null)} />
          </View>
        </Screen>
      </Modal>

      <Modal
        visible={createMode === 'manual'}
        animationType="slide"
        presentationStyle="pageSheet">
        <Screen>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CreateManualSetlistForm
              defaultSetCount={settings.defaultSetCount}
              defaultMinutes={settings.defaultSetMinutes}
              onCreate={(payload) => void onCreateManual(payload)}
              onCancel={() => setCreateMode(null)}
            />
          </ScrollView>
        </Screen>
      </Modal>

      <Modal
        visible={createMode === 'generate'}
        animationType="slide"
        presentationStyle="pageSheet">
        <Screen>
          <CreateSetlistWizard
            songs={songs}
            songsById={songsById}
            defaultSetCount={settings.defaultSetCount}
            defaultMinutes={settings.defaultSetMinutes}
            onSave={(payload) => void saveWizard(payload)}
            onCancel={() => setCreateMode(null)}
          />
        </Screen>
      </Modal>

      <Modal visible={importOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <ImportSheetsForm
              busy={importBusy}
              onCancel={() => setImportOpen(false)}
              onImport={onImportSheet}
            />
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
  name: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
});
