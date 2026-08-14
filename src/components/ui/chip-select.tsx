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
  /** 'large' gives every chip a big, evenly-sized (2-per-row) tap target with a
   *  checkmark on the selected one — for a screen's primary choice, like a time
   *  slot, where mis-taps are costly. Default is the compact pill used for
   *  secondary picks (roles, linked-item tags). */
  size?: 'default' | 'large';
};

/**
 * A wrapping row of selectable chips. Whether this behaves as single- or
 * multi-select is entirely up to the caller's `onToggle` implementation —
 * replace the array for single-select, splice for multi-select.
 */
export function ChipSelect({ options, selected, onToggle, size = 'default' }: ChipSelectProps) {
  const theme = useTheme();
  const large = size === 'large';

  return (
    <View style={[styles.wrap, large && styles.wrapLarge]}>
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
              large && styles.chipLarge,
              {
                backgroundColor: active ? theme.primary : theme.surfaceSunken,
                borderColor: active ? theme.primary : theme.border,
                borderWidth: large && active ? 2 : 1,
              },
              pressed && styles.pressed,
            ]}>
            <ThemedText
              type={large ? 'default' : 'small'}
              style={{ color: active ? theme.onPrimary : theme.text, fontWeight: '700' }}>
              {large && active ? '✓ ' : ''}
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
  wrapLarge: { gap: Spacing.three },
  chip: {
    minHeight: HitSize.small,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Two per row (not a fixed count) so the tap target stays big regardless of
  // screen width — the goal is fewer accidental neighbor-taps, not a tidy grid.
  chipLarge: {
    minHeight: HitSize.large,
    flexBasis: '47%',
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
  },
  pressed: { opacity: 0.85 },
});
