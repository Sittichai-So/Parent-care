import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey, todayKey } from '@/utils/date';

type ReportHeaderProps = {
  title: string;
  subtitle: string;
};

export function ReportHeader({ title, subtitle }: ReportHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { backgroundColor: theme.hero, paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.inner}>
        <ThemedText type="display" accessibilityRole="header" style={{ color: theme.heroText }}>
          {title}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.heroTextMuted }}>
          {subtitle}
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.heroTextMuted }}>
          ข้อมูล ณ วันที่ {formatDateKey(todayKey(), { day: 'numeric', month: 'long', year: 'numeric' })}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.four },
  inner: { width: '100%', maxWidth: 800, alignSelf: 'center', gap: Spacing.half },
});
