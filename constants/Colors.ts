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
 * Nocturne — quiet dark interface: near-neutral blue-grey ground, one blurple accent
 * used as a line and a glow, never as a flood. Contrast comes from the tonal ramps,
 * not from saturation.
 *
 * `tint` and `accent` are the SAME hue on purpose: Nocturne is a mono scheme. Where the
 * old neon palette used magenta for actions and cyan for highlights, both now resolve to
 * the blurple ramp — `tint` is the base (#9184D9, for borders, icons and outlined
 * buttons) and `accent` is the lighter step (#D2CEFD, for text on dark tints and for
 * "near end" / active emphasis).
 *
 * Rules that come with this palette:
 * - Never flood a large area with the accent. Outlined buttons only, no solid fills.
 *   The one exception is the share poster gradient (#262A60 → #191B2A).
 * - No pure black or white — every value is a ramp step.
 * - Elevation on a dark ground is an edge plus ambient darkness, not stacked shadows.
 * - Headings never go past weight 500; hierarchy is size and space.
 */
const nocturne = {
  text: '#E9E9ED',
  textMuted: 'rgba(233, 233, 237, 0.55)',
  /** Kickers, metadata, disabled-ish labels. */
  textFaint: 'rgba(233, 233, 237, 0.4)',

  background: '#161826',
  /** Behind bottom sheets and modals; also the show-mode ground is darker still. */
  backgroundAlt: '#12141F',
  /** Full-screen scrim ground for sheets. */
  backgroundSheet: '#0F111C',

  surface: '#232532',
  surfaceElevated: '#2A2C3B',
  /** Accent-tinted surface: active tab pill, accent tag, toast. */
  surfaceAccent: '#2B2741',
  /** Sheet and modal body. */
  surfaceSheet: '#191B2A',

  border: '#3F424D',
  borderStrong: '#595D6C',
  /** Faint rules inside grouped lists. */
  divider: 'rgba(233, 233, 237, 0.09)',

  /** Base accent — borders, icons, outlined buttons. 3:1 on the ground: chrome, not body copy. */
  tint: '#9184D9',
  /** Fill behind an active pill or a hovered outlined button. */
  tintSoft: 'rgba(145, 132, 217, 0.28)',
  /** Informational banner ground. */
  tintFaint: 'rgba(145, 132, 217, 0.1)',
  tintGlow: 'rgba(145, 132, 217, 0.22)',

  /** Light ramp step — accent text on the dark ground, and the "near end" emphasis. */
  accent: '#D2CEFD',
  accentSoft: 'rgba(210, 206, 253, 0.16)',
  /** Paragraph-size accent text and links (accent-300). */
  accentText: '#B5ABFC',
  /** Text on a solid accent tint (accent-100). */
  accentOn: '#E7E5FE',

  purple: '#9184D9',
  purpleSoft: 'rgba(145, 132, 217, 0.2)',

  success: '#8FD9B6',
  warning: '#D9C48F',

  tabIconDefault: 'rgba(233, 233, 237, 0.5)',
  tabIconSelected: '#D2CEFD',
  /** The pill is glass; this is the fallback under GlassSurface. */
  tabBar: 'rgba(43, 39, 65, 0.5)',
  overlay: 'rgba(15, 17, 28, 0.62)',

  /** Radii and elevation, so screens stop hard-coding them. */
  radiusTag: 6,
  radiusMd: 8,
  radiusLg: 12,
  radiusPill: 999,
};

export const Colors = {
  light: nocturne,
  dark: nocturne,
};

export default Colors;
