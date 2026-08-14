/**
 * Design tokens for Parent Care.
 *
 * Every screen is built from these tokens — colours, spacing, radii and elevation.
 * Both `light` and `dark` must define the exact same keys: `ThemeColor` is derived
 * from their intersection, and `useTheme()` swaps the whole palette at runtime.
 *
 * Rule of thumb for screens: never hardcode a hex value. Read it from `useTheme()`
 * so the UI stays correct in both colour schemes.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    /* Text */
    text: '#0F172A',
    textSecondary: '#5A6B80',
    textMuted: '#94A3B8',

    /* Surfaces */
    background: '#F5F7FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6EDF7',
    surfaceSunken: '#EDF1F8',

    /* Lines */
    border: '#E4E9F2',
    borderStrong: '#CBD5E1',

    /* Brand */
    primary: '#3D63E3',
    primaryPressed: '#2C4CC4',
    primarySoft: '#E7EFFE',
    primaryText: '#2C4CC4',
    onPrimary: '#FFFFFF',

    /* Status — `*Soft` is a background, `*Text` is legible on that background */
    success: '#15803D',
    successSoft: '#E6F6EC',
    successText: '#14663A',
    warning: '#B45309',
    warningSoft: '#FDF3E3',
    warningText: '#8A4B08',
    danger: '#DC2626',
    dangerSoft: '#FDECEC',
    dangerText: '#A31818',

    /* Hero / header block */
    hero: '#16233B',
    heroText: '#FFFFFF',
    heroTextMuted: '#BFCADB',
    heroSurface: 'rgba(255, 255, 255, 0.12)',

    /* Forms */
    inputBackground: '#FFFFFF',
    placeholder: '#9AA8BA',

    /* Effects */
    shadow: '#0B1220',
    overlay: 'rgba(15, 23, 42, 0.45)',
  },
  dark: {
    /* Text */
    text: '#ECF1F8',
    textSecondary: '#A2B0C2',
    textMuted: '#7C8AA0',

    /* Surfaces */
    background: '#0B1220',
    backgroundElement: '#151E2E',
    backgroundSelected: '#22304A',
    surfaceSunken: '#101A28',

    /* Lines */
    border: '#24314A',
    borderStrong: '#33456A',

    /* Brand */
    primary: '#6AA6FF',
    primaryPressed: '#4E8CF0',
    primarySoft: '#172A47',
    primaryText: '#A9C9FF',
    onPrimary: '#08172B',

    /* Status */
    success: '#4ADE80',
    successSoft: '#10291D',
    successText: '#86EFAC',
    warning: '#FBBF24',
    warningSoft: '#2C2110',
    warningText: '#FCD34D',
    danger: '#F87171',
    dangerSoft: '#2E1517',
    dangerText: '#FCA5A5',

    /* Hero / header block */
    hero: '#1B2942',
    heroText: '#F8FAFC',
    heroTextMuted: '#AFBDD1',
    heroSurface: 'rgba(255, 255, 255, 0.08)',

    /* Forms */
    inputBackground: '#131C2B',
    placeholder: '#6F7E93',

    /* Effects */
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = (typeof Colors)['light'];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Corner radii. Cards use `lg`, controls use `md`, pills use `full`. */
export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

/**
 * Shadow presets. Compose with the theme's shadow colour so dark mode does not
 * paint a blue-grey haze: `{ ...Elevation.low, shadowColor: theme.shadow }`.
 */
export const Elevation = {
  low: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  high: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

/** Minimum tap target. Elder-facing controls use `HitSize.large`. */
export const HitSize = {
  small: 40,
  medium: 48,
  large: 56,
  xlarge: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
