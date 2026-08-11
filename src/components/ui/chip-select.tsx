import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { HitSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ChipOption = { value: string; label: string };

type ChipSelectProps = {
  options: readonly ChipOption[];
  /** Currently selected values. Pass a single-item array to model a single-select. */
  selected: readonly string[];
  onToggle: (value: string) => void;
};

/**
 * A wrapping row of selectable chips. Whether this behaves as single- or
 * multi-select is entirely up to the caller's `onToggle` implementation —
 * replace the array for single-select, splice for multi-select.
 */
export function ChipSelect({ options, selected, onToggle }: ChipSelectProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => onToggle(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? theme.primary : theme.surfaceSunken,
                borderColor: active ? theme.primary : theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="small" style={{ color: active ? theme.onPrimary : theme.text, fontWeight: '700' }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    minHeight: HitSize.small,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: { opacity: 0.85 },
});
