import { createId } from '@/lib/id';
import { pickBestIndex } from '@/lib/setEnergy';
import type { Genre, MusicalKey, SetBlock, SetSongRef, Song } from '@/types/models';

export interface SongFilters {
  artists: string[];
  genres: Genre[];
  bpmMin?: number;
  bpmMax?: number;
  keys: MusicalKey[];
}

export const emptyFilters = (): SongFilters => ({
  artists: [],
  genres: [],
  keys: [],
  bpmMin: undefined,
  bpmMax: undefined,
});

export function uniqueArtists(songs: Song[]): string[] {
  return [...new Set(songs.map((s) => s.artist.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function filterSongs(songs: Song[], filters: SongFilters): Song[] {
  return songs.filter((song) => {
    if (filters.artists.length > 0) {
      const ok = filters.artists.some(
        (a) => a.toLowerCase() === song.artist.trim().toLowerCase(),
      );
      if (!ok) return false;
    }
    if (filters.genres.length > 0 && !filters.genres.includes(song.genre)) {
      return false;
    }
    if (filters.keys.length > 0 && !filters.keys.includes(song.key)) {
      return false;
    }
    if (filters.bpmMin != null && song.bpm < filters.bpmMin) return false;
    if (filters.bpmMax != null && song.bpm > filters.bpmMax) return false;
    return true;
  });
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fillSet(
  pool: Song[],
  targetMinutes: number,
  used: Set<string>,
  allowReuse: boolean,
  preferVariety: boolean,
  smartEnergy: boolean,
): { refs: SetSongRef[]; remaining: Song[] } {
  const targetSec = targetMinutes * 60;
  const refs: SetSongRef[] = [];
  let duration = 0;
  const remaining: Song[] = [];
  let candidates = shuffle(pool);
  let lastSong: Song | null = null;

  while (candidates.length > 0) {
    let pickIndex = 0;
    if (smartEnergy || preferVariety) {
      const eligible = candidates
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => {
          if (!allowReuse && used.has(s.id)) return false;
          if (refs.length > 0 && duration + s.durationSec > targetSec * 1.08) return false;
          return true;
        });

      if (eligible.length > 0) {
        const poolSongs = eligible.map((e) => e.s);
        const bestLocal = pickBestIndex(lastSong, poolSongs);
        if (bestLocal >= 0) pickIndex = eligible[bestLocal].i;
      } else if (preferVariety && lastSong) {
        const varied = candidates.findIndex(
          (s) =>
            (!allowReuse ? !used.has(s.id) : true) &&
            s.artist.trim().toLowerCase() !== lastSong!.artist.trim().toLowerCase() &&
            (refs.length === 0 || duration + s.durationSec <= targetSec * 1.08),
        );
        if (varied >= 0) pickIndex = varied;
      }
    }

    const song = candidates[pickIndex];
    candidates = candidates.filter((_, i) => i !== pickIndex);

    if (!allowReuse && used.has(song.id)) {
      remaining.push(song);
      continue;
    }
    if (refs.length === 0 && song.durationSec > targetSec) {
      remaining.push(song);
      continue;
    }
    if (duration > 0 && duration + song.durationSec > targetSec * 1.08) {
      remaining.push(song);
      continue;
    }
    if (duration >= targetSec * 0.92 && refs.length > 0) {
      remaining.push(song);
      continue;
    }

    refs.push({ songId: song.id, order: refs.length });
    duration += song.durationSec;
    used.add(song.id);
    lastSong = song;
  }

  return { refs, remaining };
}

export interface GenerateRandomSetsOptions {
  songs: Song[];
  setCount: number;
  targetMinutes: number;
  filters?: SongFilters;
  /** If true, a song can appear in more than one set. Default false. */
  allowReuse?: boolean;
  /** Prefer alternating artists inside a set. */
  preferVariety?: boolean;
  /** Prefer energy pacing (avoid two slow songs in a row). Default true. */
  smartEnergy?: boolean;
  /** Keep existing set ids/names when regenerating into a setlist. */
  existingSets?: SetBlock[];
}

export interface GenerateRandomSetsResult {
  sets: SetBlock[];
  matchedCount: number;
  placedCount: number;
}

export function generateRandomSets(
  opts: GenerateRandomSetsOptions,
): GenerateRandomSetsResult {
  const filters = opts.filters ?? emptyFilters();
  const matched = filterSongs(opts.songs, filters);
  const used = new Set<string>();
  let pool = [...matched];
  const sets: SetBlock[] = [];

  for (let i = 0; i < opts.setCount; i += 1) {
    const existing = opts.existingSets?.[i];
    const { refs, remaining } = fillSet(
      pool,
      opts.targetMinutes,
      used,
      opts.allowReuse ?? false,
      opts.preferVariety ?? true,
      opts.smartEnergy ?? true,
    );
    pool = remaining;
    sets.push({
      id: existing?.id ?? createId('set'),
      name: existing?.name ?? `Set ${i + 1}`,
      targetMinutes: existing?.targetMinutes ?? opts.targetMinutes,
      songs: refs,
    });
  }

  if (opts.existingSets && opts.existingSets.length > opts.setCount) {
    for (let i = opts.setCount; i < opts.existingSets.length; i += 1) {
      sets.push({ ...opts.existingSets[i], songs: [] });
    }
  }

  const placedCount = sets.reduce((n, s) => n + s.songs.length, 0);
  return { sets, matchedCount: matched.length, placedCount };
}
