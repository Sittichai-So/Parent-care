import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { HitSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, toDateKey } from '@/utils/date';

type DateStripProps = {
  value: string | null;
  onChange: (dateKey: string) => void;
  daysAhead?: number;
};

/** Horizontal day picker for the next `daysAhead` days — a lighter-weight choice
 *  than a full calendar dependency for a single "pick an upcoming day" control. */
export function DateStrip({ value, onChange, daysAhead = 30 }: DateStripProps) {
  const theme = useTheme();

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: daysAhead }, (_, index) => addDays(today, index));
  }, [daysAhead]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((date) => {
        const key = toDateKey(date);
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={date.toLocaleDateString('th-TH', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            style={({ pressed }) => [
              styles.day,
              {
                backgroundColor: active ? theme.primary : theme.backgroundElement,
                borderColor: active ? theme.primary : theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="caption" style={{ color: active ? theme.onPrimary : theme.textMuted }}>
              {date.toLocaleDateString('th-TH', { weekday: 'short' })}
            </ThemedText>
            <ThemedText style={[styles.dayNumber, { color: active ? theme.onPrimary : theme.text }]}>
              {date.getDate()}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingVertical: Spacing.one },
  day: {
    width: 56,
    minHeight: HitSize.large,
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.half,
  },
  dayNumber: { fontSize: 18, lineHeight: 22, fontWeight: '800' },
  pressed: { opacity: 0.85 },
});
