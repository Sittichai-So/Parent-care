import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { AppointmentDateBlock } from '@/components/ui/appointment-date-block';
import { Card } from '@/components/ui/card';
import { CheckRow } from '@/components/ui/check-row';
import { InfoRow } from '@/components/ui/info-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, formatDateKey, relativeDayLabel } from '@/utils/date';

const preparationChecklist = [
  { id: 'card', label: 'บัตรประชาชน และบัตรโรงพยาบาล' },
  { id: 'meds', label: 'ยาที่ทานอยู่ทั้งหมด' },
  { id: 'fasting', label: 'งดอาหาร 8 ชั่วโมงก่อนตรวจ (ถ้าแพทย์แจ้ง)' },
  { id: 'ride', label: 'นัดคนขับรถ / เตรียมการเดินทาง' },
];

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const { appointments, medications, familyMembers, canManageFor, updateAppointment, isLoadingData } =
    useFamilyContext();
  const [checked, setChecked] = useState<string[]>(['card']);
  const [isTogglingReminder, setIsTogglingReminder] = useState(false);

  const appointment = appointments.find((apt) => apt.id === params.id);
  const member = appointment ? familyMembers.find((m) => m.id === appointment.memberId) : undefined;
  const linkedMedications = useMemo(
    () => (appointment ? medications.filter((med) => appointment.linkedMedicationIds.includes(med.id)) : []),
    [medications, appointment]
  );
  const otherUpcoming = useMemo(
    () =>
      appointment
        ? appointments
            .filter((apt) => apt.id !== appointment.id && daysFromToday(apt.date) >= 0)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 2)
        : [],
    [appointments, appointment]
  );

  const toggleCheck = (id: string) =>
    setChecked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  if (!appointment) {
    if (params.id && isLoadingData) {
      return (
        <Screen center gap={Spacing.three}>
          <ThemedText type="small" themeColor="textSecondary">
            กำลังโหลดนัดหมาย…
          </ThemedText>
        </Screen>
      );
    }
    return (
      <Screen center gap={Spacing.three}>
        <ScreenHeader title="ไม่พบนัดหมาย" />
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            นัดหมายนี้อาจถูกลบไปแล้ว กรุณากลับไปที่รายการนัดหมาย
          </ThemedText>
        </Card>
        <AppButton label="ดูนัดหมายทั้งหมด" onPress={() => router.replace('/appointments')} />
      </Screen>
    );
  }

  return (
    <Screen
      gap={Spacing.three}
      footer={
        canManageFor(appointment.memberId) ? (
          <>
            <AppButton
              label={appointment.reminderEnabled ? 'ปิดการเตือน' : 'เปิดการเตือน'}
              icon={appointment.reminderEnabled ? 'notifications-off-outline' : 'notifications-outline'}
              variant={appointment.reminderEnabled ? 'secondary' : 'primary'}
              loading={isTogglingReminder}
              disabled={isTogglingReminder}
              onPress={() => {
                setIsTogglingReminder(true);
                updateAppointment(appointment.id, { reminderEnabled: !appointment.reminderEnabled })
                  .catch((err) => {
                    const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
                    Alert.alert('อัปเดตการเตือนไม่สำเร็จ', message);
                  })
                  .finally(() => setIsTogglingReminder(false));
              }}
            />
            <AppButton
              label="แก้ไขนัดหมาย"
              variant="ghost"
              size="medium"
              onPress={() => router.push({ pathname: '/appointment-form', params: { id: appointment.id } })}
            />
          </>
        ) : undefined
      }>
      <ScreenHeader title="รายละเอียดนัดหมาย" eyebrow={member?.name} />

      <Card elevation="raised" padding={Spacing.four} gap={Spacing.three}>
        <View style={styles.hero}>
          <AppointmentDateBlock date={appointment.date} size="large" />

          <View style={styles.heroText}>
            <StatusBadge label={relativeDayLabel(appointment.date)} tone="primary" />
            <ThemedText type="heading">{appointment.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {appointment.time} น.
            </ThemedText>
          </View>
        </View>

        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <InfoRow icon="business-outline" label="สถานที่" value={appointment.hospital} />
        {appointment.doctor ? <InfoRow icon="person-outline" label="แพทย์" value={appointment.doctor} /> : null}
        {appointment.department ? <InfoRow icon="folder-outline" label="แผนก" value={appointment.department} /> : null}
      </Card>

      {appointment.medicationNote || linkedMedications.length > 0 ? (
        <Card tone="primary" elevation="flat" gap={Spacing.two}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.one }}>
            <Ionicons name="medical-outline" size={16} color={theme.primaryText} />
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
              เรื่องยาสำหรับนัดนี้
            </ThemedText>
          </View>
          {appointment.medicationNote ? (
            <ThemedText type="small" style={{ color: theme.primaryText }}>
              {appointment.medicationNote}
            </ThemedText>
          ) : null}
          {linkedMedications.map((med) => (
            <ThemedText key={med.id} type="small" style={{ color: theme.primaryText }}>
              • {med.name} — {med.dosage}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      {appointment.notes ? (
        <Card tone="sunken" elevation="flat" gap={Spacing.one}>
          <ThemedText type="smallBold">หมายเหตุ</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {appointment.notes}
          </ThemedText>
        </Card>
      ) : null}

      <SectionHeader title="สิ่งที่ต้องเตรียม" count={preparationChecklist.length} />
      <Card gap={Spacing.one} padding={Spacing.three}>
        {preparationChecklist.map((item) => (
          <CheckRow
            key={item.id}
            label={item.label}
            checked={checked.includes(item.id)}
            onToggle={() => toggleCheck(item.id)}
          />
        ))}
      </Card>

      {otherUpcoming.length > 0 ? (
        <>
          <SectionHeader title="นัดหมายอื่นที่จะถึง" />
          <View style={styles.otherList}>
            {otherUpcoming.map((apt) => (
              <Pressable
                key={apt.id}
                onPress={() => router.push({ pathname: '/appointment-detail', params: { id: apt.id } })}
                accessibilityRole="button"
                style={({ pressed }) => pressed && styles.pressed}>
                <Card elevation="flat" tone="sunken" gap={Spacing.half}>
                  <ThemedText type="smallBold">{apt.title}</ThemedText>
                  <ThemedText type="caption" themeColor="textMuted">
                    {formatDateKey(apt.date)} · {apt.time} น.
                  </ThemedText>
                </Card>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  heroText: { flex: 1, gap: Spacing.one + 2 },
  separator: { height: 1 },

  otherList: { gap: Spacing.two },
  pressed: { opacity: 0.7 },
});
