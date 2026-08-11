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

/** App is dark-first — stage / venue / amp vibe. */
export const Colors = {
  light: {
    text: '#F4F1EA',
    textMuted: '#9A948A',
    background: '#07080C',
    backgroundAlt: '#10131A',
    surface: '#151822',
    surfaceElevated: '#1C2030',
    border: '#2A303C',
    borderStrong: '#3A4252',
    tint: '#FF6B4A',
    tintSoft: 'rgba(255, 107, 74, 0.18)',
    tintGlow: 'rgba(255, 107, 74, 0.35)',
    accent: '#F5A524',
    accentSoft: 'rgba(245, 165, 36, 0.16)',
    success: '#3DDC97',
    warning: '#F5A524',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#FF6B4A',
    tabBar: '#090A0F',
    overlay: 'rgba(8, 9, 12, 0.72)',
  },
  dark: {
    text: '#F4F1EA',
    textMuted: '#9A948A',
    background: '#07080C',
    backgroundAlt: '#10131A',
    surface: '#151822',
    surfaceElevated: '#1C2030',
    border: '#2A303C',
    borderStrong: '#3A4252',
    tint: '#FF6B4A',
    tintSoft: 'rgba(255, 107, 74, 0.18)',
    tintGlow: 'rgba(255, 107, 74, 0.35)',
    accent: '#F5A524',
    accentSoft: 'rgba(245, 165, 36, 0.16)',
    success: '#3DDC97',
    warning: '#F5A524',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#FF6B4A',
    tabBar: '#090A0F',
    overlay: 'rgba(8, 9, 12, 0.72)',
  },
};

export default Colors;
