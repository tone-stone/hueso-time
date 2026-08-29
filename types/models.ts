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
  /** Duration in seconds (default ~3:30 for covers). */
  durationSec: number;
  notes?: string;
  /** Mark as favorite for quick filters. */
  favorite?: boolean;
  /** Practice readiness for the band. */
  practiceStatus?: 'ready' | 'practice' | 'showstopper';
  /** Cover art from Spotify / iTunes search. */
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
  /** Target length in minutes (e.g. 45). */
  targetMinutes: number;
  songs: SetSongRef[];
}

/** Artist/genre/BPM/key preferences for a show — used to pre-filter song pickers. */
export interface SongFilters {
  artists: string[];
  genres: Genre[];
  bpmMin?: number;
  bpmMax?: number;
  keys: MusicalKey[];
}

export interface Setlist {
  id: string;
  name: string;
  venue?: string;
  date?: string;
  genreFocus?: Genre;
  /** Preferred artists/genre/BPM/key for this show, set at creation — pre-filters the "add song" picker. */
  songFilters?: SongFilters;
  /** Mark as favorite for quick access. */
  favorite?: boolean;
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
