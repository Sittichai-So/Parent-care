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
 *  than a full calendar dependency for a single "pick an upcoming day" control.
 *  Cells are sized as a primary tap target (not a dense calendar grid) since
 *  this is meant to be easy to hit for elder users, not just easy to scan. */
export function DateStrip({ value, onChange, daysAhead = 30 }: DateStripProps) {
  const theme = useTheme();

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: daysAhead }, (_, index) => addDays(today, index));
  }, [daysAhead]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((date, index) => {
        const key = toDateKey(date);
        const active = key === value;
        // Naming the first two days outright saves the user from having to
        // do date math against a weekday abbreviation.
        const dayLabel = index === 0 ? 'วันนี้' : index === 1 ? 'พรุ่งนี้' : date.toLocaleDateString('th-TH', { weekday: 'short' });
        // Only call out the month when it's not obvious from context — the
        // very first cell, or wherever the strip crosses into a new month.
        const showMonth = index === 0 || date.getDate() === 1;
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
                borderWidth: active ? 2 : 1,
              },
              pressed && styles.pressed,
            ]}>
            <ThemedText
              type="small"
              numberOfLines={1}
              style={{ color: active ? theme.onPrimary : theme.textMuted, fontWeight: '700' }}>
              {dayLabel}
            </ThemedText>
            <ThemedText style={[styles.dayNumber, { color: active ? theme.onPrimary : theme.text }]}>
              {date.getDate()}
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: active ? theme.onPrimary : theme.textMuted, opacity: showMonth ? 1 : 0 }}>
              {date.toLocaleDateString('th-TH', { month: 'short' })}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.three, paddingVertical: Spacing.one, paddingHorizontal: Spacing.half },
  day: {
    width: 72,
    minHeight: HitSize.xlarge,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two,
  },
  dayNumber: { fontSize: 24, lineHeight: 28, fontWeight: '800' },
  pressed: { opacity: 0.85 },
});
