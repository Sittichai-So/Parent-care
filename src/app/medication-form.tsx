import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { CheckRow } from '@/components/ui/check-row';
import { ChipSelect } from '@/components/ui/chip-select';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { MEDICATION_TIME_OPTIONS } from '@/constants/schedule';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { canScheduleLocalNotifications } from '@/services/notifications';

/** Add or edit a medication. Editing is detected by an `id` param; creating a
 *  new one targets `memberId` (an explicit param, or the caller's own record
 *  for Elder, or the family's Elder for Owner/Caregiver — changeable via the
 *  "สำหรับใคร" picker below when the caller can manage more than one member). */
export default function MedicationFormScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string; memberId?: string }>();
  const {
    medications,
    familyMembers,
    primaryElderId,
    currentRole,
    currentMembershipId,
    canManage,
    canManageFor,
    addMedication,
    updateMedication,
    removeMedication,
  } = useFamilyContext();

  const editing = useMemo(() => medications.find((med) => med.id === params.id), [medications, params.id]);

  // Elder has nothing to pick (always self); for Owner/Caregiver this is
  // just the starting suggestion — the picker below can change it.
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    () => params.memberId ?? (currentRole === 'Elder' ? (currentMembershipId ?? primaryElderId) : primaryElderId)
  );
  const memberId = editing?.memberId ?? selectedMemberId;
  const member = familyMembers.find((m) => m.id === memberId);
  const showMemberPicker = !editing && canManage && familyMembers.length > 1;

  const [name, setName] = useState(editing?.name ?? '');
  const [dosage, setDosage] = useState(editing?.dosage ?? '');
  const [reason, setReason] = useState(editing?.reason ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [schedule, setSchedule] = useState<string[]>(editing?.schedule ?? []);
  const [active, setActive] = useState(editing?.active ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const toggleTime = (value: string) =>
    setSchedule((current) => (current.includes(value) ? current.filter((t) => t !== value) : [...current, value].sort()));

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อยาและขนาดยา');
      return;
    }
    if (schedule.length === 0) {
      Alert.alert('ยังไม่ได้เลือกเวลา', 'กรุณาเลือกเวลาทานยาอย่างน้อย 1 ช่วง');
      return;
    }

    const payload = {
      memberId,
      name: name.trim(),
      dosage: dosage.trim(),
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
      schedule,
      active,
    };

    setIsSaving(true);
    try {
      if (editing) {
        await updateMedication(editing.id, payload);
      } else {
        await addMedication(payload);
      }
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      Alert.alert('บันทึกรายการยาไม่สำเร็จ', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert('ลบรายการยา', `ต้องการลบ ${editing.name} ใช่หรือไม่?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: () => {
          removeMedication(editing.id)
            .then(() => router.back())
            .catch((err) => {
              const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
              Alert.alert('ลบรายการยาไม่สำเร็จ', message);
            });
        },
      },
    ]);
  };

  // Mirrors the backend's per-member write permission — gated here (not
  // just the "+" button in medications.tsx) so a deep link can't reach a
  // form that's guaranteed to fail on save.
  if (!canManageFor(memberId)) {
    return (
      <Screen center gap={Spacing.three}>
        <ScreenHeader title={editing ? 'แก้ไขรายการยา' : 'เพิ่มรายการยา'} />
        <Card tone="sunken" elevation="flat" gap={Spacing.two}>
          <ThemedText type="smallBold">ไม่มีสิทธิ์จัดการรายการยานี้</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            เพิ่ม/แก้ไขรายการยาของตัวเองได้ หรือให้เจ้าของบ้าน/ผู้ดูแล (Caregiver) จัดการแทนสำหรับสมาชิกคนอื่น
          </ThemedText>
        </Card>
        <AppButton label="กลับ" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      keyboardAvoiding
      gap={Spacing.three}
      footer={
        <>
          <AppButton
            label={editing ? 'บันทึกการแก้ไข' : 'บันทึกรายการยา'}
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
          />
          {editing && canManage ? (
            <AppButton label="ลบรายการยา" variant="danger" size="medium" onPress={handleDelete} disabled={isSaving} />
          ) : null}
        </>
      }>
      <ScreenHeader
        title={editing ? 'แก้ไขรายการยา' : 'เพิ่มรายการยา'}
        eyebrow={!showMemberPicker && member ? `สำหรับ ${member.name}` : undefined}
      />

      {showMemberPicker ? (
        <Card gap={Spacing.two}>
          <ThemedText type="smallBold">สำหรับใคร *</ThemedText>
          <ChipSelect
            options={familyMembers.map((m) => ({ value: m.id, label: m.name }))}
            selected={[selectedMemberId]}
            onToggle={setSelectedMemberId}
          />
        </Card>
      ) : null}

      <Card gap={Spacing.three}>
        <TextField label="ชื่อยา" value={name} onChangeText={setName} placeholder="เช่น Amlodipine" required />
        <TextField label="ขนาดยา" value={dosage} onChangeText={setDosage} placeholder="เช่น 5 mg · 1 เม็ด" required />
        <TextField label="ใช้เพื่อ (ไม่บังคับ)" value={reason} onChangeText={setReason} placeholder="เช่น ควบคุมความดันโลหิต" />
      </Card>

      <Card gap={Spacing.two}>
        <ThemedText type="smallBold">เวลาทานยา *</ThemedText>
        <ChipSelect options={MEDICATION_TIME_OPTIONS} selected={schedule} onToggle={toggleTime} size="large" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.one }}>
          {canScheduleLocalNotifications ? (
            <Ionicons name="notifications-outline" size={14} color={theme.textMuted} />
          ) : null}
          <ThemedText type="caption" themeColor="textMuted">
            {canScheduleLocalNotifications
              ? 'ระบบจะแจ้งเตือนอัตโนมัติทุกวันตามเวลาที่เลือก'
              : 'การแจ้งเตือนใช้ได้เฉพาะแอปมือถือ (iOS/Android)'}
          </ThemedText>
        </View>
      </Card>

      <Card gap={Spacing.three}>
        <TextField
          label="หมายเหตุ (ไม่บังคับ)"
          value={notes}
          onChangeText={setNotes}
          placeholder="เช่น ทานหลังอาหารเช้า"
          multiline
        />
        <CheckRow
          label="ยาที่ใช้อยู่ในปัจจุบัน"
          description="ปิดไว้หากหยุดยานี้แล้ว แต่ต้องการเก็บประวัติไว้"
          checked={active}
          onToggle={() => setActive((current) => !current)}
        />
      </Card>
    </Screen>
  );
}
