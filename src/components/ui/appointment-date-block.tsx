import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey } from '@/utils/date';

type AppointmentDateBlockProps = {
  /** yyyy-mm-dd date key. */
  date: string;
  /** `compact` for list rows, `large` for a screen's hero card. */
  size?: 'compact' | 'large';
  /** `muted` reads as de-emphasized — used for past appointments. */
  tone?: 'primary' | 'muted';
};

/** The "day tile" showing a date's month + day number (+ weekday at `large`
 *  size) — the one visual language for "this is a date" shared by the
 *  appointments list and the appointment detail hero. */
export function AppointmentDateBlock({ date, size = 'compact', tone = 'primary' }: AppointmentDateBlockProps) {
  const theme = useTheme();
  const large = size === 'large';
  const color = tone === 'primary' ? theme.primaryText : theme.textMuted;

  return (
    <View
      style={[
        styles.block,
        large ? styles.blockLarge : styles.blockCompact,
        { backgroundColor: tone === 'primary' ? theme.primarySoft : theme.surfaceSunken },
      ]}>
      <ThemedText type="caption" style={{ color }}>
        {formatDateKey(date, { month: 'short' })}
      </ThemedText>
      <ThemedText style={[styles.number, large ? styles.numberLarge : styles.numberCompact, { color }]}>
        {date.slice(-2)}
      </ThemedText>
      {large ? (
        <ThemedText type="caption" style={{ color }}>
          {formatDateKey(date, { weekday: 'short' })}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { alignItems: 'center' },
  blockCompact: { width: 52, borderRadius: Radius.md, paddingVertical: Spacing.one },
  blockLarge: { width: 72, borderRadius: Radius.lg, paddingVertical: Spacing.two },
  number: { fontWeight: '800' },
  numberCompact: { fontSize: 18, lineHeight: 22 },
  numberLarge: { fontSize: 30, lineHeight: 36 },
});
