import type { Genre, KeyMode, MusicalKey } from '@/types/models';

export const MUSICAL_KEYS: MusicalKey[] = [
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

export const KEY_MODES: KeyMode[] = ['major', 'minor'];

export const GENRES: Genre[] = [
  'rock',
  'pop',
  'blues',
  'jazz',
  'latin',
  'reggaeton',
  'metal',
  'country',
  'funk',
  'soul',
  'indie',
  'other',
];

export const Colors = {
  light: {
    text: '#1C2430',
    textMuted: '#6B7585',
    background: '#EEF1F4',
    surface: '#FFFFFF',
    border: '#D5DBE3',
    tint: '#D94F3D',
    tintSoft: '#F8E4E0',
    success: '#2F7D4F',
    warning: '#B86E00',
    tabIconDefault: '#9AA3B2',
    tabIconSelected: '#D94F3D',
  },
  dark: {
    text: '#F3F5F7',
    textMuted: '#9AA3B2',
    background: '#12151A',
    surface: '#1C2129',
    border: '#2E3542',
    tint: '#E86A58',
    tintSoft: '#3A2420',
    success: '#4CAF74',
    warning: '#E0A03A',
    tabIconDefault: '#6B7585',
    tabIconSelected: '#E86A58',
  },
};

export default Colors;
