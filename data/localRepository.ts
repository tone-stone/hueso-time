import AsyncStorage from '@react-native-async-storage/async-storage';

import { emptyAppData } from '@/constants/defaults';
import type { DataRepository } from '@/data/repository';
import { buildBarraLibreSeedSongs } from '@/data/seedBarraLibre';
import { createId, nowIso } from '@/lib/id';
import type {
  AppData,
  AppSettings,
  Setlist,
  SetlistInput,
  Song,
  SongInput,
} from '@/types/models';

const STORAGE_KEY = '@hueso_time/app_data_v1';

async function read(): Promise<AppData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyAppData();
  try {
    const parsed = JSON.parse(raw) as AppData;
    return {
      songs: parsed.songs ?? [],
      setlists: parsed.setlists ?? [],
      settings: { ...emptyAppData().settings, ...parsed.settings },
    };
  } catch {
    return emptyAppData();
  }
}

async function write(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const localRepository: DataRepository = {
  async load() {
    const data = await read();
    if (data.songs.length === 0) {
      const seeded = { ...data, songs: buildBarraLibreSeedSongs() };
      await write(seeded);
      return seeded;
    }
    return data;
  },

  async saveSongs(songs) {
    const data = await read();
    await write({ ...data, songs });
  },

  async saveSetlists(setlists) {
    const data = await read();
    await write({ ...data, setlists });
  },

  async saveSettings(settings) {
    const data = await read();
    await write({ ...data, settings });
  },

  async upsertSong(input, id) {
    const data = await read();
    const stamp = nowIso();
    let song: Song;

    if (id) {
      const idx = data.songs.findIndex((s) => s.id === id);
      if (idx >= 0) {
        song = { ...data.songs[idx], ...input, id, updatedAt: stamp };
        data.songs[idx] = song;
      } else {
        song = { ...input, id, createdAt: stamp, updatedAt: stamp };
        data.songs.push(song);
      }
    } else {
      song = {
        ...input,
        id: createId('song'),
        createdAt: stamp,
        updatedAt: stamp,
      };
      data.songs.push(song);
    }

    await write(data);
    return song;
  },

  async deleteSong(id) {
    const data = await read();
    data.songs = data.songs.filter((s) => s.id !== id);
    data.setlists = data.setlists.map((sl) => ({
      ...sl,
      sets: sl.sets.map((set) => ({
        ...set,
        songs: set.songs.filter((ref) => ref.songId !== id),
      })),
    }));
    await write(data);
  },

  async upsertSetlist(input, id) {
    const data = await read();
    const stamp = nowIso();
    let setlist: Setlist;

    if (id) {
      const idx = data.setlists.findIndex((s) => s.id === id);
      if (idx >= 0) {
        setlist = { ...data.setlists[idx], ...input, id, updatedAt: stamp };
        data.setlists[idx] = setlist;
      } else {
        setlist = { ...input, id, createdAt: stamp, updatedAt: stamp };
        data.setlists.push(setlist);
      }
    } else {
      setlist = {
        ...input,
        id: createId('setlist'),
        createdAt: stamp,
        updatedAt: stamp,
      };
      data.setlists.push(setlist);
    }

    await write(data);
    return setlist;
  },

  async deleteSetlist(id) {
    const data = await read();
    data.setlists = data.setlists.filter((s) => s.id !== id);
    await write(data);
  },
};

/** Placeholder for future remote API — implement same DataRepository contract. */
export const apiRepositoryStub: Partial<DataRepository> = {
  async load() {
    throw new Error('API repository not configured yet. Use localRepository.');
  },
};
