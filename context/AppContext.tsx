import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_SET_COUNT, DEFAULT_SET_MINUTES } from '@/constants/defaults';
import { localRepository } from '@/data/localRepository';
import type { DataRepository } from '@/data/repository';
import { createId } from '@/lib/id';
import type {
  AppSettings,
  Genre,
  SetBlock,
  Setlist,
  SetlistInput,
  Song,
  SongInput,
} from '@/types/models';

interface AppContextValue {
  ready: boolean;
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
  }) => Promise<Setlist>;
  updateSetlistSets: (setlistId: string, sets: SetBlock[]) => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

/** Swap this for an API repository when backend is ready. */
const repo: DataRepository = localRepository;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [ready, setReady] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'es',
    defaultSetMinutes: DEFAULT_SET_MINUTES,
    defaultSetCount: DEFAULT_SET_COUNT,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await repo.load();
      if (cancelled) return;
      setSongs(data.songs);
      setSetlists(data.setlists);
      setSettings(data.settings);
      await i18n.changeLanguage(data.settings.language);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [i18n]);

  const songsById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);

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
          sets,
        },
        setlistId,
      );
    },
    [setlists, upsertSetlist],
  );

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const next = { ...settings, ...partial };
      await repo.saveSettings(next);
      setSettings(next);
      if (partial.language) {
        await i18n.changeLanguage(partial.language);
      }
    },
    [i18n, settings],
  );

  const value = useMemo(
    () => ({
      ready,
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
    }),
    [
      ready,
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
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
