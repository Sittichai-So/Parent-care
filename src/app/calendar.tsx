import { useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { AppointmentSpotlightCard } from '@/components/ui/appointment-spotlight-card';
import { Card } from '@/components/ui/card';
import { CheckRow } from '@/components/ui/check-row';
import { DateStrip } from '@/components/ui/date-strip';
import { ReadOnlyBanner } from '@/components/ui/read-only-banner';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { todayKey } from '@/utils/date';

/** Local-only prep checklist, per the reference design — the same
 *  "optimistic local toggle" nature as the mock's own checklist rows (README:
 *  "Task rows and checklist rows are toggles (optimistic local state)"), not
 *  backed by a per-appointment checklist field that doesn't exist yet. */
const initialChecklist = [
  { id: 'c1', text: 'บัตรประชาชน · สิทธิ์การรักษา', done: true },
  { id: 'c2', text: 'รายการยาที่ใช้อยู่', done: false },
  { id: 'c3', text: 'งดน้ำงดอาหารหลัง 22:00', done: false },
];

/** "ปฏิทินครอบครัว" — browse appointments by day, per the reference design's
 *  screen 07. New route: nothing in the repo covered this "date-strip +
 *  day's appointment + prep checklist" browse pattern before. */
export default function CalendarScreen() {
  const router = useRouter();
  const { appointments, familyMembers, canEdit, updateAppointment } = useFamilyContext();

  const eventDates = useMemo(() => new Set(appointments.map((apt) => apt.date)), [appointments]);

  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const today = todayKey();
    if (eventDates.has(today)) return today;
    const nextUpcoming = [...appointments].filter((apt) => apt.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
    return nextUpcoming?.date ?? today;
  });

  const dayAppointments = useMemo(
    () => appointments.filter((apt) => apt.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, selectedDate]
  );
  const appointment = dayAppointments[0];
  const memberName = familyMembers.find((member) => member.id === appointment?.memberId)?.name ?? '';

  const [checklist, setChecklist] = useState(initialChecklist);
  const toggleChecklistItem = (id: string) => {
    if (!canEdit) return;
    setChecklist((current) => current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const handleSaveReminder = () => {
    if (!appointment) return;
    setIsSavingReminder(true);
    updateAppointment(appointment.id, { reminderEnabled: true })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        Alert.alert('บันทึกเตือนไม่สำเร็จ', message);
      })
      .finally(() => setIsSavingReminder(false));
  };

  return (
    <Screen gap={Spacing.three}>
      <ScreenHeader title="ปฏิทินครอบครัว" />

      <ReadOnlyBanner />

      <DateStrip value={selectedDate} onChange={setSelectedDate} hasEventOn={(key) => eventDates.has(key)} />

      {appointment ? (
        <AppointmentSpotlightCard
          appointment={appointment}
          memberName={memberName}
          onPress={() => router.push({ pathname: '/appointment-detail', params: { id: appointment.id } })}
        />
      ) : (
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            ไม่มีนัดหมายในวันนี้
          </ThemedText>
        </Card>
      )}

      {appointment ? (
        <>
          <SectionHeader title="Checklist ก่อนไป" />
          <Card gap={Spacing.one} padding={Spacing.three}>
            {checklist.map((item) => (
              <CheckRow key={item.id} label={item.text} checked={item.done} onToggle={() => toggleChecklistItem(item.id)} />
            ))}
          </Card>

          <AppButton
            label={appointment.reminderEnabled ? 'บันทึกเตือนแล้ว ✓' : 'บันทึกเตือนก่อนวันนัด'}
            variant={appointment.reminderEnabled ? 'success' : 'primary'}
            disabled={!canEdit || appointment.reminderEnabled || isSavingReminder}
            loading={isSavingReminder}
            onPress={handleSaveReminder}
            style={styles.reminderButton}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  reminderButton: { marginTop: Spacing.one },
});
