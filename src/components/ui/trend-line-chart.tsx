import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChartPoint } from '@/utils/reports';

export type TrendSeries = { label: string; color: string; points: ChartPoint[] };

type TrendLineChartProps = {
  series: TrendSeries[];
  height?: number;
  unit?: string;
  emptyMessage?: string;
};

const VIEW_WIDTH = 300;
const PAD_X = 6;
const PAD_Y = 14;

/** Small multi-series line chart for a trend over time (blood pressure,
 *  sugar, weight, …) — the one report chart that genuinely needs `Path`
 *  arcs/segments rather than a rectangle, so it's the sole SVG-line
 *  component; `BarChart`/`DonutChart` cover the rest. Renders on a fixed
 *  `viewBox` and scales to the card's width via `width="100%"`. */
export function TrendLineChart({ series, height = 140, unit, emptyMessage = 'ยังไม่มีข้อมูลเพียงพอสำหรับกราฟ' }: TrendLineChartProps) {
  const theme = useTheme();

  const pointCount = Math.max(0, ...series.map((s) => s.points.length));
  const values = series.flatMap((s) => s.points.map((p) => p.y));

  if (pointCount < 2 || values.length === 0) {
    return (
      <View style={[styles.empty, { height: Math.min(height, 72) }]}>
        <ThemedText type="small" themeColor="textSecondary">
          {emptyMessage}
        </ThemedText>
      </View>
    );
  }

  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const yRange = maxY - minY || 1;
  const xStep = pointCount > 1 ? (VIEW_WIDTH - PAD_X * 2) / (pointCount - 1) : 0;

  const mapPoint = (index: number, value: number) => ({
    x: PAD_X + index * xStep,
    y: PAD_Y + (1 - (value - minY) / yRange) * (height - PAD_Y * 2),
  });

  const firstLabel = series.find((s) => s.points.length > 0)?.points[0]?.x ?? '';
  const lastSeriesWithPoints = [...series].reverse().find((s) => s.points.length > 0);
  const lastLabel = lastSeriesWithPoints?.points[lastSeriesWithPoints.points.length - 1]?.x ?? '';

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIEW_WIDTH} ${height}`}>
        <Line x1={PAD_X} y1={height / 2} x2={VIEW_WIDTH - PAD_X} y2={height / 2} stroke={theme.border} strokeWidth={1} strokeDasharray="4 4" />
        {series.map((s) => {
          if (s.points.length === 0) return null;
          const coords = s.points.map((point, index) => mapPoint(index, point.y));
          const d = coords.map((c, index) => `${index === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
          return (
            <G key={s.label}>
              <Path d={d} stroke={s.color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              {coords.map((c, index) => (
                <Circle key={index} cx={c.x} cy={c.y} r={3} fill={s.color} />
              ))}
            </G>
          );
        })}
      </Svg>

      <View style={styles.axisRow}>
        <ThemedText type="caption" themeColor="textMuted">
          {firstLabel}
        </ThemedText>
        <ThemedText type="caption" themeColor="textMuted">
          {lastLabel}
        </ThemedText>
      </View>

      <View style={styles.legendRow}>
        {series.map((s) => (
          <View key={s.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <ThemedText type="caption" themeColor="textSecondary">
              {s.label}
              {unit ? ` (${unit})` : ''}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { justifyContent: 'center', alignItems: 'center' },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.half },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, marginTop: Spacing.two },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  legendDot: { width: 8, height: 8, borderRadius: Radius.full },
});
