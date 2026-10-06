import { GENRES, KEY_MODES, MUSICAL_KEYS } from '@/constants/Colors';
import type { AppData } from '@/types/models';

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string';
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const optionalText = (v: unknown) => v === undefined || text(v);

/** Validate every reference before a restore can replace any user data. Accept legacy exports. */
export function parseBackup(raw: string): AppData {
  const parsed: unknown = JSON.parse(raw.replace(/^\uFEFF/, ''));
  const data = record(parsed) && parsed.format === 'hueso-time'
    ? (parsed.version === 1 ? parsed.data : null) : parsed;
  const invalid = () => { throw new Error('invalid_backup'); };
  if (!record(data) || !Array.isArray(data.songs) || !Array.isArray(data.setlists) || !record(data.settings)) return invalid();
  const settings = data.settings;
  if (!['es', 'en'].includes(String(settings.language)) || !positive(settings.defaultSetMinutes) ||
    settings.defaultSetMinutes > 240 || !Number.isInteger(settings.defaultSetCount) ||
    Number(settings.defaultSetCount) < 1 || Number(settings.defaultSetCount) > 6) return invalid();
  const ids = new Set<string>();
  for (const song of data.songs) {
    if (!record(song) || !text(song.id) || !song.id || ids.has(song.id) || !text(song.title) || !song.title.trim() ||
      !text(song.artist) || !song.artist.trim() || typeof song.bpm !== 'number' || !Number.isFinite(song.bpm) || song.bpm < 0 ||
      !positive(song.durationSec) || !MUSICAL_KEYS.includes(song.key as never) || !KEY_MODES.includes(song.keyMode as never) ||
      !GENRES.includes(song.genre as never) || !text(song.createdAt) || !text(song.updatedAt) ||
      !optionalText(song.notes) || !optionalText(song.imageUrl) || !optionalText(song.spotifyId) || !optionalText(song.externalUrl) ||
      (song.favorite !== undefined && typeof song.favorite !== 'boolean') ||
      (song.practiceStatus !== undefined && !['ready', 'practice', 'showstopper'].includes(String(song.practiceStatus)))) return invalid();
    ids.add(song.id);
  }
  const shows = new Set<string>();
  for (const show of data.setlists) {
    if (!record(show) || !text(show.id) || !show.id || shows.has(show.id) || !text(show.name) || !show.name.trim() ||
      !text(show.createdAt) || !text(show.updatedAt) || !Array.isArray(show.sets) ||
      !optionalText(show.venue) || !optionalText(show.date) || (show.favorite !== undefined && typeof show.favorite !== 'boolean') ||
      (show.genreFocus !== undefined && !GENRES.includes(show.genreFocus as never))) return invalid();
    shows.add(show.id);
    const blocks = new Set<string>();
    for (const block of show.sets) {
      if (!record(block) || !text(block.id) || !block.id || blocks.has(block.id) || !text(block.name) ||
        !positive(block.targetMinutes) || !Array.isArray(block.songs)) return invalid();
      blocks.add(block.id);
      const refs = new Set<string>();
      const orders = new Set<number>();
      for (const ref of block.songs) {
        if (!record(ref) || !text(ref.songId) || !ids.has(ref.songId) || refs.has(ref.songId) ||
          !Number.isInteger(ref.order) || Number(ref.order) < 0 || orders.has(Number(ref.order))) return invalid();
        refs.add(ref.songId); orders.add(Number(ref.order));
      }
    }
    if (show.songFilters !== undefined) {
      const f = show.songFilters;
      if (!record(f) || !Array.isArray(f.artists) || !f.artists.every(text) || !Array.isArray(f.genres) ||
        !f.genres.every(g => GENRES.includes(g)) || !Array.isArray(f.keys) || !f.keys.every(k => MUSICAL_KEYS.includes(k)) ||
        [f.bpmMin, f.bpmMax].some(n => n !== undefined && (typeof n !== 'number' || !Number.isFinite(n) || n < 0))) return invalid();
    }
  }
  return data as unknown as AppData;
}
export function serializeBackup(data: AppData) {
  return JSON.stringify({ format: 'hueso-time', version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}
