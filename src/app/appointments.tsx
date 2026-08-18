import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { AppointmentDateBlock } from '@/components/ui/appointment-date-block';
import { Card } from '@/components/ui/card';
import { NotificationBanner } from '@/components/ui/notification-banner';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { daysFromToday, formatDateKey, relativeDayLabel } from '@/utils/date';

export default function AppointmentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ memberId?: string }>();
  const { appointments, familyMembers, primaryElderId, canManage } = useFamilyContext();

  const memberId = params.memberId;
  const member = memberId ? familyMembers.find((m) => m.id === memberId) : undefined;

  const scoped = useMemo(
    () => (memberId ? appointments.filter((apt) => apt.memberId === memberId) : appointments),
    [appointments, memberId]
  );

  const upcoming = useMemo(
    () => scoped.filter((apt) => daysFromToday(apt.date) >= 0).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [scoped]
  );
  const past = useMemo(
    () => scoped.filter((apt) => daysFromToday(apt.date) < 0).sort((a, b) => b.date.localeCompare(a.date)),
    [scoped]
  );

  const memberName = (id: string) => familyMembers.find((m) => m.id === id)?.name ?? '';

  return (
    <Screen
      gap={Spacing.three}
      // Only Owner/Caregiver may add an appointment (appointment.routes.js#requireHouseholdRole).
      footer={
        canManage ? (
          <AppButton
            label="เพิ่มนัดหมาย"
            icon="add-outline"
            onPress={() =>
              router.push({ pathname: '/appointment-form', params: memberId ? { memberId } : { memberId: primaryElderId } })
            }
          />
        ) : undefined
      }>
      <ScreenHeader title="นัดหมาย" subtitle={member ? `ของ ${member.name}` : 'นัดหมายทั้งหมดของครอบครัว'} />

      <NotificationBanner />

      {scoped.length === 0 ? (
        <Card tone="sunken" elevation="flat" gap={Spacing.two}>
          <ThemedText type="smallBold">ยังไม่มีนัดหมาย</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            กด &quot;เพิ่มนัดหมาย&quot; ด้านล่างเพื่อสร้างนัดหมายใหม่
          </ThemedText>
        </Card>
      ) : (
        <>
          <SectionHeader title="กำลังจะถึง" count={upcoming.length} />
          {upcoming.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              ไม่มีนัดหมายที่จะถึง
            </ThemedText>
          ) : (
            <View style={styles.list}>
              {upcoming.map((apt) => (
                <Pressable
                  key={apt.id}
                  onPress={() => router.push({ pathname: '/appointment-detail', params: { id: apt.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${apt.title} ${formatDateKey(apt.date)}`}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <Card style={styles.row} gap={Spacing.three}>
                    <AppointmentDateBlock date={apt.date} />
                    <View style={styles.body}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {apt.title}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {apt.time} น. · {apt.hospital}
                      </ThemedText>
                      {!memberId ? (
                        <ThemedText type="caption" themeColor="textMuted">
                          {memberName(apt.memberId)}
                        </ThemedText>
                      ) : null}
                    </View>
                    <StatusBadge label={relativeDayLabel(apt.date)} tone={daysFromToday(apt.date) === 0 ? 'danger' : 'primary'} dot={false} />
                  </Card>
                </Pressable>
              ))}
            </View>
          )}

          {past.length > 0 ? (
            <>
              <SectionHeader title="ผ่านมาแล้ว" count={past.length} />
              <View style={styles.list}>
                {past.map((apt) => (
                  <Pressable
                    key={apt.id}
                    onPress={() => router.push({ pathname: '/appointment-detail', params: { id: apt.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${apt.title} ${formatDateKey(apt.date)}`}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <Card elevation="flat" tone="sunken" style={styles.row} gap={Spacing.three}>
                      <AppointmentDateBlock date={apt.date} tone="muted" />
                      <View style={styles.body}>
                        <ThemedText type="smallBold" numberOfLines={1} themeColor="textSecondary">
                          {apt.title}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>
                          {apt.time} น. · {apt.hospital}
                        </ThemedText>
                      </View>
                    </Card>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1, gap: 1 },
  pressed: { opacity: 0.85 },
});
