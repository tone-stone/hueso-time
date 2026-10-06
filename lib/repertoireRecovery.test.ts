import { expect, it } from 'vitest';
import { dataSchema } from '../backend/src/schemas';
import { defaultSettings } from '../constants/defaults';
import { BARRA_LIBRE_COUNT, buildBarraLibreSeedSongs } from '../data/seedBarraLibre';
import { isPreloadedRepertoire } from '../data/preloadedRepertoire';
import { initialCatalog, isInitialCatalog } from '../backend/src/catalog';
import { generateRandomSets } from './randomSets';

it('accepts the original catalog in the API and generates all three sets after import', () => {
  const songs = buildBarraLibreSeedSongs();
  expect(songs).toHaveLength(254);
  const preloaded = initialCatalog();
  expect(preloaded.songs.map(({ id, createdAt, updatedAt, ...song }) => song))
    .toEqual(songs.map(({ id, createdAt, updatedAt, ...song }) => song));
  expect(isPreloadedRepertoire(preloaded)).toBe(true);
  expect(isInitialCatalog(preloaded)).toBe(true);
  const edited = { ...preloaded, songs: preloaded.songs.map((song, i) => i ? song : { ...song, favorite: true }) };
  expect(isPreloadedRepertoire(edited)).toBe(false);
  expect(isInitialCatalog(edited)).toBe(false);
  expect(dataSchema.safeParse({ songs, setlists: [], settings: defaultSettings }).success).toBe(true);
  const result = generateRandomSets({ songs: preloaded.songs, setCount: 3, targetMinutes: 45, allowReuse: false });
  expect(result.matchedCount).toBe(BARRA_LIBRE_COUNT);
  expect(result.sets).toHaveLength(3);
  expect(result.sets.every(set => set.songs.length > 0)).toBe(true);
  const ids = result.sets.flatMap(set => set.songs.map(ref => ref.songId));
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.every(id => preloaded.songs.some(song => song.id === id))).toBe(true);
});
