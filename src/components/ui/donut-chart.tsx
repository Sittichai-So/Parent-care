import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { BadgeTone } from './status-badge';

export type DonutSegment = { label: string; value: number; tone: BadgeTone };

type DonutChartProps = {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
};

export function DonutChart({ data, size = 128, strokeWidth = 16, centerLabel }: DonutChartProps) {
  const theme = useTheme();

  const toneColor: Record<BadgeTone, string> = {
    neutral: theme.textMuted,
    primary: theme.primary,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
  };

  const total = data.reduce((sum, segment) => sum + segment.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let drawn = 0;

  return (
    <View style={styles.row}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation={-90} originX={size / 2} originY={size / 2}>
            {total === 0 ? (
              <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.border} strokeWidth={strokeWidth} fill="none" />
            ) : (
              data
                .filter((segment) => segment.value > 0)
                .map((segment) => {
                  const length = (segment.value / total) * circumference;
                  const dashOffset = -drawn;
                  drawn += length;
                  return (
                    <Circle
                      key={segment.label}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={toneColor[segment.tone]}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${length} ${circumference - length}`}
                      strokeDashoffset={dashOffset}
                      fill="none"
                    />
                  );
                })
            )}
          </G>
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <ThemedText type="heading">{total}</ThemedText>
          {centerLabel ? (
            <ThemedText type="caption" themeColor="textMuted">
              {centerLabel}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <View style={styles.legend}>
        {data.map((segment) => (
          <View key={segment.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: toneColor[segment.tone] }]} />
            <ThemedText type="small" style={styles.legendLabel} numberOfLines={1}>
              {segment.label}
            </ThemedText>
            <ThemedText type="smallBold">{segment.value}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  center: { justifyContent: 'center', alignItems: 'center' },
  legend: { flex: 1, gap: Spacing.two },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  legendLabel: { flex: 1 },
  dot: { width: 9, height: 9, borderRadius: Radius.full },
});
