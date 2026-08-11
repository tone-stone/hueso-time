/**
 * Seed mínimo de ejemplo. Para el catálogo completo usá la app
 * (Set-BarraLibre) o POST /v1/songs en lote.
 */
import { createSong, readDb, writeDb } from './store.js';
import { defaultSettings } from './types.js';

const samples = [
  {
    title: 'La célula que explota',
    artist: 'Caifanes',
    bpm: 118,
    key: 'B' as const,
    keyMode: 'minor' as const,
    genre: 'rock' as const,
    durationSec: 210,
  },
  {
    title: 'Persiana americana',
    artist: 'Soda Stereo',
    bpm: 120,
    key: 'D' as const,
    keyMode: 'major' as const,
    genre: 'rock' as const,
    durationSec: 210,
  },
  {
    title: 'Matador',
    artist: 'Los Fabulosos Cadillacs',
    bpm: 130,
    key: 'A' as const,
    keyMode: 'minor' as const,
    genre: 'rock' as const,
    durationSec: 240,
  },
];

writeDb({ songs: [], setlists: [], settings: { ...defaultSettings } });
for (const s of samples) createSong(s);

const db = readDb();
console.log(`Seed OK: ${db.songs.length} canciones`);
