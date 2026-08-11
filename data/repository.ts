import type {
  AppData,
  AppSettings,
  Setlist,
  SetlistInput,
  Song,
  SongInput,
} from '@/types/models';

/**
 * Data access interface — swap LocalStore for an API client later
 * without changing screens/hooks.
 */
export interface DataRepository {
  load(): Promise<AppData>;
  saveSongs(songs: Song[]): Promise<void>;
  saveSetlists(setlists: Setlist[]): Promise<void>;
  saveSettings(settings: AppSettings): Promise<void>;
  upsertSong(input: SongInput, id?: string): Promise<Song>;
  deleteSong(id: string): Promise<void>;
  upsertSetlist(input: SetlistInput, id?: string): Promise<Setlist>;
  deleteSetlist(id: string): Promise<void>;
}
