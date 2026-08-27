import { Pressable, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { HitSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ChipOption = { value: string; label: string };

type ChipSelectProps = {
  options: readonly ChipOption[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  size?: 'default' | 'large';
};

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
            <View style={styles.labelRow}>
              {large && active ? <Ionicons name="checkmark" size={16} color={theme.onPrimary} /> : null}
              <ThemedText
                type={large ? 'default' : 'small'}
                style={{ color: active ? theme.onPrimary : theme.text, fontWeight: '700' }}>
                {option.label}
              </ThemedText>
            </View>
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
  chipLarge: {
    minHeight: HitSize.large,
    flexBasis: '47%',
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, justifyContent: 'center' },
  pressed: { opacity: 0.85 },
});
