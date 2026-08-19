import { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';

const toNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function VitalsFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ memberId?: string }>();
  const { familyMembers, primaryElderId, currentRole, currentMembershipId, canManageFor, addVitalLog } =
    useFamilyContext();

  // Every call site passes memberId explicitly today, but falls back the
  // same way medication-form.tsx/appointment-form.tsx do (self for Elder,
  // else the household's primary elder) rather than always primaryElderId,
  // in case a future entry point ever opens this with none.
  const memberId = params.memberId ?? (currentRole === 'Elder' ? (currentMembershipId ?? primaryElderId) : primaryElderId);
  const member = familyMembers.find((m) => m.id === memberId);

  // Mirrors the backend's per-member write permission — gated here (not
  // just the "+ บันทึกใหม่" button that links here) so a deep link can't
  // reach a form that's guaranteed to fail on save. See medication-form.tsx.
  const canManageThis = canManageFor(memberId);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [sugar, setSugar] = useState('');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const systolicValue = toNumber(systolic);
    const diastolicValue = toNumber(diastolic);
    const sugarValue = toNumber(sugar);
    const weightValue = toNumber(weight);

    if ((systolicValue && !diastolicValue) || (!systolicValue && diastolicValue)) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกความดันทั้งค่าบนและค่าล่าง');
      return;
    }
    if (!systolicValue && !sugarValue && !weightValue) {
      Alert.alert('ยังไม่ได้กรอกข้อมูล', 'กรุณากรอกอย่างน้อยหนึ่งค่า เช่น ความดัน น้ำตาล หรือน้ำหนัก');
      return;
    }

    setIsSaving(true);
    try {
      await addVitalLog({
        memberId,
        recordedAt: new Date().toISOString(),
        systolic: systolicValue,
        diastolic: diastolicValue,
        sugar: sugarValue,
        weight: weightValue,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      Alert.alert('บันทึกข้อมูลสุขภาพไม่สำเร็จ', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManageThis) {
    return (
      <Screen center gap={Spacing.three}>
        <ScreenHeader title="บันทึกสุขภาพ" />
        <Card tone="sunken" elevation="flat" gap={Spacing.two}>
          <ThemedText type="smallBold">ไม่มีสิทธิ์บันทึกข้อมูลสุขภาพนี้</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            บันทึกข้อมูลสุขภาพของตัวเองได้ หรือให้เจ้าของบ้าน/ผู้ดูแล (Caregiver) บันทึกแทนสำหรับสมาชิกคนอื่น
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
        <AppButton label="บันทึกข้อมูลสุขภาพ" icon="checkmark-outline" onPress={handleSave} loading={isSaving} disabled={isSaving} />
      }>
      <ScreenHeader title="บันทึกสุขภาพ" eyebrow={member ? `สำหรับ ${member.name}` : undefined} subtitle="กรอกค่าที่วัดได้วันนี้ อย่างน้อยหนึ่งรายการ" />

      <Card gap={Spacing.three}>
        <TextField label="ความดันตัวบน" value={systolic} onChangeText={setSystolic} placeholder="เช่น 130" keyboardType="number-pad" />
        <TextField label="ความดันตัวล่าง" value={diastolic} onChangeText={setDiastolic} placeholder="เช่น 85" keyboardType="number-pad" />
      </Card>

      <Card gap={Spacing.three}>
        <TextField label="น้ำตาลในเลือด (mg/dL)" value={sugar} onChangeText={setSugar} placeholder="เช่น 100" keyboardType="number-pad" />
        <TextField label="น้ำหนัก (กก.)" value={weight} onChangeText={setWeight} placeholder="เช่น 58" keyboardType="numeric" />
      </Card>

      <Card gap={Spacing.two}>
        <TextField label="หมายเหตุ (ไม่บังคับ)" value={note} onChangeText={setNote} placeholder="เช่น รู้สึกเวียนหัวเล็กน้อย" multiline />
      </Card>
    </Screen>
  );
}
