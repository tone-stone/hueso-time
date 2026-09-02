/**
 * App-wide typeface — Poppins (Google Fonts, OFL). Geometric sans with even strokes and
 * rounded terminals. Loaded in app/_layout.tsx, which also installs a base `<Text>` /
 * `<TextInput>` font so body copy and stray `<Text>` pick it up without per-file edits.
 *
 * Use the weight-named families directly in styles; setting `fontWeight` alongside them
 * is redundant (the named face already carries the weight) but harmless.
 */
export const FontFamily = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semibold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  /** Back-compat alias for the old `display` token (UI chrome, titles). */
  display: 'Poppins-Medium',
} as const;

/** The face every `<Text>` falls back to before a style overrides it. */
export const BASE_FONT = FontFamily.regular;

export default FontFamily;
