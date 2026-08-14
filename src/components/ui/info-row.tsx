import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type InfoRowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

/** Icon + label + value line used on the detail screens. */
export function InfoRow({ icon, label, value }: InfoRowProps) {
  const theme = useTheme();

  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: theme.surfaceSunken }]}>
        <Ionicons name={icon} size={18} color={theme.textSecondary} />
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
});
