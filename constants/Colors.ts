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
  'regionalMexicano',
  'reggaeton',
  'metal',
  'punk',
  'hardcore',
  'metalcore',
  'djent',
  'progressive',
  'country',
  'funk',
  'soul',
  'indie',
  'salsa',
  'ethnic',
  'newAge',
  'spiritual',
  'instrumental',
  'experimental',
  'other',
];

/**
 * Neon stage palette — deep navy + magenta + cyan
 * (inspired by music-player dark UI reference).
 */
export const Colors = {
  light: {
    text: '#FFFFFF',
    textMuted: '#9A9AAD',
    background: '#0D0D18',
    backgroundAlt: '#161625',
    surface: '#1C1C2E',
    surfaceElevated: '#25253A',
    border: '#2E2E48',
    borderStrong: '#3D3D5C',
    tint: '#FF2D7B',
    tintSoft: 'rgba(255, 45, 123, 0.18)',
    tintGlow: 'rgba(255, 45, 123, 0.4)',
    accent: '#00E5FF',
    accentSoft: 'rgba(0, 229, 255, 0.16)',
    purple: '#8B5CF6',
    purpleSoft: 'rgba(139, 92, 246, 0.2)',
    success: '#3DDC97',
    warning: '#FFB020',
    tabIconDefault: '#6B6B82',
    tabIconSelected: '#FF2D7B',
    tabBar: '#0A0A14',
    overlay: 'rgba(10, 10, 22, 0.75)',
  },
  dark: {
    text: '#FFFFFF',
    textMuted: '#9A9AAD',
    background: '#0D0D18',
    backgroundAlt: '#161625',
    surface: '#1C1C2E',
    surfaceElevated: '#25253A',
    border: '#2E2E48',
    borderStrong: '#3D3D5C',
    tint: '#FF2D7B',
    tintSoft: 'rgba(255, 45, 123, 0.18)',
    tintGlow: 'rgba(255, 45, 123, 0.4)',
    accent: '#00E5FF',
    accentSoft: 'rgba(0, 229, 255, 0.16)',
    purple: '#8B5CF6',
    purpleSoft: 'rgba(139, 92, 246, 0.2)',
    success: '#3DDC97',
    warning: '#FFB020',
    tabIconDefault: '#6B6B82',
    tabIconSelected: '#FF2D7B',
    tabBar: '#0A0A14',
    overlay: 'rgba(10, 10, 22, 0.75)',
  },
};

export default Colors;
