import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { DEFAULT_SET_COUNT, DEFAULT_SET_MINUTES } from '@/constants/defaults';
import { apiRepository, isApiEnabled, ApiError } from '@/data/apiRepository';
import { localRepository, readLocalBackup } from '@/data/localRepository';
import { isPreloadedRepertoire } from '@/data/preloadedRepertoire';
import type { DataRepository } from '@/data/repository';
import { buildBarraLibreSeedSongs } from '@/data/seedBarraLibre';
import { createId } from '@/lib/id';
import {
  buildSetlistFromImport,
  loadSheetImportPlan,
  mergeImportedSongs,
} from '@/lib/googleSheetsImport';
import type {
  AppSettings,
  Genre,
  SetBlock,
  Setlist,
  SetlistInput,
  Song,
  SongFilters,
  SongInput,
  AppData,
} from '@/types/models';

interface AppContextValue {
  ready: boolean;
  loadError: string | null;
  retryLoad: () => void;
  localRecovery: { songs: number; setlists: number } | null;
  recoverLocalData: () => Promise<void>;
  recoverBackupText: (text: string) => Promise<void>;
  songs: Song[];
  setlists: Setlist[];
  settings: AppSettings;
  songsById: Map<string, Song>;
  upsertSong: (input: SongInput, id?: string) => Promise<Song>;
  deleteSong: (id: string) => Promise<void>;
  upsertSetlist: (input: SetlistInput, id?: string) => Promise<Setlist>;
  deleteSetlist: (id: string) => Promise<void>;
  createEmptySetlist: (opts?: {
    name?: string;
    venue?: string;
    setCount?: number;
    targetMinutes?: number;
    genreFocus?: Genre;
    songFilters?: SongFilters;
  }) => Promise<Setlist>;
  updateSetlistSets: (setlistId: string, sets: SetBlock[]) => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  /** Merge missing songs from Set-BarraLibre seed. Returns how many were added. */
  importBarraLibreSeed: () => Promise<number>;
  /** Import songs + create setlist from a public Google Sheet URL. */
  importSetlistFromGoogleSheet: (
    url: string,
    name?: string,
  ) => Promise<{ songsAdded: number; setlist: Setlist }>;
}

const AppContext = createContext<AppContextValue | null>(null);

/** Swap this for an API repository when backend is ready. */
const repository: DataRepository = isApiEnabled() ? apiRepository : localRepository;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const auth = useAuth();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retryLoad = useCallback(() => setAttempt(n => n + 1), []);
  const loaded = useRef(false);
  const repo = useMemo(() => new Proxy(repository, {
    get(target, key: keyof DataRepository) {
      return (...args: unknown[]) => {
        if (key !== 'load' && !loaded.current) return Promise.reject(new Error('Espera a que se carguen los datos.'));
        return (target[key] as (...args: unknown[]) => Promise<unknown>)(...args).catch(error => {
          if (error instanceof ApiError && [401, 409, 428, 500, 503].includes(error.status)) {
            loaded.current = false;
            setReady(false);
            setLoadError(error.message);
          }
          throw error;
        });
      };
    },
  }), []);
  const [ready, setReady] = useState(false);
  const [localRecovery, setLocalRecovery] = useState<{ songs: number; setlists: number } | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'es',
    defaultSetMinutes: DEFAULT_SET_MINUTES,
    defaultSetCount: DEFAULT_SET_COUNT,
  });

  useEffect(() => {
    let cancelled = false;
    loaded.current = false;
    setReady(false);
    setLoadError(null);
    setLocalRecovery(null);
    if (!auth.ready) return;
    if (isApiEnabled() && !auth.user) {
      if (auth.canAccessApp) setLoadError('Inicia sesión con Google para usar la API.');
      return;
    }
    (async () => {
      try {
        const data = await repo.load();
        if (cancelled) return;
        if (isApiEnabled() && ((data.songs.length === 0 && data.setlists.length === 0) || isPreloadedRepertoire(data))) {
          try {
            const saved = await readLocalBackup();
            if (!cancelled && saved && (saved.songs.length > 0 || saved.setlists.length > 0)) {
              setLocalRecovery({ songs: saved.songs.length, setlists: saved.setlists.length });
            }
          } catch {
            // A corrupt device copy must not prevent access to the server's data.
          }
        }
        await i18n.changeLanguage(data.settings.language);
        if (cancelled) return;
        setSongs(data.songs);
        setSetlists(data.setlists);
        setSettings(data.settings);
        loaded.current = true;
        setReady(true);
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los datos.');
      }
    })();
    return () => { cancelled = true; loaded.current = false; };
  }, [i18n, repo, auth.ready, auth.user?.id, auth.canAccessApp, attempt]);

  const songsById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);

  const restoreEmptyAccount = useCallback(async (saved: AppData) => {
    if (!isApiEnabled() || !loaded.current) throw new Error(i18n.t('generate.recoveryUnavailable'));
    const current = await repo.load();
    if ((current.songs.length > 0 || current.setlists.length > 0) && !isPreloadedRepertoire(current)) {
      throw new Error(i18n.t('generate.recoveryHasData'));
    }
    await repo.restoreData(saved);
    const restored = await repo.load();
    await i18n.changeLanguage(restored.settings.language);
    setSongs(restored.songs);
    setSetlists(restored.setlists);
    setSettings(restored.settings);
    setLocalRecovery(null);
  }, [i18n, repo]);

  const recoverLocalData = useCallback(async () => {
    const saved = await readLocalBackup();
    if (!saved || (saved.songs.length === 0 && saved.setlists.length === 0)) {
      throw new Error(i18n.t('generate.recoveryUnavailable'));
    }
    await restoreEmptyAccount(saved);
  }, [i18n, restoreEmptyAccount]);

  const recoverBackupText = useCallback(async (text: string) => {
    let saved: AppData;
    try {
      saved = JSON.parse(text);
      if (!saved || !Array.isArray(saved.songs) || !Array.isArray(saved.setlists) || !saved.settings) throw new Error();
    } catch { throw new Error(i18n.t('generate.invalidBackup')); }
    await restoreEmptyAccount(saved);
  }, [i18n, restoreEmptyAccount]);

  const upsertSong = useCallback(async (input: SongInput, id?: string) => {
    const song = await repo.upsertSong(input, id);
    setSongs((prev) => {
      const idx = prev.findIndex((s) => s.id === song.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = song;
        return next;
      }
      return [song, ...prev];
    });
    return song;
  }, []);

  const deleteSong = useCallback(async (id: string) => {
    await repo.deleteSong(id);
    setSongs((prev) => prev.filter((s) => s.id !== id));
    setSetlists((prev) =>
      prev.map((sl) => ({
        ...sl,
        sets: sl.sets.map((set) => ({
          ...set,
          songs: set.songs.filter((ref) => ref.songId !== id),
        })),
      })),
    );
  }, []);

  const upsertSetlist = useCallback(async (input: SetlistInput, id?: string) => {
    const setlist = await repo.upsertSetlist(input, id);
    setSetlists((prev) => {
      const idx = prev.findIndex((s) => s.id === setlist.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = setlist;
        return next;
      }
      return [setlist, ...prev];
    });
    return setlist;
  }, []);

  const deleteSetlist = useCallback(async (id: string) => {
    await repo.deleteSetlist(id);
    setSetlists((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const createEmptySetlist = useCallback(
    async (opts?: {
      name?: string;
      venue?: string;
      setCount?: number;
      targetMinutes?: number;
      genreFocus?: Genre;
      songFilters?: SongFilters;
    }) => {
      const count = opts?.setCount ?? settings.defaultSetCount;
      const target = opts?.targetMinutes ?? settings.defaultSetMinutes;
      const sets: SetBlock[] = Array.from({ length: count }, (_, i) => ({
        id: createId('set'),
        name: `Set ${i + 1}`,
        targetMinutes: target,
        songs: [],
      }));
      return upsertSetlist({
        name: opts?.name ?? 'Show',
        venue: opts?.venue,
        genreFocus: opts?.genreFocus,
        songFilters: opts?.songFilters,
        sets,
      });
    },
    [settings.defaultSetCount, settings.defaultSetMinutes, upsertSetlist],
  );

  const updateSetlistSets = useCallback(
    async (setlistId: string, sets: SetBlock[]) => {
      const current = setlists.find((s) => s.id === setlistId);
      if (!current) return;
      await upsertSetlist(
        {
          name: current.name,
          venue: current.venue,
          date: current.date,
          genreFocus: current.genreFocus,
          songFilters: current.songFilters,
          favorite: current.favorite,
          sets,
        },
        setlistId,
      );
    },
    [setlists, upsertSetlist],
  );

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      await repo.saveSettings(partial);
      setSettings(previous => ({ ...previous, ...partial }));
      if (partial.language) {
        await i18n.changeLanguage(partial.language);
      }
    },
    [i18n, repo],
  );

  const importBarraLibreSeed = useCallback(async () => {
    const currentSongs = (await repo.load()).songs;
    const seed = buildBarraLibreSeedSongs();
    const byKey = new Map<string, Song>(
      currentSongs.map((s) => [
        `${s.artist.trim().toLowerCase()}::${s.title.trim().toLowerCase()}`,
        s,
      ]),
    );

    let added = 0;
    let updated = 0;
    const next = [...currentSongs];

    for (const seedSong of seed) {
      const key = `${seedSong.artist.trim().toLowerCase()}::${seedSong.title.trim().toLowerCase()}`;
      const existing = byKey.get(key);
      if (!existing) {
        next.push(seedSong);
        byKey.set(key, seedSong);
        added += 1;
        continue;
      }

      const richerBpm = seedSong.bpm > 0 && (existing.bpm === 118 || !existing.bpm);
      const richerDur =
        seedSong.durationSec > 0 &&
        seedSong.durationSec !== existing.durationSec &&
        (existing.durationSec === 210 || !existing.durationSec);
      const richerKey = seedSong.key && existing.key === 'C' && seedSong.key !== 'C';
      const richerGenre =
        seedSong.genre !== existing.genre &&
        seedSong.genre !== 'other' &&
        (existing.genre === 'rock' ||
          existing.genre === 'other' ||
          (existing.genre === 'latin' && seedSong.genre === 'regionalMexicano'));
      const richerNotes = Boolean(seedSong.notes) && !existing.notes;

      if (!richerBpm && !richerDur && !richerKey && !richerGenre && !richerNotes) continue;

      const merged = {
        ...existing,
        bpm: richerBpm ? seedSong.bpm : existing.bpm,
        durationSec: richerDur ? seedSong.durationSec : existing.durationSec,
        key: richerKey ? seedSong.key : existing.key,
        keyMode: richerKey ? seedSong.keyMode : existing.keyMode,
        genre: richerGenre ? seedSong.genre : existing.genre,
        notes: richerNotes ? seedSong.notes : existing.notes,
        updatedAt: seedSong.updatedAt,
      };
      const idx = next.findIndex((s) => s.id === existing.id);
      if (idx >= 0) next[idx] = merged;
      byKey.set(key, merged);
      updated += 1;
    }

    if (added === 0 && updated === 0) return 0;
    await repo.saveSongs(next);
    setSongs(next);
    return added + updated;
  }, [songs]);

  const importSetlistFromGoogleSheet = useCallback(
    async (url: string, name?: string) => {
      const plan = await loadSheetImportPlan(
        url,
        name?.trim() || 'Setlist importado',
      );
      const inputs = plan.songs.map(({ setLabel: _setLabel, ...song }) => song);
      const currentSongs = (await repo.load()).songs;
      const merged = mergeImportedSongs(currentSongs, inputs);
      if (merged.added > 0) {
        await repo.saveSongs(merged.songs);
        setSongs(merged.songs);
      }
      const setlistInput = buildSetlistFromImport(
        plan,
        merged.songs,
        settings.defaultSetMinutes,
      );
      const setlist = await upsertSetlist(setlistInput);
      return { songsAdded: merged.added, setlist };
    },
    [songs, settings.defaultSetMinutes, upsertSetlist],
  );

  const value = useMemo(
    () => ({
      ready,
      loadError,
      retryLoad,
      localRecovery,
      recoverLocalData,
      recoverBackupText,
      songs,
      setlists,
      settings,
      songsById,
      upsertSong,
      deleteSong,
      upsertSetlist,
      deleteSetlist,
      createEmptySetlist,
      updateSetlistSets,
      updateSettings,
      importBarraLibreSeed,
      importSetlistFromGoogleSheet,
    }),
    [
      ready,
      loadError,
      retryLoad,
      localRecovery,
      recoverLocalData,
      recoverBackupText,
      songs,
      setlists,
      settings,
      songsById,
      upsertSong,
      deleteSong,
      upsertSetlist,
      deleteSetlist,
      createEmptySetlist,
      updateSetlistSets,
      updateSettings,
      importBarraLibreSeed,
      importSetlistFromGoogleSheet,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
