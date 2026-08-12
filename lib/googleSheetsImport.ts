import { DEFAULT_SONG_DURATION_SEC, DEFAULT_SET_MINUTES } from '@/constants/defaults';
import { GENRES } from '@/constants/Colors';
import { parseCsv } from '@/lib/csv';
import { createId, nowIso } from '@/lib/id';
import type {
  Genre,
  KeyMode,
  MusicalKey,
  SetBlock,
  SetlistInput,
  Song,
  SongInput,
} from '@/types/models';

export type SheetImportSong = SongInput & { setLabel: string };

export type SheetImportPlan = {
  name: string;
  songs: SheetImportSong[];
  setLabels: string[];
};

const MUSICAL_KEYS: MusicalKey[] = [
  'C',
  'C#',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];

export function parseGoogleSheetUrl(input: string): { id: string; gid: string } | null {
  const trimmed = input.trim();
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return null;
  const gidMatch = trimmed.match(/[?#&]gid=([0-9]+)/);
  return { id: idMatch[1], gid: gidMatch?.[1] ?? '0' };
}

export function googleSheetCsvUrl(id: string, gid: string) {
  // Prefer export without forcing gid=0 — some sheets reject it with HTTP 400.
  if (!gid || gid === '0') {
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
  }
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

type ColMap = {
  artist?: number;
  title?: number;
  key?: number;
  bpm?: number;
  duration?: number;
  genre?: number;
  set?: number;
};

function detectColumns(header: string[]): ColMap | null {
  const map: ColMap = {};
  header.forEach((raw, index) => {
    const h = normalizeHeader(raw);
    if (!h) return;
    if (
      ['artista', 'artist', 'banda', 'band', 'autor', 'interpreter', 'interprete'].includes(h)
    ) {
      map.artist = index;
    } else if (
      ['titulo', 'title', 'cancion', 'song', 'tema', 'track', 'nombre'].includes(h)
    ) {
      map.title = index;
    } else if (['tono', 'tonalidad', 'key', 'nota', 'acorde'].includes(h)) {
      map.key = index;
    } else if (['bpm', 'tempo'].includes(h)) {
      map.bpm = index;
    } else if (
      ['duracion', 'duration', 'durationsec', 'segundos', 'secs', 'length', 'minutos'].includes(h)
    ) {
      map.duration = index;
    } else if (['genero', 'genre', 'estilo', 'style'].includes(h)) {
      map.genre = index;
    } else if (['set', 'bloque', 'block', 'setname', 'nombredelset', 'act'].includes(h)) {
      map.set = index;
    }
  });
  if (map.artist !== undefined && map.title !== undefined) return map;
  return null;
}

function parseTono(raw: string): { key: MusicalKey; keyMode: KeyMode; notes?: string } {
  const cleaned = raw.trim();
  if (!cleaned) return { key: 'C', keyMode: 'major' };
  const first = cleaned.split(/[\/\-\|,]/)[0]?.trim() ?? cleaned;
  let keyMode: KeyMode = /m$|min|menor/i.test(first) ? 'minor' : 'major';
  let root = first.replace(/minor|menor|major|mayor/gi, '').replace(/m$/i, '').trim();
  const aliases: Record<string, MusicalKey> = {
    Db: 'Db',
    'C#': 'C#',
    Eb: 'Eb',
    'D#': 'Eb',
    'F#': 'F#',
    Gb: 'F#',
    Ab: 'Ab',
    'G#': 'Ab',
    Bb: 'Bb',
    'A#': 'Bb',
  };
  const mapped = (aliases[root] ?? root) as MusicalKey;
  const key = MUSICAL_KEYS.includes(mapped) ? mapped : 'C';
  const notes =
    cleaned.includes('/') || cleaned.includes('-') || cleaned !== first
      ? `Tono original: ${cleaned}`
      : undefined;
  return { key, keyMode, notes };
}

function parseDuration(raw: string): number {
  const v = raw.trim();
  if (!v) return DEFAULT_SONG_DURATION_SEC;
  if (/^\d+:\d{1,2}$/.test(v)) {
    const [m, s] = v.split(':').map(Number);
    return Math.max(1, m * 60 + s);
  }
  const n = Number(v.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_SONG_DURATION_SEC;
  // values like 3.5 mean minutes
  if (n > 0 && n < 30 && !Number.isInteger(n)) return Math.round(n * 60);
  // 180 => seconds; 3 => minutes if small integer? Prefer seconds if >= 30
  if (n < 30) return Math.round(n * 60);
  return Math.round(n);
}

function parseGenre(raw: string): Genre {
  const n = normalizeHeader(raw);
  const hit = GENRES.find((g) => normalizeHeader(g) === n);
  if (hit) return hit;
  if (n.includes('regional') || n.includes('nortena') || n.includes('norteña') || n.includes('banda')) {
    return 'regionalMexicano';
  }
  if (n.includes('punk')) return 'punk';
  if (n.includes('salsa')) return 'salsa';
  if (n.includes('metalcore')) return 'metalcore';
  if (n.includes('hardcore')) return 'hardcore';
  if (n.includes('djent')) return 'djent';
  if (n.includes('progres')) return 'progressive';
  if (n.includes('rock')) return 'rock';
  if (n.includes('pop')) return 'pop';
  if (n.includes('cumbia') || n.includes('ska') || n.includes('reggae')) return 'latin';
  if (n.includes('latin') || n.includes('latino')) return 'latin';
  return 'other';
}

function cell(row: string[], index: number | undefined) {
  if (index === undefined) return '';
  return (row[index] ?? '').trim();
}

export function rowsToImportPlan(rows: string[][], fallbackName: string): SheetImportPlan {
  if (rows.length === 0) {
    throw new Error('empty_sheet');
  }

  let start = 0;
  let cols = detectColumns(rows[0] ?? []);
  if (cols) {
    start = 1;
  } else {
    // Barra Libre style: Artist | Title | Key
    cols = { artist: 0, title: 1, key: 2 };
  }

  const songs: SheetImportSong[] = [];
  for (let i = start; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const artist = cell(row, cols.artist);
    const title = cell(row, cols.title);
    if (!artist || !title) continue;

    const tono = cell(row, cols.key);
    const { key, keyMode, notes } = parseTono(tono);
    const bpmRaw = cell(row, cols.bpm);
    const bpm = Number(bpmRaw);
    const setLabel = cell(row, cols.set) || '1';

    songs.push({
      artist,
      title,
      bpm: Number.isFinite(bpm) && bpm > 0 ? Math.round(bpm) : 118,
      key,
      keyMode,
      genre: cols.genre !== undefined ? parseGenre(cell(row, cols.genre)) : 'rock',
      durationSec: parseDuration(cell(row, cols.duration)),
      notes,
      setLabel,
    });
  }

  if (songs.length === 0) throw new Error('no_songs');

  const setLabels: string[] = [];
  for (const song of songs) {
    if (!setLabels.includes(song.setLabel)) setLabels.push(song.setLabel);
  }

  return { name: fallbackName, songs, setLabels };
}

export async function fetchGoogleSheetCsv(urlOrId: string): Promise<string> {
  const parsed = parseGoogleSheetUrl(urlOrId);
  const csvUrl = parsed
    ? googleSheetCsvUrl(parsed.id, parsed.gid)
    : urlOrId.trim();

  const tryUrls = [csvUrl];
  if (parsed) {
    tryUrls.push(
      `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv`,
      `https://docs.google.com/spreadsheets/d/${parsed.id}/gviz/tq?tqx=out:csv&sheet=Canciones`,
      `https://docs.google.com/spreadsheets/d/${parsed.id}/gviz/tq?tqx=out:csv&gid=${parsed.gid}`,
    );
  }

  let lastError: Error | null = null;
  for (const url of tryUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        lastError = new Error(`http_${res.status}`);
        continue;
      }
      const text = await res.text();
      if (/<!DOCTYPE html|/i.test(text) && text.includes('Sign in')) {
        lastError = new Error('sheet_not_public');
        continue;
      }
      if (!text.trim()) {
        lastError = new Error('empty_sheet');
        continue;
      }
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('fetch_failed');
    }
  }

  // Backend proxy (helps with CORS on web)
  try {
    const base = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787').replace(/\/$/, '');
    const proxy = `${base}/v1/sheets/csv?url=${encodeURIComponent(csvUrl)}`;
    const res = await fetch(proxy);
    if (res.ok) {
      const text = await res.text();
      if (text.trim()) return text;
    }
  } catch {
    // ignore
  }

  throw lastError ?? new Error('fetch_failed');
}

export async function loadSheetImportPlan(
  url: string,
  name: string,
): Promise<SheetImportPlan> {
  const csv = await fetchGoogleSheetCsv(url);
  const rows = parseCsv(csv);
  return rowsToImportPlan(rows, name.trim() || 'Setlist importado');
}

export function buildSetlistFromImport(
  plan: SheetImportPlan,
  resolvedSongs: Song[],
  targetMinutes = DEFAULT_SET_MINUTES,
): SetlistInput {
  const byKey = new Map(
    resolvedSongs.map((s) => [
      `${s.artist.trim().toLowerCase()}::${s.title.trim().toLowerCase()}`,
      s,
    ]),
  );

  const sets: SetBlock[] = plan.setLabels.map((label, index) => {
    const refs = plan.songs
      .filter((s) => s.setLabel === label)
      .map((s, order) => {
        const song = byKey.get(
          `${s.artist.trim().toLowerCase()}::${s.title.trim().toLowerCase()}`,
        );
        if (!song) return null;
        return { songId: song.id, order };
      })
      .filter(Boolean) as { songId: string; order: number }[];

    const numeric = /^\d+$/.test(label);
    return {
      id: createId('set'),
      name: numeric ? `Set ${label}` : label,
      targetMinutes,
      songs: refs,
    };
  });

  return {
    name: plan.name,
    sets: sets.length
      ? sets
      : [
          {
            id: createId('set'),
            name: 'Set 1',
            targetMinutes,
            songs: [],
          },
        ],
  };
}

export function mergeImportedSongs(
  existing: Song[],
  incoming: SongInput[],
): { songs: Song[]; added: number; allForRefs: Song[] } {
  const map = new Map(
    existing.map((s) => [
      `${s.artist.trim().toLowerCase()}::${s.title.trim().toLowerCase()}`,
      s,
    ]),
  );
  const stamp = nowIso();
  let added = 0;
  const allForRefs: Song[] = [...existing];

  for (const input of incoming) {
    const key = `${input.artist.trim().toLowerCase()}::${input.title.trim().toLowerCase()}`;
    const found = map.get(key);
    if (found) {
      if (!allForRefs.some((s) => s.id === found.id)) allForRefs.push(found);
      continue;
    }
    const song: Song = {
      ...input,
      id: createId('song'),
      createdAt: stamp,
      updatedAt: stamp,
    };
    map.set(key, song);
    allForRefs.push(song);
    added++;
  }

  const songs = Array.from(map.values());
  return { songs, added, allForRefs };
}
