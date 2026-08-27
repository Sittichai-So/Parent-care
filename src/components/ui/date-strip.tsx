import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { HitSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, toDateKey } from '@/utils/date';

type DateStripProps = {
  value: string | null;
  onChange: (dateKey: string) => void;
  daysAhead?: number;
  hasEventOn?: (dateKey: string) => boolean;
};

export function DateStrip({ value, onChange, daysAhead = 30, hasEventOn }: DateStripProps) {
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
        const dayLabel = index === 0 ? 'วันนี้' : index === 1 ? 'พรุ่งนี้' : date.toLocaleDateString('th-TH', { weekday: 'short' });
        const showMonth = index === 0 || date.getDate() === 1;
        const hasEvent = hasEventOn?.(key) ?? false;
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
            {hasEventOn ? (
              <View
                style={[
                  styles.dot,
                  { backgroundColor: hasEvent ? (active ? theme.accentYellow : theme.primary) : 'transparent' },
                ]}
              />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.three, paddingVertical: Spacing.one, paddingHorizontal: Spacing.half },
  day: {
    width: 68,
    minHeight: HitSize.xlarge,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two,
  },
  dayNumber: { fontSize: 24, lineHeight: 28, fontWeight: '800' },
  dot: { width: 6, height: 6, borderRadius: Radius.full },
  pressed: { opacity: 0.85 },
});
