import { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
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
  const { familyMembers, primaryElderId, addVitalLog } = useFamilyContext();

  const memberId = params.memberId ?? primaryElderId;
  const member = familyMembers.find((m) => m.id === memberId);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [sugar, setSugar] = useState('');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');

  const handleSave = () => {
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

    addVitalLog({
      memberId,
      recordedAt: new Date().toISOString(),
      systolic: systolicValue,
      diastolic: diastolicValue,
      sugar: sugarValue,
      weight: weightValue,
      note: note.trim() || undefined,
    });
    router.back();
  };

  return (
    <Screen
      keyboardAvoiding
      gap={Spacing.three}
      footer={<AppButton label="บันทึกข้อมูลสุขภาพ" icon="✓" onPress={handleSave} />}>
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
