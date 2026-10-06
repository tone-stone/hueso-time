import { defaultSettings } from '@/constants/defaults';
import { buildBarraLibreSongInputs } from '@/data/seedBarraLibre';
import type { AppData } from '@/types/models';

/** Identify the server's untouched public catalog without relying on object key order. */
export function isPreloadedRepertoire(data: AppData): boolean {
  const songs = buildBarraLibreSongInputs().map((song, index) => ({
    ...song, id: `excel_catalog_${index}`, createdAt: '', updatedAt: '',
  }));
  if (data.setlists.length || data.songs.length !== songs.length) return false;
  const originals = new Map(songs.map(song => [song.id, song]));
  if (new Set(data.songs.map(song => song.id)).size !== songs.length) return false;
  return data.songs.every(song => {
    const original = originals.get(song.id);
    return original && Object.keys(song).every(key => key in original) &&
      Object.entries(original).every(([key, value]) => song[key as keyof typeof song] === value);
  }) && Object.entries(defaultSettings).every(([key, value]) =>
    data.settings[key as keyof typeof data.settings] === value);
}
