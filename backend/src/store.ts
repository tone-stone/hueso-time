import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, copyFileSync, openSync, fsyncSync, closeSync, unlinkSync } from 'node:fs';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, randomUUID } from 'node:crypto';
import { dataSchema } from './schemas.js';
import { initialCatalog } from './catalog.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  type AppData,
  type AppSettings,
  type Setlist,
  type SetlistInput,
  type Song,
  type SongInput,
  createId,
  defaultSettings,
  nowIso,
} from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', 'data');
const scope = new AsyncLocalStorage<{ account: string; expected?: string; committed?: string }>();
export class ConflictError extends Error {}
export class PreconditionError extends Error {}
export function withAccount<T>(account: string, expected: string | undefined, fn: () => T): T {
  return scope.run({ account, expected }, fn);
}
function dataFile(): string {
  const account = scope.getStore()?.account;
  // Legacy file is reserved for offline maintenance; HTTP requests always have an account.
  return account ? join(DATA_DIR, 'accounts', createHash('sha256').update(account).digest('hex') + '.json') : join(DATA_DIR, 'db.json');
}
function emptyData(): AppData {
  return { songs: [], setlists: [], settings: { ...defaultSettings } };
}
export function readDb(): AppData {
  const file = dataFile();
  let raw: string;
  try { raw = readFileSync(file, 'utf8'); }
  catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return scope.getStore()?.account ? initialCatalog() : emptyData();
    }
    throw err;
  }
  try { return dataSchema.parse(JSON.parse(raw)) as AppData; }
  catch (err) { throw new Error('Stored data is corrupt; restore the backup before writing.', { cause: err }); }
}
export function revision(): string {
  return '"' + createHash('sha256').update(JSON.stringify(readDb())).digest('hex') + '"';
}
export function committedRevision(): string | undefined { return scope.getStore()?.committed; }
export function writeDb(data: AppData): void {
  const next = dataSchema.parse(data);
  // Synchronous check + write is indivisible within the single server process.
  const request = scope.getStore();
  if (request) {
    if (!request.expected) throw new PreconditionError();
    if (request.expected !== revision()) throw new ConflictError();
  } else {
    readDb(); // Do not replace corrupted files, including from maintenance scripts.
  }
  const file = dataFile();
  mkdirSync(dirname(file), { recursive: true });
  const temp = file + '.' + randomUUID() + '.tmp';
  try {
    writeFileSync(temp, JSON.stringify(next, null, 2), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    const fd = openSync(temp, 'r');
    try { fsyncSync(fd); } finally { closeSync(fd); }
    if (existsSync(file)) copyFileSync(file, file + '.bak');
    renameSync(temp, file);
    if (request) request.committed = revision();
  } finally {
    if (existsSync(temp)) unlinkSync(temp);
  }
}

export function listSongs(filters?: {
  q?: string;
  artist?: string;
  genre?: string;
  key?: string;
  bpmMin?: number;
  bpmMax?: number;
}): Song[] {
  let songs = readDb().songs;
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    songs = songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q),
    );
  }
  if (filters?.artist) {
    const a = filters.artist.toLowerCase();
    songs = songs.filter((s) => s.artist.toLowerCase() === a);
  }
  if (filters?.genre) {
    songs = songs.filter((s) => s.genre === filters.genre);
  }
  if (filters?.key) {
    songs = songs.filter((s) => s.key === filters.key);
  }
  if (filters?.bpmMin != null) {
    songs = songs.filter((s) => s.bpm >= filters.bpmMin!);
  }
  if (filters?.bpmMax != null) {
    songs = songs.filter((s) => s.bpm <= filters.bpmMax!);
  }
  return songs;
}

export function getSong(id: string): Song | undefined {
  return readDb().songs.find((s) => s.id === id);
}

export function createSong(input: SongInput): Song {
  const db = readDb();
  const stamp = nowIso();
  const song: Song = {
    ...input,
    id: createId('song'),
    createdAt: stamp,
    updatedAt: stamp,
  };
  db.songs.unshift(song);
  writeDb(db);
  return song;
}

export function updateSong(id: string, input: SongInput): Song | null {
  const db = readDb();
  const idx = db.songs.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const song: Song = {
    ...db.songs[idx],
    ...input,
    id,
    updatedAt: nowIso(),
  };
  db.songs[idx] = song;
  writeDb(db);
  return song;
}

export function deleteSong(id: string): boolean {
  const db = readDb();
  const before = db.songs.length;
  db.songs = db.songs.filter((s) => s.id !== id);
  db.setlists = db.setlists.map((sl) => ({
    ...sl,
    sets: sl.sets.map((set) => ({
      ...set,
      songs: set.songs.filter((ref) => ref.songId !== id),
    })),
  }));
  if (db.songs.length === before) return false;
  writeDb(db);
  return true;
}

export function listSetlists(): Setlist[] {
  return readDb().setlists;
}

export function getSetlist(id: string): Setlist | undefined {
  return readDb().setlists.find((s) => s.id === id);
}

export function createSetlist(input: SetlistInput): Setlist {
  const db = readDb();
  const stamp = nowIso();
  const setlist: Setlist = {
    ...input,
    id: createId('setlist'),
    createdAt: stamp,
    updatedAt: stamp,
  };
  db.setlists.unshift(setlist);
  writeDb(db);
  return setlist;
}

export function updateSetlist(id: string, input: SetlistInput): Setlist | null {
  const db = readDb();
  const idx = db.setlists.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const setlist: Setlist = {
    ...db.setlists[idx],
    ...input,
    id,
    updatedAt: nowIso(),
  };
  db.setlists[idx] = setlist;
  writeDb(db);
  return setlist;
}

export function deleteSetlist(id: string): boolean {
  const db = readDb();
  const before = db.setlists.length;
  db.setlists = db.setlists.filter((s) => s.id !== id);
  if (db.setlists.length === before) return false;
  writeDb(db);
  return true;
}

export function getSettings(): AppSettings {
  return readDb().settings;
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const db = readDb();
  db.settings = { ...db.settings, ...partial };
  writeDb(db);
  return db.settings;
}

export function replaceAll(data: AppData): AppData {
  const next: AppData = {
    songs: data.songs ?? [],
    setlists: data.setlists ?? [],
    settings: { ...defaultSettings, ...data.settings },
  };
  writeDb(next);
  return next;
}
