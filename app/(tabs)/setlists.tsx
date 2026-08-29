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
import { SymbolView } from 'expo-symbols';

import { CreateManualSetlistForm } from '@/components/CreateManualSetlistForm';
import { ImportSheetsForm } from '@/components/ImportSheetsForm';
import { ShareSetlistMenu } from '@/components/ShareSetlistMenu';
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
import { FontFamily } from '@/constants/Fonts';
import { confirmDestructive } from '@/lib/confirm';
import { useFloatingTabBarInset } from '@/lib/tabBarLayout';
import { useApp } from '@/context/AppContext';
import { createId, formatMinutes } from '@/lib/id';
import { emptyFilters, generateRandomSets } from '@/lib/randomSets';
import { setlistDurationSec } from '@/lib/setMath';
import type { Genre, SetBlock, Setlist, SongFilters } from '@/types/models';

type CreateMode = 'choose' | 'manual' | null;

const HEART_FILL_ICON = { ios: 'heart.fill', android: 'favorite', web: 'favorite' } as const;
const HEART_OUTLINE_ICON = {
  ios: 'heart',
  android: 'favorite_border',
  web: 'favorite_border',
} as const;

/** Card date, right-aligned in monospace: the setlist's own date if set, else its creation date. */
function cardDateLabel(item: { date?: string; createdAt: string }): string {
  const raw = item.date || item.createdAt;
  return raw.length >= 10 ? raw.slice(0, 10) : raw;
}

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
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [shareTarget, setShareTarget] = useState<Setlist | null>(null);
  const visibleSetlists = favoritesOnly ? setlists.filter((s) => s.favorite) : setlists;

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

  async function toggleSetlistFavorite(item: Setlist) {
    const { id, createdAt, updatedAt, ...input } = item;
    await upsertSetlist({ ...input, favorite: !item.favorite }, id);
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

  const showFlatList =
    !(desktop && createMode === 'manual') &&
    !(desktop && setlists.length === 0 && createMode === null) &&
    !(desktop && createMode === 'choose');

  const pageHeader = (
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
          {showFlatList && setlists.length > 0 ? (
            <Pressable
              onPress={() => setFavoritesOnly((v) => !v)}
              hitSlop={8}
              accessibilityLabel={t('setlists.favoritesOnly')}
              style={[
                styles.favoritesToggle,
                {
                  borderColor: favoritesOnly ? c.like : c.border,
                  backgroundColor: favoritesOnly ? c.likeSoft : 'transparent',
                },
              ]}>
              <SymbolView
                name={favoritesOnly ? HEART_FILL_ICON : HEART_OUTLINE_ICON}
                size={15}
                tintColor={favoritesOnly ? c.like : c.textFaint}
              />
            </Pressable>
          ) : null}
          {!(desktop && createMode) ? (
            <Fab onPress={() => setCreateMode('choose')} />
          ) : null}
        </>
      }
    />
  );

  return (
    <Screen>
      <PageColumn maxWidth={1100}>
        {showFlatList ? pageHeader : null}

        {!showFlatList ? (
          <ScrollView
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ paddingBottom: 60 }}>
            {pageHeader}

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

            {desktop &&
            (createMode === 'choose' || (createMode === null && setlists.length === 0)) ? (
              <View style={styles.split}>
                {desktopCreateLeft}
                {desktopSelectRight}
              </View>
            ) : null}

            {/* When desktop has setlists and choose mode was opened via +, we already show split above.
                Also show existing setlists below choose workspace. */}
            {desktop && createMode === 'choose' && setlists.length > 0 ? (
              <View style={{ marginTop: 28 }}>
                <Text style={[styles.listHeading, { color: c.text }]}>
                  {t('setlists.yourSetlists')}
                </Text>
                <View style={styles.desktopGrid}>
                  {visibleSetlists.map((item, index) => {
                    const total = setlistDurationSec(item.sets, songsById);
                    const songCount = item.sets.reduce((n, s) => n + s.songs.length, 0);
                    return (
                      <Card key={item.id} index={index} style={styles.gridCardFixed}>
                        <Pressable
                          onPress={() => void toggleSetlistFavorite(item)}
                          hitSlop={8}
                          accessibilityLabel={t('practice.favorite')}
                          style={styles.setlistHeartBtn}>
                          <SymbolView
                            name={item.favorite ? HEART_FILL_ICON : HEART_OUTLINE_ICON}
                            size={16}
                            tintColor={item.favorite ? c.like : c.textFaint}
                          />
                        </Pressable>
                        <Link href={`/setlist/${item.id}`} asChild>
                          <Pressable>
                            <View style={styles.nameRow}>
                              <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
                                {item.name}
                              </Text>
                              <Text style={[styles.cardDate, { color: c.textMuted }]}>
                                {cardDateLabel(item)}
                              </Text>
                            </View>
                            {item.venue ? (
                              <Text style={[styles.venue, { color: c.textMuted }]}>
                                {item.venue}
                              </Text>
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
          </ScrollView>
        ) : null}

        {showFlatList ? (
          <FlatList
            data={visibleSetlists}
            keyExtractor={(item) => item.id}
            style={{ width: '100%' }}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              desktop && styles.listContentDesktop,
              !desktop && { paddingBottom: 32 + tabBarInset },
            ]}
            numColumns={desktop && visibleSetlists.length > 0 ? 2 : 1}
            key={`${desktop ? 'desktop' : 'mobile'}-${visibleSetlists.length > 0 ? 'grid' : 'empty'}`}
            columnWrapperStyle={
              desktop && visibleSetlists.length > 0 ? styles.columnWrap : undefined
            }
            ListHeaderComponent={
              desktop && visibleSetlists.length > 0 ? (
                <Text style={[styles.listHeading, { color: c.text }]}>
                  {t('setlists.yourSetlists')}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              !desktop ? (
                favoritesOnly && setlists.length > 0 ? (
                  <Card>
                    <Body muted>{t('setlists.emptyFavorites')}</Body>
                  </Card>
                ) : (
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
                )
              ) : null
            }
            renderItem={({ item, index }) => {
              const total = setlistDurationSec(item.sets, songsById);
              const songCount = item.sets.reduce((n, s) => n + s.songs.length, 0);
              return (
                <Card index={index} style={desktop ? styles.gridCard : undefined}>
                  <Pressable
                    onPress={() => void toggleSetlistFavorite(item)}
                    hitSlop={8}
                    accessibilityLabel={t('practice.favorite')}
                    style={styles.setlistHeartBtn}>
                    <SymbolView
                      name={item.favorite ? HEART_FILL_ICON : HEART_OUTLINE_ICON}
                      size={16}
                      tintColor={item.favorite ? c.like : c.textFaint}
                    />
                  </Pressable>
                  <Link href={`/setlist/${item.id}`} asChild>
                    <Pressable>
                      <View style={styles.nameRow}>
                        <Text
                          style={[styles.name, { color: c.text }]}
                          numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[styles.cardDate, { color: c.textMuted }]}>
                          {cardDateLabel(item)}
                        </Text>
                      </View>
                      {item.venue ? (
                        <Text style={[styles.venue, { color: c.textMuted }]}>{item.venue}</Text>
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
                  <View style={styles.cardActions}>
                    <View style={{ flex: 1 }}>
                      <GhostButton
                        label={`↗ ${t('setlists.share')}`}
                        onPress={() => setShareTarget(item)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <GhostButton
                        label={t('common.delete')}
                        danger
                        onPress={() => confirmDelete(item.id, item.name)}
                      />
                    </View>
                  </View>
                </Card>
              );
            }}
          />
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

      <ShareSetlistMenu
        visible={!!shareTarget}
        onClose={() => setShareTarget(null)}
        setlist={shareTarget}
        songsById={songsById}
      />
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
    fontWeight: '500',
    fontFamily: FontFamily.display,
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
    fontWeight: '500',
    fontFamily: FontFamily.display,
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
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  favoritesToggle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    paddingRight: 22,
  },
  setlistHeartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
    padding: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FontFamily.display,
    flexShrink: 1,
  },
  cardDate: {
    fontSize: 11,
    fontFamily: FontFamily.display,
  },
  venue: { fontSize: 12, marginTop: 3 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
});
