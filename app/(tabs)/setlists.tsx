import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CreateManualSetlistForm } from '@/components/CreateManualSetlistForm';
import { ImportSheetsForm } from '@/components/ImportSheetsForm';
import { Waveform } from '@/components/AmbientBackground';
import { showToast } from '@/components/Toast';
import {
  Body,
  Card,
  Fab,
  GhostButton,
  MetaPill,
  PageColumn,
  PageHeader,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  useDesktopWeb,
  useThemeColors,
} from '@/components/ui';
import { confirmDestructive } from '@/lib/confirm';
import { useFloatingTabBarInset } from '@/lib/tabBarLayout';
import { useApp } from '@/context/AppContext';
import { createId, formatMinutes } from '@/lib/id';
import { emptyFilters, generateRandomSets } from '@/lib/randomSets';
import { setlistDurationSec } from '@/lib/setMath';
import type { Genre, SetBlock, SongFilters } from '@/types/models';

type CreateMode = 'choose' | 'manual' | null;

export default function SetlistsScreen() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const desktop = useDesktopWeb();
  const tabBarInset = useFloatingTabBarInset();
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
    songFilters?: SongFilters;
  }) {
    const created = await createEmptySetlist({
      name: payload.name,
      venue: payload.venue,
      setCount: payload.setCount,
      targetMinutes: payload.targetMinutes,
      songFilters: payload.songFilters,
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

  /** "Generar aleatorio" — no wizard, no questions: build sets with defaults and save immediately. */
  async function quickGenerate() {
    const result = generateRandomSets({
      songs,
      setCount: settings.defaultSetCount,
      targetMinutes: settings.defaultSetMinutes,
      filters: emptyFilters(),
      allowReuse: false,
      preferVariety: true,
      smartEnergy: true,
    });

    if (result.matchedCount === 0) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`${t('generate.noMatchTitle')}\n\n${t('generate.noMatchBody')}`);
      } else {
        Alert.alert(t('generate.noMatchTitle'), t('generate.noMatchBody'));
      }
      return;
    }
    if (result.placedCount === 0) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`${t('generate.noPlaceTitle')}\n\n${t('generate.noPlaceBody')}`);
      } else {
        Alert.alert(t('generate.noPlaceTitle'), t('generate.noPlaceBody'));
      }
      return;
    }

    setCreateMode(null);
    await saveWizard({
      name: t('setlists.variedShowName', {
        count: settings.defaultSetCount,
        min: settings.defaultSetMinutes,
      }),
      sets: result.sets,
    });
  }

  const desktopCreateLeft = (
    <Card style={styles.createCard}>
      <Text style={[styles.panelTitle, { color: c.text }]}>{t('setlists.createPanelTitle')}</Text>
      <Body muted>{t('setlists.createPanelHint')}</Body>
      <View style={styles.createActions}>
        <PrimaryButton
          label={t('setlists.createGenerate')}
          onPress={() => void quickGenerate()}
          icon="🎲"
        />
        <GhostButton
          label={t('setlists.createManual')}
          onPress={() => setCreateMode('manual')}
        />
        <GhostButton
          label={t('sheetsImport.open')}
          onPress={() => setImportOpen(true)}
        />
      </View>
    </Card>
  );

  const desktopSelectRight = (
    <Card style={{ ...styles.selectCard, ...styles.selectCardWaiting }}>
      <Text style={[styles.panelTitle, { color: c.text }]}>{t('setlists.selectPanelTitle')}</Text>
      <View style={styles.selectWaitingBody}>
        <Body muted align="center">
          {t('setlists.selectPanelWaiting')}
        </Body>
      </View>
    </Card>
  );

  return (
    <Screen>
      <PageColumn maxWidth={1100}>
        <PageHeader
          title={t('setlists.title')}
          subtitle={t('setlists.subtitle')}
          brandSubtitle={t('setlists.subtitle')}
          onBack={
            desktop && createMode
              ? () => {
                  setCreateMode(null);
                }
              : undefined
          }
          right={
            <>
              {!desktop ? <Waveform /> : null}
              {!(desktop && createMode) ? (
                <Fab onPress={() => setCreateMode('choose')} />
              ) : null}
            </>
          }
        />

        {desktop && createMode === 'manual' ? (
          <View style={styles.inlineWorkspace}>
            <View style={styles.split}>
              <View style={styles.splitLeft}>
                <CreateManualSetlistForm
                  songs={songs}
                  defaultSetCount={settings.defaultSetCount}
                  defaultMinutes={settings.defaultSetMinutes}
                  onCreate={(payload) => void onCreateManual(payload)}
                  onCancel={() => setCreateMode(null)}
                />
              </View>
              <Card style={styles.selectCard}>
                <Text style={[styles.panelTitle, { color: c.text }]}>
                  {t('setlists.selectPanelTitle')}
                </Text>
                <Body muted>{t('setlists.createManualBody')}</Body>
              </Card>
            </View>
          </View>
        ) : null}

        {desktop && (createMode === 'choose' || (createMode === null && setlists.length === 0)) ? (
          <View style={styles.split}>
            {desktopCreateLeft}
            {desktopSelectRight}
          </View>
        ) : null}

        {!(desktop && createMode === 'manual') &&
        !(desktop && setlists.length === 0 && createMode === null) &&
        !(desktop && createMode === 'choose') ? (
          <FlatList
            data={setlists}
            keyExtractor={(item) => item.id}
            style={{ width: '100%' }}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              desktop && styles.listContentDesktop,
              !desktop && { paddingBottom: 32 + tabBarInset },
            ]}
            numColumns={desktop && setlists.length > 0 ? 2 : 1}
            key={desktop ? 'desktop-list' : 'mobile-list'}
            columnWrapperStyle={
              desktop && setlists.length > 0 ? styles.columnWrap : undefined
            }
            ListHeaderComponent={
              desktop && setlists.length > 0 ? (
                <Text style={[styles.listHeading, { color: c.text }]}>
                  {t('setlists.yourSetlists')}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              !desktop ? (
                <Card>
                  <Body muted>{t('setlists.empty')}</Body>
                  <View style={styles.emptyActions}>
                    <PrimaryButton
                      label={t('setlists.createGenerate')}
                      onPress={() => void quickGenerate()}
                      icon="🎲"
                    />
                    <GhostButton
                      label={t('setlists.createManual')}
                      onPress={() => setCreateMode('manual')}
                    />
                    <GhostButton
                      label={t('sheetsImport.open')}
                      onPress={() => setImportOpen(true)}
                    />
                  </View>
                </Card>
              ) : null
            }
            renderItem={({ item, index }) => {
              const total = setlistDurationSec(item.sets, songsById);
              const songCount = item.sets.reduce((n, s) => n + s.songs.length, 0);
              return (
                <Card index={index} style={desktop ? styles.gridCard : undefined}>
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
        ) : null}

        {/* When desktop has setlists and choose mode was opened via +, we already show split above.
            Also show existing setlists below choose workspace. */}
        {desktop && createMode === 'choose' && setlists.length > 0 ? (
          <View style={{ marginTop: 28 }}>
            <Text style={[styles.listHeading, { color: c.text }]}>
              {t('setlists.yourSetlists')}
            </Text>
            <View style={styles.desktopGrid}>
              {setlists.map((item, index) => {
                const total = setlistDurationSec(item.sets, songsById);
                const songCount = item.sets.reduce((n, s) => n + s.songs.length, 0);
                return (
                  <Card key={item.id} index={index} style={styles.gridCardFixed}>
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
                        </View>
                      </Pressable>
                    </Link>
                  </Card>
                );
              })}
            </View>
          </View>
        ) : null}
      </PageColumn>

      {/* Mobile modals */}
      {!desktop ? (
        <>
          <Modal
            visible={createMode === 'choose'}
            animationType="slide"
            presentationStyle="pageSheet">
            <Screen safeTop={false}>
              <View style={{ padding: 16, gap: 12 }}>
                <Title>{t('setlists.newSetlist')}</Title>
                <Subtitle>{t('setlists.chooseCreate')}</Subtitle>
                <PrimaryButton
                  label={t('setlists.createGenerate')}
                  onPress={() => void quickGenerate()}
                  icon="🎲"
                />
                <GhostButton
                  label={t('setlists.createManual')}
                  onPress={() => setCreateMode('manual')}
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
            <Screen safeTop={false}>
              <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                <CreateManualSetlistForm
                  songs={songs}
                  defaultSetCount={settings.defaultSetCount}
                  defaultMinutes={settings.defaultSetMinutes}
                  onCreate={(payload) => void onCreateManual(payload)}
                  onCancel={() => setCreateMode(null)}
                />
              </ScrollView>
            </Screen>
          </Modal>

        </>
      ) : null}

      <Modal visible={importOpen} animationType="slide" presentationStyle="pageSheet">
        <Screen safeTop={false}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, maxWidth: 520, alignSelf: 'center', width: '100%' }}>
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
  split: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 20,
    width: '100%',
    marginTop: 8,
  },
  splitLeft: {
    flex: 0.42,
    minWidth: 280,
    maxWidth: 420,
  },
  createCard: {
    flex: 0.38,
    minWidth: 260,
    maxWidth: 380,
    marginBottom: 0,
  },
  selectCard: {
    flex: 1,
    minWidth: 320,
    marginBottom: 0,
  },
  selectCardWaiting: {
    minHeight: 280,
  },
  selectWaitingBody: {
    flex: 1,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  createActions: {
    gap: 10,
    marginTop: 16,
    maxWidth: 280,
  },
  inlineWorkspace: {
    marginTop: 4,
    width: '100%',
    paddingBottom: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    width: '100%',
  },
  listContentDesktop: {
    paddingHorizontal: 0,
    paddingBottom: 72,
  },
  listHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  columnWrap: {
    gap: 12,
  },
  gridCard: {
    flex: 1,
  },
  gridCardFixed: {
    width: '48%',
    flexGrow: 1,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyActions: {
    gap: 10,
    marginTop: 14,
  },
  name: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
});
