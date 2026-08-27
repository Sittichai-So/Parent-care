import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AdherenceRingCardProps = {
  pct: number;
  headline: string;
  sub: string;
};

const SIZE = 112;
const STROKE = 11;
const RING_RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function AdherenceRingCard({ pct, headline, sub }: AdherenceRingCardProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const dashOffset = CIRCUMFERENCE - (CIRCUMFERENCE * clamped) / 100;

  return (
    <View style={[styles.card, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RING_RADIUS} stroke="rgba(255,255,255,0.22)" strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RING_RADIUS}
            stroke={theme.accentYellow}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            fill="none"
            rotation={-90}
            originX={SIZE / 2}
            originY={SIZE / 2}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <ThemedText style={[styles.pct, { color: theme.onPrimary }]}>{clamped}%</ThemedText>
          <ThemedText style={[styles.pctLabel, { color: theme.heroTextMuted }]}>ทานยาตรงเวลา</ThemedText>
        </View>
      </View>

      <View style={styles.body}>
        <ThemedText style={[styles.headline, { color: theme.onPrimary }]}>{headline}</ThemedText>
        <ThemedText style={[styles.sub, { color: theme.heroTextMuted }]}>{sub}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 26,
    elevation: 10,
  },
  ringWrap: { width: SIZE, height: SIZE, flexShrink: 0 },
  center: { justifyContent: 'center', alignItems: 'center', gap: 1 },
  pct: { fontSize: 30, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  pctLabel: { fontSize: 11, lineHeight: 14 },
  body: { flex: 1, minWidth: 0, gap: Spacing.two },
  headline: { fontSize: 15, lineHeight: 21, fontWeight: '700' },
  sub: { fontSize: 13, lineHeight: 19 },
});
