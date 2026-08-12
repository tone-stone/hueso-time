import { describe, expect, it } from 'vitest';

import { isOverTarget, setDurationSec, setlistDurationSec } from '../lib/setMath';
import type { SetBlock, Song } from '../types/models';

function song(id: string, durationSec: number): Song {
  return {
    id,
    title: id,
    artist: 'A',
    bpm: 120,
    key: 'C',
    keyMode: 'major',
    genre: 'rock',
    durationSec,
    createdAt: '',
    updatedAt: '',
  };
}

function block(partial: Partial<SetBlock> & Pick<SetBlock, 'id' | 'songs'>): SetBlock {
  return {
    name: 'Set 1',
    targetMinutes: 45,
    ...partial,
  };
}

describe('setMath', () => {
  const songsById = new Map<string, Song>([
    ['a', song('a', 180)],
    ['b', song('b', 240)],
    ['c', song('c', 300)],
  ]);

  it('sums set duration from song refs', () => {
    const set = block({
      id: 's1',
      songs: [
        { songId: 'a', order: 0 },
        { songId: 'b', order: 1 },
      ],
    });
    expect(setDurationSec(set, songsById)).toBe(420);
  });

  it('ignores missing songs', () => {
    const set = block({
      id: 's1',
      songs: [
        { songId: 'a', order: 0 },
        { songId: 'missing', order: 1 },
      ],
    });
    expect(setDurationSec(set, songsById)).toBe(180);
  });

  it('sums whole setlist duration', () => {
    const sets = [
      block({
        id: 's1',
        songs: [{ songId: 'a', order: 0 }],
      }),
      block({
        id: 's2',
        name: 'Set 2',
        songs: [{ songId: 'c', order: 0 }],
      }),
    ];
    expect(setlistDurationSec(sets, songsById)).toBe(480);
  });

  it('detects over target', () => {
    const under = block({
      id: 's1',
      targetMinutes: 10,
      songs: [{ songId: 'a', order: 0 }],
    });
    const over = block({
      id: 's2',
      targetMinutes: 1,
      songs: [{ songId: 'c', order: 0 }],
    });
    expect(isOverTarget(under, songsById)).toBe(false);
    expect(isOverTarget(over, songsById)).toBe(true);
  });
});
