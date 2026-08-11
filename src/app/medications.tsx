import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext, type Medication } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { isToday } from '@/utils/date';

/** Lists one member's medications, or every member's grouped by name when no
 *  `memberId` is given — the caregiver overview entry point. */
export default function MedicationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ memberId?: string }>();
  const { medications, familyMembers, primaryElderId } = useFamilyContext();

  const memberId = params.memberId;
  const isOverview = !memberId;

  const grouped = useMemo(() => {
    const scoped = memberId ? medications.filter((med) => med.memberId === memberId) : medications;
    const byMember = new Map<string, Medication[]>();
    scoped.forEach((med) => {
      const list = byMember.get(med.memberId) ?? [];
      list.push(med);
      byMember.set(med.memberId, list);
    });
    return Array.from(byMember.entries()).map(([id, list]) => ({
      member: familyMembers.find((m) => m.id === id),
      medications: [...list].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)),
    }));
  }, [medications, memberId, familyMembers]);

  const targetMember = memberId ? familyMembers.find((m) => m.id === memberId) : undefined;

  return (
    <Screen
      gap={Spacing.three}
      footer={
        <AppButton
          label="เพิ่มรายการยา"
          icon="＋"
          onPress={() =>
            router.push({ pathname: '/medication-form', params: memberId ? { memberId } : { memberId: primaryElderId } })
          }
        />
      }>
      <ScreenHeader
        title="รายการยา"
        eyebrow={isOverview ? 'ภาพรวมทั้งบ้าน' : undefined}
        subtitle={targetMember ? `ของ ${targetMember.name}` : isOverview ? 'ยาของทุกคนในบ้าน' : undefined}
      />

      {grouped.length === 0 ? (
        <Card tone="sunken" elevation="flat" gap={Spacing.two}>
          <ThemedText type="smallBold">ยังไม่มีรายการยา</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            กด &quot;เพิ่มรายการยา&quot; ด้านล่างเพื่อเริ่มบันทึก
          </ThemedText>
        </Card>
      ) : (
        grouped.map(({ member, medications: memberMeds }) => (
          <View key={member?.id ?? 'unknown'} style={styles.group}>
            {isOverview ? (
              <ThemedText type="sectionTitle" style={styles.groupTitle}>
                {member?.name ?? 'ไม่ทราบสมาชิก'}
              </ThemedText>
            ) : null}

            {memberMeds.map((med) => {
              const takenToday = med.lastTakenAt ? isToday(med.lastTakenAt.slice(0, 10)) : false;
              return (
                <Pressable
                  key={med.id}
                  onPress={() => router.push({ pathname: '/medication-form', params: { id: med.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${med.name} ${med.dosage}`}
                  accessibilityHint="แตะเพื่อแก้ไขรายการยา"
                  style={({ pressed }) => pressed && styles.pressed}>
                  <Card gap={Spacing.two} style={!med.active && styles.inactive}>
                    <View style={styles.row}>
                      <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
                        <ThemedText style={styles.iconGlyph}>💊</ThemedText>
                      </View>
                      <View style={styles.body}>
                        <ThemedText type="smallBold">{med.name}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {med.dosage}
                          {med.reason ? ` · ${med.reason}` : ''}
                        </ThemedText>
                      </View>
                      {!med.active ? <StatusBadge label="หยุดใช้" tone="neutral" dot={false} /> : null}
                    </View>

                    <View style={styles.scheduleRow}>
                      {med.schedule.map((time) => (
                        <View key={time} style={[styles.timeChip, { backgroundColor: theme.surfaceSunken }]}>
                          <ThemedText type="caption" themeColor="textSecondary">
                            {time}
                          </ThemedText>
                        </View>
                      ))}
                    </View>

                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                      <StatusBadge
                        label={takenToday ? 'ทานแล้ววันนี้' : 'ยังไม่ทานวันนี้'}
                        tone={takenToday ? 'success' : 'warning'}
                      />
                      {med.active ? (
                        <Pressable
                          onPress={() => router.push({ pathname: '/medication-confirm', params: { id: med.id } })}
                          accessibilityRole="button"
                          accessibilityLabel={`ยืนยันการทานยา ${med.name}`}
                          hitSlop={Spacing.two}
                          style={({ pressed }) => pressed && styles.pressed}>
                          <ThemedText type="linkPrimary">ยืนยันทานยา ›</ThemedText>
                        </Pressable>
                      ) : null}
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  groupTitle: { marginTop: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: { width: 44, height: 44, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  iconGlyph: { fontSize: 20, lineHeight: 26 },
  body: { flex: 1, gap: Spacing.half },
  scheduleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  timeChip: { borderRadius: Radius.full, paddingHorizontal: Spacing.two, paddingVertical: Spacing.half },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  inactive: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
});
