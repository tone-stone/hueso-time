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
 * Nocturne — dark interface on a near-neutral blue-grey ground. Blurple is the primary
 * accent; a teal and an amber round out the palette for secondary emphasis and status,
 * plus the usual success / warning / danger / info semantics.
 *
 * This is the higher-contrast revision: body text sits near 15:1 on the ground, muted
 * and faint text are now solid greys (~9:1 and ~5.5:1, no more low-alpha wash), surfaces
 * and borders separate more firmly, and the accents were lifted a ramp step so they read
 * as colour, not as a tint. Hierarchy is still size and space first — colour second.
 *
 * Rules that come with this palette:
 * - Accents are lines, glows and small fills — never a full-bleed flood. The one
 *   exception is the share poster gradient (#262A60 → #191B2A).
 * - No pure black or white — every value is a ramp step.
 * - Elevation on a dark ground is an edge plus ambient darkness, not stacked shadows.
 * - Each `*Text` value is tuned for paragraph-size text on the ground; the base hue is
 *   for chrome (borders, icons, outlines) and the `*Soft` value is a fill behind it.
 */
const nocturne = {
  /** Body text — ~15.5:1 on `background`. */
  text: '#F4F5F8',
  /** Secondary text: subtitles, list metadata. Solid grey, ~9:1 — readable, not a wash. */
  textMuted: '#B7B9C6',
  /** Kickers, timestamps, the faintest labels. Solid grey, ~5.6:1. */
  textFaint: '#8C8FA0',

  background: '#13141E',
  /** Behind bottom sheets and modals; also the show-mode ground is darker still. */
  backgroundAlt: '#0F111A',
  /** Full-screen scrim ground for sheets. */
  backgroundSheet: '#0C0D15',

  surface: '#20222F',
  surfaceElevated: '#282A38',
  /** Accent-tinted surface: active tab pill, accent tag, toast. */
  surfaceAccent: '#2F2A48',
  /** Sheet and modal body. */
  surfaceSheet: '#191B29',

  border: '#4B4E5D',
  borderStrong: '#6E7284',
  /** Faint rules inside grouped lists — still low, but visible now. */
  divider: 'rgba(233, 233, 237, 0.14)',

  /** Base accent — borders, icons, outlined buttons. Lifted for a firmer read on the ground. */
  tint: '#A99CF0',
  /** Fill behind an active pill or a hovered outlined button. */
  tintSoft: 'rgba(169, 156, 240, 0.30)',
  /** Informational banner ground. */
  tintFaint: 'rgba(169, 156, 240, 0.12)',
  tintGlow: 'rgba(169, 156, 240, 0.26)',

  /** Light ramp step — accent text on the dark ground, and the "near end" emphasis. */
  accent: '#DCD8FF',
  accentSoft: 'rgba(220, 216, 255, 0.18)',
  /** Paragraph-size accent text and links (~8.5:1). */
  accentText: '#C4BBFF',
  /** Text on a solid accent tint. */
  accentOn: '#ECEAFF',

  /** Secondary accent — teal. For a second emphasis colour that isn't the blurple:
   * counts, chips, the "rehearse" affordance, chart series B. */
  accent2: '#5FD6C9',
  accent2Text: '#8BE7DC',
  accent2Soft: 'rgba(95, 214, 201, 0.16)',

  /** Tertiary accent — amber. Highlights, "now" markers, chart series C. */
  accent3: '#EBC26A',
  accent3Text: '#F2D28C',
  accent3Soft: 'rgba(235, 194, 106, 0.16)',

  purple: '#A99CF0',
  purpleSoft: 'rgba(169, 156, 240, 0.22)',

  /** Status colours — brightened so they carry on the dark ground. */
  success: '#6FD9A6',
  successSoft: 'rgba(111, 217, 166, 0.16)',
  warning: '#E8C173',
  warningSoft: 'rgba(232, 193, 115, 0.16)',
  danger: '#F0808F',
  dangerSoft: 'rgba(240, 128, 143, 0.16)',
  info: '#7DB8F0',
  infoSoft: 'rgba(125, 184, 240, 0.16)',

  /** Heart "like" red — the one deliberate break from the mono palette; a liked heart
   * has to read as red everywhere, on any theme, or it stops reading as "liked". */
  like: '#FF6B86',
  likeSoft: 'rgba(255, 107, 134, 0.18)',

  tabIconDefault: '#9A9CAD',
  tabIconSelected: '#DCD8FF',
  /** The pill is glass; this is the fallback under GlassSurface. */
  tabBar: 'rgba(43, 39, 65, 0.55)',
  overlay: 'rgba(12, 13, 21, 0.66)',

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
