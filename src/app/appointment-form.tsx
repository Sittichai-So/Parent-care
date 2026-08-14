import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { CheckRow } from '@/components/ui/check-row';
import { ChipSelect } from '@/components/ui/chip-select';
import { DateStrip } from '@/components/ui/date-strip';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { APPOINTMENT_TIME_OPTIONS } from '@/constants/schedule';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { canScheduleLocalNotifications } from '@/services/notifications';
import { todayKey } from '@/utils/date';

export default function AppointmentFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; memberId?: string }>();
  const {
    appointments,
    medications,
    familyMembers,
    primaryElderId,
    addAppointment,
    updateAppointment,
    removeAppointment,
  } = useFamilyContext();

  const editing = useMemo(() => appointments.find((apt) => apt.id === params.id), [appointments, params.id]);
  const memberId = editing?.memberId ?? params.memberId ?? primaryElderId;
  const member = familyMembers.find((m) => m.id === memberId);
  const memberMedications = useMemo(
    () => medications.filter((med) => med.memberId === memberId),
    [medications, memberId]
  );

  const [title, setTitle] = useState(editing?.title ?? '');
  const [date, setDate] = useState<string | null>(editing?.date ?? todayKey());
  const [time, setTime] = useState<string[]>(editing ? [editing.time] : []);
  const [hospital, setHospital] = useState(editing?.hospital ?? '');
  const [doctor, setDoctor] = useState(editing?.doctor ?? '');
  const [department, setDepartment] = useState(editing?.department ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [medicationNote, setMedicationNote] = useState(editing?.medicationNote ?? '');
  const [linkedMedicationIds, setLinkedMedicationIds] = useState<string[]>(editing?.linkedMedicationIds ?? []);
  const [reminderEnabled, setReminderEnabled] = useState(editing?.reminderEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const toggleMedication = (id: string) =>
    setLinkedMedicationIds((current) => (current.includes(id) ? current.filter((m) => m !== id) : [...current, id]));

  const handleSave = async () => {
    if (!title.trim() || !hospital.trim() || !date || time.length === 0) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อนัดหมาย สถานที่ วันที่ และเวลาให้ครบถ้วน');
      return;
    }

    const payload = {
      memberId,
      title: title.trim(),
      date,
      time: time[0],
      hospital: hospital.trim(),
      doctor: doctor.trim() || undefined,
      department: department.trim() || undefined,
      notes: notes.trim() || undefined,
      medicationNote: medicationNote.trim() || undefined,
      linkedMedicationIds,
      reminderEnabled,
    };

    setIsSaving(true);
    try {
      if (editing) {
        await updateAppointment(editing.id, payload);
        router.back();
      } else {
        const id = await addAppointment(payload);
        router.replace({ pathname: '/appointment-detail', params: { id } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      Alert.alert('บันทึกนัดหมายไม่สำเร็จ', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert('ลบนัดหมาย', `ต้องการลบ "${editing.title}" ใช่หรือไม่?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: () => {
          removeAppointment(editing.id)
            .then(() => router.back())
            .catch((err) => {
              const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
              Alert.alert('ลบนัดหมายไม่สำเร็จ', message);
            });
        },
      },
    ]);
  };

  return (
    <Screen
      keyboardAvoiding
      gap={Spacing.three}
      footer={
        <>
          <AppButton
            label={editing ? 'บันทึกการแก้ไข' : 'บันทึกนัดหมาย'}
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
          />
          {editing ? (
            <AppButton label="ลบนัดหมาย" variant="danger" size="medium" onPress={handleDelete} disabled={isSaving} />
          ) : null}
        </>
      }>
      <ScreenHeader
        title={editing ? 'แก้ไขนัดหมาย' : 'เพิ่มนัดหมาย'}
        eyebrow={member ? `สำหรับ ${member.name}` : undefined}
      />

      <Card gap={Spacing.three}>
        <TextField label="ชื่อนัดหมาย" value={title} onChangeText={setTitle} placeholder="เช่น ตรวจสุขภาพประจำปี" required />
        <TextField label="สถานที่" value={hospital} onChangeText={setHospital} placeholder="เช่น โรงพยาบาลกรุงเทพ" required />
        <View style={styles.twoCol}>
          <View style={styles.half}>
            <TextField label="แพทย์ (ไม่บังคับ)" value={doctor} onChangeText={setDoctor} placeholder="นพ. ..." />
          </View>
          <View style={styles.half}>
            <TextField label="แผนก (ไม่บังคับ)" value={department} onChangeText={setDepartment} placeholder="อายุรกรรม" />
          </View>
        </View>
      </Card>

      <Card gap={Spacing.two}>
        <ThemedText type="smallBold">วันที่ *</ThemedText>
        <DateStrip value={date} onChange={setDate} />
      </Card>

      <Card gap={Spacing.two}>
        <ThemedText type="smallBold">เวลา *</ThemedText>
        <ChipSelect options={APPOINTMENT_TIME_OPTIONS} selected={time} onToggle={(value) => setTime([value])} size="large" />
      </Card>

      {memberMedications.length > 0 ? (
        <Card gap={Spacing.two}>
          <ThemedText type="smallBold">ยาที่เกี่ยวข้อง (ไม่บังคับ)</ThemedText>
          <ChipSelect
            options={memberMedications.map((med) => ({ value: med.id, label: med.name }))}
            selected={linkedMedicationIds}
            onToggle={toggleMedication}
          />
        </Card>
      ) : null}

      <Card gap={Spacing.three}>
        <TextField
          label="คำแนะนำเรื่องยาสำหรับนัดนี้ (ไม่บังคับ)"
          value={medicationNote}
          onChangeText={setMedicationNote}
          placeholder="เช่น แพทย์อาจปรับยาใหม่หลังนัดนี้"
          multiline
        />
        <TextField label="หมายเหตุอื่น ๆ (ไม่บังคับ)" value={notes} onChangeText={setNotes} placeholder="เช่น งดอาหารก่อนตรวจ" multiline />
        <CheckRow
          label="เตือนก่อนถึงนัดหมาย"
          description={
            canScheduleLocalNotifications
              ? 'แจ้งเตือนอัตโนมัติ 1 วันก่อน และอีก 1 ชั่วโมงก่อนถึงเวลานัด'
              : 'การแจ้งเตือนใช้ได้เฉพาะแอปมือถือ (iOS/Android)'
          }
          checked={reminderEnabled}
          onToggle={() => setReminderEnabled((current) => !current)}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  twoCol: { flexDirection: 'row', gap: Spacing.three },
  half: { flex: 1 },
});
