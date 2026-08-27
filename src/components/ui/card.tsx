import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CardTone = 'surface' | 'sunken' | 'primary' | 'success' | 'warning' | 'danger' | 'readOnly';

type CardProps = {
  children: ReactNode;
  tone?: CardTone;
  elevation?: 'flat' | 'raised' | 'floating';
  padding?: number;
  gap?: number;
  accented?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  tone = 'surface',
  elevation = 'raised',
  padding = Spacing.three,
  gap = Spacing.two,
  accented = false,
  style,
}: CardProps) {
  const theme = useTheme();

  const tones: Record<CardTone, { background: string; border: string }> = {
    surface: { background: theme.backgroundElement, border: theme.border },
    sunken: { background: theme.surfaceSunken, border: theme.border },
    primary: { background: theme.primarySoft, border: theme.primary },
    success: { background: theme.successSoft, border: theme.success },
    warning: { background: theme.warningSoft, border: theme.warning },
    danger: { background: theme.dangerSoft, border: theme.danger },
    readOnly: { background: theme.readOnlyBg, border: theme.warning },
  };

  const shadow =
    elevation === 'floating'
      ? { ...Elevation.high, shadowColor: theme.shadow }
      : elevation === 'raised'
        ? { ...Elevation.low, shadowColor: theme.shadow }
        : null;

  const borderWidth = accented ? 2 : elevation === 'floating' ? 0 : StyleSheet.hairlineWidth * 2;

  return (
    <View
      style={[
        styles.card,
        elevation === 'floating' && styles.cardFloating,
        {
          backgroundColor: tones[tone].background,
          borderColor: tones[tone].border,
          borderWidth,
          padding,
          gap,
        },
        shadow,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
  },
  cardFloating: {
    borderRadius: Radius.xl,
  },
});
