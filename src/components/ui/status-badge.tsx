import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

type StatusBadgeProps = {
  label: string;
  tone?: BadgeTone;
  /** Coloured dot instead of an emoji — reads better at small sizes. */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function StatusBadge({ label, tone = 'neutral', dot = true, style }: StatusBadgeProps) {
  const theme = useTheme();

  const tones: Record<BadgeTone, { background: string; text: string; dot: string }> = {
    neutral: { background: theme.surfaceSunken, text: theme.textSecondary, dot: theme.textMuted },
    primary: { background: theme.primarySoft, text: theme.primaryText, dot: theme.primary },
    success: { background: theme.successSoft, text: theme.successText, dot: theme.success },
    warning: { background: theme.warningSoft, text: theme.warningText, dot: theme.warning },
    danger: { background: theme.dangerSoft, text: theme.dangerText, dot: theme.danger },
  };

  return (
    <View style={[styles.badge, { backgroundColor: tones[tone].background }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: tones[tone].dot }]} /> : null}
      <ThemedText type="caption" style={{ color: tones[tone].text }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 1,
  },
  dot: { width: 7, height: 7, borderRadius: Radius.full },
});
