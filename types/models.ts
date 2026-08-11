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
  | 'reggaeton'
  | 'metal'
  | 'country'
  | 'funk'
  | 'soul'
  | 'indie'
  | 'other';

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: MusicalKey;
  keyMode: KeyMode;
  genre: Genre;
  /** Duration in seconds (default ~3:30 for covers). */
  durationSec: number;
  notes?: string;
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
  /** Target length in minutes (e.g. 45). */
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
