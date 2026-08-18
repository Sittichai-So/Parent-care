import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type InfoRowProps = {
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Phosphor icon component — takes precedence over `icon` when given (see `AppButton`'s `phosphorIcon`). */
  phosphorIcon?: PhosphorIcon;
  label: string;
  value: string;
};

/** Icon + label + value line used on the detail screens. With neither `icon`
 *  nor `phosphorIcon`, renders as a plain label-left/value-right line instead
 *  — the reference design's icon-less info-card rows (Member detail). */
export function InfoRow({ icon, phosphorIcon: PhosphorIconComp, label, value }: InfoRowProps) {
  const theme = useTheme();
  const hasIcon = !!(icon || PhosphorIconComp);

  if (!hasIcon) {
    return (
      <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.compactRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold" style={styles.compactValue} numberOfLines={1}>
          {value}
        </ThemedText>
      </View>
    );
  }

  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: theme.surfaceSunken }]}>
        {PhosphorIconComp ? (
          <PhosphorIconComp weight="duotone" size={18} color={theme.textSecondary} />
        ) : icon ? (
          <Ionicons name={icon} size={18} color={theme.textSecondary} />
        ) : null}
      </View>
      <View style={styles.textWrap}>
        <ThemedText type="caption" themeColor="textMuted">
          {label}
        </ThemedText>
        <ThemedText type="smallBold">{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: { flex: 1, gap: 1 },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  compactValue: { flexShrink: 1, textAlign: 'right' },
});
