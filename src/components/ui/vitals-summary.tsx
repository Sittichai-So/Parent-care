import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey, toDateKey } from '@/utils/date';

/** Small inline icon + text pair, sized to sit on one line with the reading's value. */
function Reading({ icon, children }: { icon: 'pulse-outline' | 'water-outline' | 'scale-outline'; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.reading}>
      <Ionicons name={icon} size={14} color={theme.textSecondary} />
      <ThemedText type="small">{children}</ThemedText>
    </View>
  );
}

type VitalsSummaryProps = {
  memberId: string;
  /** Caregiver views show whose numbers these are; elder's own screen omits it. */
  showAddButton?: boolean;
};

/** Compact "last 3 readings" card, reused on the elder home and family-member detail. */
export function VitalsSummary({ memberId, showAddButton = true }: VitalsSummaryProps) {
  const theme = useTheme();
  const router = useRouter();
  const { vitalLogs, canManageFor } = useFamilyContext();
  // Owner/Caregiver may log for anyone, Elder only themself, Viewer never —
  // same permission vitals-form.tsx itself enforces, checked here too so the
  // button isn't offered somewhere it's guaranteed to be rejected.
  const canAdd = showAddButton && canManageFor(memberId);

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
        {canAdd ? (
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
                <Reading icon="pulse-outline">
                  {log.systolic}/{log.diastolic}
                </Reading>
              ) : null}
              {log.sugar ? <Reading icon="water-outline">{log.sugar} mg/dL</Reading> : null}
              {log.weight ? <Reading icon="scale-outline">{log.weight} กก.</Reading> : null}
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
  reading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  pressed: { opacity: 0.7 },
});
