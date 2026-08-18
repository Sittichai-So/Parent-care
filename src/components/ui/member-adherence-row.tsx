import { Pressable, StyleSheet, View } from 'react-native';

import { CaretRightIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import type { BadgeTone } from '@/components/ui/status-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MemberAdherenceRowProps = {
  name: string;
  /** 0–100. Coloured the same way `adherenceTone` colours every other
   *  adherence number in this app (the report's bar chart, etc.) — not the
   *  reference design's own slightly different 95/85 cutoffs, so the whole
   *  screen's colour language stays consistent rather than having two
   *  competing thresholds on one page. */
  pct: number;
  tone: BadgeTone;
  note: string;
  onPress?: () => void;
};

/** The dashboard's "รายคน" row — avatar, name + percentage, a filled
 *  progress track, and a status note. */
export function MemberAdherenceRow({ name, pct, tone, note, onPress }: MemberAdherenceRowProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));

  const toneColor: Record<BadgeTone, string> = {
    neutral: theme.textSecondary,
    primary: theme.primary,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
  };
  const ink = toneColor[tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${name} ทานยาตรงเวลา ${clamped} เปอร์เซ็นต์`}
      style={({ pressed }) => pressed && onPress && styles.pressed}>
      <Card gap={Spacing.three} style={styles.row}>
        <Avatar name={name} size={44} shape="rounded" tone={tone} />
        <View style={styles.body}>
          <View style={styles.head}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
              {name}
            </ThemedText>
            <ThemedText type="caption" style={{ color: ink, fontWeight: '700' }}>
              {clamped}%
            </ThemedText>
          </View>
          <View style={[styles.track, { backgroundColor: theme.surfaceSunken }]}>
            <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: ink }]} />
          </View>
          <ThemedText type="caption" themeColor="textMuted" numberOfLines={1}>
            {note}
          </ThemedText>
        </View>
        {onPress ? <CaretRightIcon weight="bold" size={16} color={theme.textMuted} /> : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1, minWidth: 0, gap: Spacing.one },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.two },
  name: { flex: 1 },
  track: { height: 7, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.full },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
