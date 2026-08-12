import { describe, expect, it } from 'vitest';

import { energyBand, placementScore, pickBestIndex } from '../lib/setEnergy';
import type { Song } from '../types/models';

function song(partial: Partial<Song> & Pick<Song, 'id' | 'title' | 'artist' | 'bpm'>): Song {
  return {
    key: 'C',
    keyMode: 'major',
    genre: 'rock',
    durationSec: 210,
    createdAt: '',
    updatedAt: '',
    ...partial,
  };
}

describe('setEnergy', () => {
  it('classifies bpm bands', () => {
    expect(energyBand(80)).toBe('slow');
    expect(energyBand(110)).toBe('mid');
    expect(energyBand(140)).toBe('fast');
  });

  it('penalizes two slow songs in a row', () => {
    const a = song({ id: '1', title: 'A', artist: 'X', bpm: 80 });
    const b = song({ id: '2', title: 'B', artist: 'Y', bpm: 75 });
    const c = song({ id: '3', title: 'C', artist: 'Z', bpm: 135 });
    expect(placementScore(a, b)).toBeLessThan(placementScore(a, c));
  });

  it('prefers artist variety', () => {
    const prev = song({ id: '1', title: 'A', artist: 'Same', bpm: 120 });
    const same = song({ id: '2', title: 'B', artist: 'Same', bpm: 120 });
    const other = song({ id: '3', title: 'C', artist: 'Other', bpm: 120 });
    expect(placementScore(prev, other)).toBeGreaterThan(placementScore(prev, same));
  });

  it('picks an index from candidates', () => {
    const prev = song({ id: '1', title: 'A', artist: 'X', bpm: 80 });
    const candidates = [
      song({ id: '2', title: 'B', artist: 'X', bpm: 78 }),
      song({ id: '3', title: 'C', artist: 'Y', bpm: 140 }),
    ];
    const idx = pickBestIndex(prev, candidates);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(candidates.length);
  });
});
