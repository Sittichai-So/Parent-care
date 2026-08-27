import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { BadgeTone } from './status-badge';

export type BarDatum = { label: string; value: number; tone?: BadgeTone };

type BarChartProps = {
  data: BarDatum[];
  orientation?: 'horizontal' | 'vertical';
  scaleMax?: number;
  valueSuffix?: string;
  verticalHeight?: number;
};

export function BarChart({ data, orientation = 'horizontal', scaleMax, valueSuffix = '', verticalHeight = 120 }: BarChartProps) {
  const theme = useTheme();

  const toneColor: Record<BadgeTone, string> = {
    neutral: theme.textMuted,
    primary: theme.primary,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
  };

  const max = scaleMax ?? Math.max(1, ...data.map((datum) => datum.value));
  const pctOf = (value: number) => Math.min(100, Math.round((value / max) * 100));

  if (data.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        ยังไม่มีข้อมูล
      </ThemedText>
    );
  }

  if (orientation === 'vertical') {
    return (
      <View style={[styles.vRow, { height: verticalHeight }]}>
        {data.map((datum) => (
          <View key={datum.label} style={styles.vCol}>
            <View style={[styles.vTrack, { backgroundColor: theme.surfaceSunken }]}>
              <View
                style={[
                  styles.vFill,
                  { height: `${pctOf(datum.value)}%`, backgroundColor: toneColor[datum.tone ?? 'primary'] },
                ]}
              />
            </View>
            <ThemedText type="caption" themeColor="textMuted">
              {datum.label}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.hWrap}>
      {data.map((datum) => (
        <View key={datum.label} style={styles.hRow}>
          <ThemedText type="small" numberOfLines={1} style={styles.hLabel}>
            {datum.label}
          </ThemedText>
          <View style={[styles.hTrack, { backgroundColor: theme.surfaceSunken }]}>
            <View
              style={[
                styles.hFill,
                { width: `${pctOf(datum.value)}%`, backgroundColor: toneColor[datum.tone ?? 'primary'] },
              ]}
            />
          </View>
          <ThemedText type="caption" style={styles.hValue}>
            {datum.value}
            {valueSuffix}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hWrap: { gap: Spacing.three },
  hRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  hLabel: { width: 84 },
  hTrack: { flex: 1, height: 10, borderRadius: Radius.full, overflow: 'hidden' },
  hFill: { height: '100%', borderRadius: Radius.full },
  hValue: { width: 40, textAlign: 'right' },

  vRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  vCol: { flex: 1, alignItems: 'center', gap: Spacing.one, height: '100%' },
  vTrack: {
    flex: 1,
    width: '60%',
    borderRadius: Radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  vFill: { width: '100%', borderRadius: Radius.sm },
});
