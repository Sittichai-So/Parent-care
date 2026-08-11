import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey, toDateKey } from '@/utils/date';

type VitalsSummaryProps = {
  memberId: string;
  /** Caregiver views show whose numbers these are; elder's own screen omits it. */
  showAddButton?: boolean;
};

/** Compact "last 3 readings" card, reused on the elder home and family-member detail. */
export function VitalsSummary({ memberId, showAddButton = true }: VitalsSummaryProps) {
  const theme = useTheme();
  const router = useRouter();
  const { vitalLogs } = useFamilyContext();

  const recent = useMemo(
    () =>
      vitalLogs
        .filter((log) => log.memberId === memberId)
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
        .slice(0, 3),
    [vitalLogs, memberId]
  );

  return (
    <Card gap={Spacing.two}>
      <View style={styles.head}>
        <ThemedText type="smallBold">สุขภาพล่าสุด</ThemedText>
        {showAddButton ? (
          <Pressable
            onPress={() => router.push({ pathname: '/vitals-form', params: { memberId } })}
            accessibilityRole="button"
            accessibilityLabel="บันทึกสุขภาพใหม่"
            hitSlop={Spacing.two}
            style={({ pressed }) => [styles.addButton, { backgroundColor: theme.primarySoft }, pressed && styles.pressed]}>
            <ThemedText type="caption" style={{ color: theme.primaryText }}>
              + บันทึกใหม่
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {recent.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          ยังไม่มีการบันทึกสุขภาพ
        </ThemedText>
      ) : (
        recent.map((log) => (
          <View key={log.id} style={[styles.row, { borderColor: theme.border }]}>
            <ThemedText type="caption" themeColor="textMuted" style={styles.date}>
              {formatDateKey(toDateKey(new Date(log.recordedAt)))}
            </ThemedText>
            <View style={styles.readings}>
              {log.systolic && log.diastolic ? (
                <ThemedText type="small">🩺 {log.systolic}/{log.diastolic}</ThemedText>
              ) : null}
              {log.sugar ? <ThemedText type="small">🍬 {log.sugar} mg/dL</ThemedText> : null}
              {log.weight ? <ThemedText type="small">⚖️ {log.weight} กก.</ThemedText> : null}
              {log.note ? (
                <ThemedText type="caption" themeColor="textMuted" numberOfLines={1}>
                  {log.note}
                </ThemedText>
              ) : null}
            </View>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addButton: { borderRadius: Radius.full, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one + 1 },
  row: { flexDirection: 'row', gap: Spacing.three, paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  date: { width: 64 },
  readings: { flex: 1, gap: Spacing.half, flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.three },
  pressed: { opacity: 0.7 },
});
