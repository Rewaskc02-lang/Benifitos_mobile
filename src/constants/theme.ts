/**
 * BenefitOS Design System — Government-grade color palette.
 * Inspired by DigiLocker, UMANG, Passport Seva, Aadhaar, ECI portals.
 * Dual-theme: light (default) and dark, with a professional Navy-Cream-Orange palette.
 */

// ---------------------------------------------------------------------------
// Light Theme (primary — government official feel)
// ---------------------------------------------------------------------------
export const LightPalette = {
  // Core backgrounds
  background: '#F5F0E1',       // Warm cream — government document feel
  surface: '#FFFFFF',           // Pure white cards
  surfaceAlt: '#EEE9D8',       // Slightly tinted surface
  border: '#D4C9A8',
  borderLight: '#E8E0C8',

  // Primary Navy
  primary: '#1E3D59',
  primaryLight: '#2A5478',
  primaryDark: '#142A3E',
  primaryA10: '#1E3D5910',
  primaryA20: '#1E3D5920',
  primaryA30: '#1E3D5930',
  primaryA50: '#1E3D5950',

  // Accent Orange
  accent: '#FF6E40',
  accentLight: '#FF8C66',
  accentDark: '#E5501E',
  accentA15: '#FF6E4015',
  accentA25: '#FF6E4025',
  accentA40: '#FF6E4040',

  // Accent Yellow
  highlight: '#FFC13B',
  highlightA20: '#FFC13B20',
  highlightA40: '#FFC13B40',

  // Success — Government Green
  success: '#1B6B3A',
  successLight: '#28A85A',
  successA15: '#1B6B3A15',
  successA30: '#1B6B3A30',

  // Error — Modern Red
  error: '#C0392B',
  errorLight: '#E74C3C',
  errorA15: '#C0392B15',
  errorA30: '#C0392B30',

  // Warning
  warning: '#D97706',
  warningA20: '#D9770620',

  // Text
  textPrimary: '#1A1F2E',      // Near-black for legibility
  textSecondary: '#4A5568',    // Slate gray
  textMuted: '#8896A5',        // Muted blue-gray
  textInverse: '#FFFFFF',
  textAccent: '#FF6E40',

  // Absolute
  white: '#FFFFFF',
  black: '#000000',

  // Functional
  recordingRed: '#C0392B',
  amber: '#D97706',
  navy: '#1E3D59',
  saffron: '#FF6E40',

  // Shadow
  shadow: '#1E3D5920',
} as const;

// ---------------------------------------------------------------------------
// Dark Theme
// ---------------------------------------------------------------------------
export const DarkPalette = {
  background: '#0D1B2A',
  surface: '#162032',
  surfaceAlt: '#1C2A3D',
  border: '#253547',
  borderLight: '#1E2F42',

  primary: '#4A8FBF',
  primaryLight: '#6AABD4',
  primaryDark: '#2E6A94',
  primaryA10: '#4A8FBF10',
  primaryA20: '#4A8FBF20',
  primaryA30: '#4A8FBF30',
  primaryA50: '#4A8FBF50',

  accent: '#FF7A52',
  accentLight: '#FF9472',
  accentDark: '#E5501E',
  accentA15: '#FF7A5215',
  accentA25: '#FF7A5225',
  accentA40: '#FF7A5240',

  highlight: '#FFC13B',
  highlightA20: '#FFC13B20',
  highlightA40: '#FFC13B40',

  success: '#27AE60',
  successLight: '#2ECC71',
  successA15: '#27AE6015',
  successA30: '#27AE6030',

  error: '#E74C3C',
  errorLight: '#FF6B5B',
  errorA15: '#E74C3C15',
  errorA30: '#E74C3C30',

  warning: '#F59E0B',
  warningA20: '#F59E0B20',

  textPrimary: '#E8EDF2',
  textSecondary: '#94A3B8',
  textMuted: '#546880',
  textInverse: '#0D1B2A',
  textAccent: '#FF7A52',

  white: '#FFFFFF',
  black: '#000000',

  recordingRed: '#E74C3C',
  amber: '#F59E0B',
  navy: '#4A8FBF',
  saffron: '#FF7A52',

  shadow: '#00000040',
} as const;

// PaletteType accepts either theme — the union of both shapes.
export type PaletteType = typeof LightPalette | typeof DarkPalette;

// Default export — light theme is the government-official default
export const Palette = LightPalette;

// ---------------------------------------------------------------------------
// Spacing (8px base unit)
// ---------------------------------------------------------------------------
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ---------------------------------------------------------------------------
// Typography scale
// ---------------------------------------------------------------------------
export const Typography = {
  // Display
  heroSize: 32,
  h1Size: 28,
  h2Size: 22,
  h3Size: 18,
  h4Size: 16,
  // Body
  bodyLarge: 15,
  body: 14,
  bodySmall: 13,
  // Caption
  caption: 12,
  micro: 11,
  // Weight
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  // Line height ratio
  headingLineHeight: 1.25,
  bodyLineHeight: 1.5,
} as const;

// ---------------------------------------------------------------------------
// Border radii
// ---------------------------------------------------------------------------
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  pill: 50,
} as const;

// ---------------------------------------------------------------------------
// Elevation / Shadow presets
// ---------------------------------------------------------------------------
export const Elevation = {
  card: {
    shadowColor: '#1E3D59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// ---------------------------------------------------------------------------
// Colors — legacy compatibility shim (Colors[scheme])
// ---------------------------------------------------------------------------
export const Colors = {
  dark: DarkPalette,
  light: LightPalette,
} as const;
