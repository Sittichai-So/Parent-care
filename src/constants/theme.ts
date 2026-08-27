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
    primary: '#1E3A8A',
    primaryPressed: '#16295C',
    primarySoft: '#E8EFFB',
    primaryText: '#1E3A8A',
    onPrimary: '#FFFFFF',

    teal: '#1FBE8C',
    tealPressed: '#159C71',
    tealSoft: '#E3FBF3',
    tealText: '#0F7A5C',
    onTeal: '#FFFFFF',

    eyebrow: '#3B5CB8',

    brandGradient: 'linear-gradient(135deg, #1E3A8A 0%, #2F4FBE 100%)',

    /* Lavender accent */
    lavender: '#8B7CF6',
    lavenderSoft: '#F1EEFE',
    lavenderText: '#5B4BC4',

    /* Status */
    success: '#1FBE8C',
    successSoft: '#E3FBF3',
    successText: '#0F7A5C',
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

    /* Onboarding */
    sky: '#DBEAFE',
    skySoft: '#EAF2FB',
    heroArt: '#C7DBFA',
    accentYellow: '#F5C451',
    accentYellowText: '#7A4E06',

    /* Forms */
    inputBackground: '#FFFFFF',
    placeholder: '#9AA8BA',

    readOnlyBg: '#FFF7E6',

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
    primary: '#7C9EEF',
    primaryPressed: '#5A7FDD',
    primarySoft: '#1B2A4D',
    primaryText: '#B7C8F5',
    onPrimary: '#0B1730',

    teal: '#3EE7BE',
    tealPressed: '#2BC9A3',
    tealSoft: '#123528',
    tealText: '#8FF3D4',
    onTeal: '#04241A',

    eyebrow: '#8FA6E8',

    brandGradient: 'linear-gradient(135deg, #7C9EEF 0%, #5A7FDD 100%)',

    lavender: '#A99BFF',
    lavenderSoft: '#241E42',
    lavenderText: '#C9BFFF',

    /* Status */
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

    /* Onboarding */
    sky: '#243554',
    skySoft: '#17233A',
    heroArt: '#2E4066',
    accentYellow: '#FBBF24',
    accentYellowText: '#3A2A05',

    /* Forms */
    inputBackground: '#131C2B',
    placeholder: '#6F7E93',

    readOnlyBg: '#2E2512',

    /* Effects */
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = (typeof Colors)['light'];

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

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

export const HitSize = {
  small: 40,
  medium: 48,
  large: 56,
  xlarge: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
