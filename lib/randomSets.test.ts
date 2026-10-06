import { describe, expect, it } from 'vitest';

import { emptyFilters, filterSongs, uniqueArtists, generateRandomSets } from '../lib/randomSets';
import type { Song } from '../types/models';

function song(partial: Partial<Song> & Pick<Song, 'id' | 'title' | 'artist' | 'bpm' | 'genre'>): Song {
  return {
    key: 'C',
    keyMode: 'major',
    durationSec: 200,
    createdAt: '',
    updatedAt: '',
    ...partial,
  };
}

describe('randomSets filters', () => {
  const songs = [
    song({ id: '1', title: 'A', artist: 'Fobia', bpm: 118, genre: 'rock', key: 'C' }),
    song({ id: '2', title: 'B', artist: 'Café Tacvba', bpm: 95, genre: 'latin', key: 'G' }),
    song({ id: '3', title: 'C', artist: 'Fobia', bpm: 140, genre: 'rock', key: 'A' }),
  ];

  it('lists unique artists sorted', () => {
    expect(uniqueArtists(songs)).toEqual(['Café Tacvba', 'Fobia']);
  });

  it('filters by artist and genre', () => {
    const filters = emptyFilters();
    filters.artists = ['Fobia'];
    filters.genres = ['rock'];
    const result = filterSongs(songs, filters);
    expect(result.map((s) => s.id)).toEqual(['1', '3']);
  });

  it('filters by bpm range and key', () => {
    const filters = emptyFilters();
    filters.bpmMin = 100;
    filters.bpmMax = 130;
    filters.keys = ['C'];
    const result = filterSongs(songs, filters);
    expect(result.map((s) => s.id)).toEqual(['1']);
  });
});

it('reuses a song between sets only when enabled', () => {
  const songs = [song({ id: 'solo', title: 'A', artist: 'Band', bpm: 120, genre: 'rock', durationSec: 180 })];
  for (const allowReuse of [true, false]) {
    const result = generateRandomSets({ songs, setCount: 2, targetMinutes: 3, allowReuse });
    expect(result.sets.map(s => s.songs.length)).toEqual(allowReuse ? [1, 1] : [1, 0]);
  }
});
