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
import { useFamilyContext, type Appointment } from '@/context/family-context';
import { daysFromToday, formatDateKey, relativeDayLabel } from '@/utils/date';

type AppointmentRowProps = {
  appointment: Appointment;
  memberName?: string;
  variant: 'upcoming' | 'past';
  onPress: () => void;
};

function AppointmentRow({ appointment, memberName, variant, onPress }: AppointmentRowProps) {
  const isPast = variant === 'past';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${appointment.title} ${formatDateKey(appointment.date)}`}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card elevation={isPast ? 'flat' : undefined} tone={isPast ? 'sunken' : undefined} style={styles.row} gap={Spacing.three}>
        <AppointmentDateBlock date={appointment.date} tone={isPast ? 'muted' : undefined} />
        <View style={styles.body}>
          <ThemedText type="smallBold" numberOfLines={1} themeColor={isPast ? 'textSecondary' : undefined}>
            {appointment.title}
          </ThemedText>
          <ThemedText type="small" themeColor={isPast ? 'textMuted' : 'textSecondary'} numberOfLines={1}>
            {appointment.time} น. · {appointment.hospital}
          </ThemedText>
          {!isPast && memberName ? (
            <ThemedText type="caption" themeColor="textMuted">
              {memberName}
            </ThemedText>
          ) : null}
        </View>
        {!isPast ? (
          <StatusBadge
            label={relativeDayLabel(appointment.date)}
            tone={daysFromToday(appointment.date) === 0 ? 'danger' : 'primary'}
            dot={false}
          />
        ) : null}
      </Card>
    </Pressable>
  );
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ memberId?: string }>();
  const { appointments, familyMembers, resolveDefaultMemberId, canManageFor } = useFamilyContext();

  const memberId = params.memberId;
  const member = memberId ? familyMembers.find((m) => m.id === memberId) : undefined;
  // Where a new appointment from the "+" button would go: the scoped member
  // if there is one, else self for Elder or the family's Elder otherwise.
  const addTargetMemberId = resolveDefaultMemberId(memberId);

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
      // Owner/Caregiver can add for anyone; Elder only for themself.
      footer={
        canManageFor(addTargetMemberId) ? (
          <AppButton
            label="เพิ่มนัดหมาย"
            icon="add-outline"
            onPress={() => router.push({ pathname: '/appointment-form', params: { memberId: addTargetMemberId } })}
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
                <AppointmentRow
                  key={apt.id}
                  appointment={apt}
                  memberName={!memberId ? memberName(apt.memberId) : undefined}
                  variant="upcoming"
                  onPress={() => router.push({ pathname: '/appointment-detail', params: { id: apt.id } })}
                />
              ))}
            </View>
          )}

          {past.length > 0 ? (
            <>
              <SectionHeader title="ผ่านมาแล้ว" count={past.length} />
              <View style={styles.list}>
                {past.map((apt) => (
                  <AppointmentRow
                    key={apt.id}
                    appointment={apt}
                    variant="past"
                    onPress={() => router.push({ pathname: '/appointment-detail', params: { id: apt.id } })}
                  />
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
