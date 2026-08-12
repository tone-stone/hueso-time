export type MusicalKey =
  | 'C'
  | 'C#'
  | 'Db'
  | 'D'
  | 'Eb'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'Ab'
  | 'A'
  | 'Bb'
  | 'B';

export type KeyMode = 'major' | 'minor';

export type Genre =
  | 'rock'
  | 'pop'
  | 'blues'
  | 'jazz'
  | 'latin'
  | 'regionalMexicano'
  | 'reggaeton'
  | 'metal'
  | 'country'
  | 'funk'
  | 'soul'
  | 'indie'
  | 'punk'
  | 'hardcore'
  | 'metalcore'
  | 'djent'
  | 'progressive'
  | 'salsa'
  | 'ethnic'
  | 'newAge'
  | 'spiritual'
  | 'instrumental'
  | 'experimental'
  | 'other';

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: MusicalKey;
  keyMode: KeyMode;
  genre: Genre;
  durationSec: number;
  notes?: string;
  imageUrl?: string;
  spotifyId?: string;
  externalUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SetSongRef {
  songId: string;
  order: number;
}

export interface SetBlock {
  id: string;
  name: string;
  targetMinutes: number;
  songs: SetSongRef[];
}

export interface Setlist {
  id: string;
  name: string;
  venue?: string;
  date?: string;
  genreFocus?: Genre;
  sets: SetBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  language: 'es' | 'en';
  defaultSetMinutes: number;
  defaultSetCount: number;
}

export interface AppData {
  songs: Song[];
  setlists: Setlist[];
  settings: AppSettings;
}

export type SongInput = Omit<Song, 'id' | 'createdAt' | 'updatedAt'>;
export type SetlistInput = Omit<Setlist, 'id' | 'createdAt' | 'updatedAt'>;

export const defaultSettings: AppSettings = {
  language: 'es',
  defaultSetMinutes: 45,
  defaultSetCount: 3,
};

export function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
