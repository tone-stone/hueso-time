import type { AppData, AppSettings } from '@/types/models';

export const DEFAULT_SONG_DURATION_SEC = 210;
export const DEFAULT_SET_MINUTES = 45;
export const DEFAULT_SET_COUNT = 3;

export const defaultSettings: AppSettings = {
  language: 'es',
  defaultSetMinutes: DEFAULT_SET_MINUTES,
  defaultSetCount: DEFAULT_SET_COUNT,
};

export const emptyAppData = (): AppData => ({
  songs: [],
  setlists: [],
  settings: { ...defaultSettings },
});
