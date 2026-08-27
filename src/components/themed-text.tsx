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
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  title: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  display: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
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
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
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
