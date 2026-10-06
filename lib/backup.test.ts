import { expect, it } from 'vitest';
import { defaultSettings } from '../constants/defaults';
import { buildBarraLibreSeedSongs } from '../data/seedBarraLibre';
import type { AppData } from '../types/models';
import { parseBackup, serializeBackup } from './backup';

function fixture(): AppData {
  const songs = buildBarraLibreSeedSongs().slice(0, 2);
  return { songs, settings: { ...defaultSettings, language: 'en' },
    setlists: [{ id: 'show', name: 'My show', venue: 'Venue', favorite: true, createdAt: '2026-10-06', updatedAt: '2026-10-06',
      sets: [{ id: 'set', name: 'First set', targetMinutes: 45,
        songs: [{ songId: songs[1].id, order: 0 }, { songId: songs[0].id, order: 1 }] }] }] };
}
it('round-trips songs, settings, favorites and set order in versioned and legacy files', () => {
  const data = fixture();
  expect(parseBackup(serializeBackup(data))).toEqual(data);
  expect(parseBackup('\uFEFF' + JSON.stringify(data))).toEqual(data);
});
it('rejects unsupported versions and malformed JSON', () => {
  expect(() => parseBackup('{')).toThrow();
  expect(() => parseBackup(JSON.stringify({ format: 'hueso-time', version: 2, data: fixture() }))).toThrow();
});
it('rejects missing references and duplicate IDs before a restore', () => {
  const data = fixture(); data.setlists[0].sets[0].songs[0].songId = 'missing';
  expect(() => parseBackup(JSON.stringify(data))).toThrow();
  const duplicate = fixture(); duplicate.songs[1].id = duplicate.songs[0].id;
  expect(() => parseBackup(JSON.stringify(duplicate))).toThrow();
});
it('rejects invalid metadata, settings and duplicate row positions', () => {
  const metadata = fixture(); metadata.songs[0].durationSec = -1;
  expect(() => parseBackup(JSON.stringify(metadata))).toThrow();
  const settings = fixture(); settings.settings.defaultSetCount = 0;
  expect(() => parseBackup(JSON.stringify(settings))).toThrow();
  const order = fixture(); order.setlists[0].sets[0].songs[1].order = 0;
  expect(() => parseBackup(JSON.stringify(order))).toThrow();
});
