import { describe, expect, it } from 'vitest';

import { formatSetlistShareText } from '../lib/exportSetlist';
import type { SetBlock, Song } from '../types/models';

function song(id: string, title: string, artist: string): Song {
  return {
    id,
    title,
    artist,
    bpm: 120,
    key: 'C',
    keyMode: 'major',
    genre: 'rock',
    durationSec: 180,
    createdAt: '',
    updatedAt: '',
  };
}

describe('exportSetlist', () => {
  it('formats a readable share text', () => {
    const songsById = new Map<string, Song>([
      ['a', song('a', 'Vivo', 'Fobia')],
      ['b', song('b', 'Eres', 'Café Tacvba')],
    ]);
    const sets: SetBlock[] = [
      {
        id: 's1',
        name: 'Set 1',
        targetMinutes: 45,
        songs: [
          { songId: 'a', order: 0 },
          { songId: 'b', order: 1 },
        ],
      },
    ];

    const text = formatSetlistShareText(
      { name: 'Wildebeest', venue: 'Foro', date: '2026-08-15', sets },
      songsById,
      {
        total: 'Total',
        set: (n, name) => `SET ${n}: ${name}`,
        bpm: 'BPM',
      },
    );

    expect(text).toContain('Wildebeest');
    expect(text).toContain('Foro');
    expect(text).toContain('SET 1: Set 1');
    expect(text).toContain('1. Vivo — Fobia');
    expect(text).toContain('2. Eres — Café Tacvba');
    expect(text).toContain('Hueso Time');
  });
});
