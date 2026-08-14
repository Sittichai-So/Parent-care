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

    /* Brand — sampled from the actual Parent Care logo's blue→teal heart mark,
     *  not the borrowed navy/amber "medical center" reference this used to
     *  chase. `primary` is the logo's blue figure; `teal` is its green one. */
    primary: '#2F6FEE',
    primaryPressed: '#1D53C7',
    primarySoft: '#E8F0FE',
    primaryText: '#1D53C7',
    onPrimary: '#FFFFFF',

    teal: '#1FBE8C',
    tealPressed: '#159C71',
    tealSoft: '#E3FBF3',
    tealText: '#0F7A5C',
    onTeal: '#FFFFFF',

    /* The two-tone diagonal sweep from the logo's heart mark — used sparingly,
     *  as a fill on primary CTAs and thin accent bars, via `experimental_backgroundImage`. */
    brandGradient: 'linear-gradient(135deg, #2F6FEE 0%, #1FBE8C 100%)',

    /* Notification/reminder accent — the lavender bell badge from the
     *  reference background art has no equivalent among the status tones
     *  below, so it gets its own token rather than borrowing `primary`. */
    lavender: '#8B7CF6',
    lavenderSoft: '#F1EEFE',
    lavenderText: '#5B4BC4',

    /* Status — `*Soft` is a background, `*Text` is legible on that background.
     *  `success` is tuned to the brand teal (not a generic forest green) since
     *  "normal/good" is the most common status shown and should read as
     *  on-brand rather than a stock traffic-light green. */
    success: '#1FBE8C',
    successSoft: '#E3FBF3',
    successText: '#0F7A5C',
    warning: '#B45309',
    warningSoft: '#FDF3E3',
    warningText: '#8A4B08',
    danger: '#DC2626',
    dangerSoft: '#FDECEC',
    dangerText: '#A31818',

    /* Hero / header block — the logo wordmark's own navy, so brand text and
     *  any dark surface share one colour rather than two unrelated darks. */
    hero: '#16233B',
    heroText: '#FFFFFF',
    heroTextMuted: '#BFCADB',
    heroSurface: 'rgba(255, 255, 255, 0.12)',

    /* Onboarding backdrops and the amber "due soon" status badge. */
    sky: '#BFD7F0',
    skySoft: '#EAF2FB',
    accentYellow: '#F5C451',
    accentYellowText: '#7A4E06',

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

    teal: '#3EE7BE',
    tealPressed: '#2BC9A3',
    tealSoft: '#123528',
    tealText: '#8FF3D4',
    onTeal: '#04241A',

    brandGradient: 'linear-gradient(135deg, #6AA6FF 0%, #3EE7BE 100%)',

    lavender: '#A99BFF',
    lavenderSoft: '#241E42',
    lavenderText: '#C9BFFF',

    /* Status — tuned to the brand teal, mirroring the light theme. */
    success: '#3EE7BE',
    successSoft: '#123528',
    successText: '#8FF3D4',
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

    /* Onboarding backdrops and the amber "due soon" status badge — muted,
     *  low-glare counterparts of the light tones so both read correctly. */
    sky: '#243554',
    skySoft: '#17233A',
    accentYellow: '#FBBF24',
    accentYellowText: '#3A2A05',

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
