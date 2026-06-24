/**
 * BenefitOS Design System — single source of truth for all colors and spacing.
 *
 * Palette: sober, muted dark — same hues as before, desaturated.
 * Screens import `Palette` directly for inline styles.
 * `Colors` is exported for use-theme.ts compatibility (Colors[scheme]).
 */

// ---------------------------------------------------------------------------
// Base palette
// ---------------------------------------------------------------------------
export const Palette = {
  // Backgrounds
  background: '#0F0F1A',
  surface: '#16162A',      // cards / elevated surfaces
  border: '#252545',

  // Primary accent — desaturated purple (was #6C63FF)
  primary: '#5B54D6',
  primaryA12: '#5B54D612',
  primaryA14: '#5B54D614',
  primaryA18: '#5B54D618',
  primaryA22: '#5B54D622',
  primaryA33: '#5B54D633',
  primaryA44: '#5B54D644',
  primaryA55: '#5B54D655',

  // Secondary accent — muted teal (was #00D2FF)
  secondary: '#3D9DB8',
  secondaryA0D: '#3D9DB80D',
  secondaryA22: '#3D9DB822',
  secondaryA44: '#3D9DB844',
  secondaryA66: '#3D9DB866',

  // Success — muted green (was #22C55E)
  success: '#3FA66B',
  successA18: '#3FA66B18',
  successA33: '#3FA66B33',

  // Error — muted rose (was #FF6584)
  error: '#D6566E',
  errorA15: '#D6566E15',
  errorA18: '#D6566E18',
  errorA20: '#D6566E20',
  errorA40: '#D6566E40',
  errorA44: '#D6566E44',

  // Text
  textPrimary: '#EDEDF5',
  textSecondary: '#9999BB',
  textMuted: '#555577',

  // Absolute
  white: '#FFFFFF',
  black: '#000000',

  // Functional (not themed — kept as-is)
  recordingRed: '#D94040',
  amber: '#F59E0B',
} as const;

export type PaletteType = typeof Palette;

// ---------------------------------------------------------------------------
// Spacing scale  (4 8 12 16 24 32)
// ---------------------------------------------------------------------------
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ---------------------------------------------------------------------------
// Colors — used by use-theme.ts (Colors[scheme])
// App is dark-only, both keys point to the same palette.
// ---------------------------------------------------------------------------
export const Colors = {
  dark: Palette,
  light: Palette,
} as const;
