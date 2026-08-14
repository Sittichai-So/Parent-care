import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatDateKey, todayKey } from '@/utils/date';

type ReportHeaderProps = {
  title: string;
  subtitle: string;
};

/** Shared masthead for every role's report tab — title + who/what it covers
 *  + today's date, so each screen reads as a dated report rather than a
 *  live dashboard (even though, like the rest of the app, it's live data). */
export function ReportHeader({ title, subtitle }: ReportHeaderProps) {
  return (
    <View style={styles.wrap}>
      <ThemedText type="display" accessibilityRole="header">
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {subtitle}
      </ThemedText>
      <ThemedText type="caption" themeColor="textMuted">
        ข้อมูล ณ วันที่ {formatDateKey(todayKey(), { day: 'numeric', month: 'long', year: 'numeric' })}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.half },
});
