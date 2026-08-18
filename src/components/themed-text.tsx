import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextType =
  | 'default'
  | 'title'
  | 'display'
  | 'heading'
  | 'sectionTitle'
  | 'body'
  | 'small'
  | 'smallRegular'
  | 'smallBold'
  | 'caption'
  | 'eyebrow'
  | 'subtitle'
  | 'link'
  | 'linkPrimary'
  | 'code';

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        styles[type],
        type === 'linkPrimary' && { color: theme.primary },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  /** Body copy. */
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  /** Regular-weight paragraph copy — taglines, longer hints. Everything else
   *  in this scale is medium-to-heavy; this is the one deliberately lighter
   *  variant, for text that should recede rather than announce itself. */
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  /** Reserved for splash / marketing moments. */
  title: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  /** Screen title inside a hero block. */
  display: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  /** Card / screen heading. */
  heading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  /** Label above a group of cards. */
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  /** Regular-weight detail line under a `smallBold` label — dates, locations,
   *  sub-lines — so label vs. detail reads as bold-vs-regular, not bold-vs-medium. */
  smallRegular: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  /** Timestamps, helper text, badge copy. */
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  /** Small uppercase label above a title — a role, a section kind, a status
   *  tag. Set `themeColor` per use (defaults to inherited text colour); the
   *  reference design's own default tint is `theme.eyebrow`. */
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  /** Legacy: kept for callers that still use the large sub-title scale. */
  subtitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  linkPrimary: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '700' as const }) ?? ('500' as const),
    fontSize: 12,
  },
});
