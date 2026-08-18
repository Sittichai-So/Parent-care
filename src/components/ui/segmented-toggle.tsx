import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SegmentOption<T extends string> = { value: T; label: string };

type SegmentedToggleProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** A 2-4 way pill switch for picking between mutually-exclusive modes
 *  (e.g. "create a household" vs. "join one" vs. "claim a profile"). */
export function SegmentedToggle<T extends string>({ options, value, onChange }: SegmentedToggleProps<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.toggle, { backgroundColor: theme.primarySoft }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.option, active && { backgroundColor: theme.primary }]}>
            <ThemedText
              type="smallBold"
              numberOfLines={1}
              style={{ color: active ? theme.onPrimary : theme.text }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Pill track + pill option, per the reference design's segmented range
  // control (radius 999, no border — a soft navy-tinted fill instead).
  toggle: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
});
