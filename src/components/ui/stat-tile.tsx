import { StyleSheet, View } from 'react-native';

import type { Icon as PhosphorIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { BadgeTone } from './status-badge';

type StatTileProps = {
  value: string | number;
  label: string;
  tone?: BadgeTone;
  phosphorIcon?: PhosphorIcon;
};

export function StatTile({ value, label, tone = 'neutral', phosphorIcon: Icon }: StatTileProps) {
  const theme = useTheme();

  const tones: Record<BadgeTone, string> = {
    neutral: theme.textSecondary,
    primary: theme.primary,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
  };

  return (
    <View
      accessible
      accessibilityLabel={`${label} ${value}`}
      style={[styles.tile, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {Icon ? <Icon weight="duotone" size={20} color={tones[tone]} /> : null}
      <ThemedText type={Icon ? 'heading' : 'display'} style={{ color: tones[tone] }}>
        {value}
      </ThemedText>
      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2} style={styles.label}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    gap: Spacing.half,
    alignItems: 'center',
  },
  label: { textAlign: 'center' },
});
