import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { InfoRow } from '@/components/ui/info-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { isToday } from '@/utils/date';

const steps = [
  { key: 'photo', label: 'ถ่ายรูปยา' },
  { key: 'confirm', label: 'ยืนยันการทาน' },
] as const;

export default function MedicationConfirmScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const { medications, primaryElderId, currentMembershipId, confirmMedicationTaken } = useFamilyContext();
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Same reasoning as (tabs)/explore.tsx's selfMemberId — opening this
  // screen without an explicit medicine id (e.g. a stale deep link) should
  // fall back to the caller's *own* medicine, not the household's primary
  // elder (who may be someone else entirely).
  const selfMemberId = currentMembershipId ?? primaryElderId;

  const medication = useMemo(() => {
    if (params.id) return medications.find((med) => med.id === params.id);
    return medications.find((med) => med.memberId === selfMemberId && med.active);
  }, [medications, params.id, selfMemberId]);

  const takenToday = medication?.lastTakenAt ? isToday(medication.lastTakenAt.slice(0, 10)) : false;
  const currentStep = takenToday ? 2 : photoCaptured ? 1 : 0;

  const handleConfirm = async () => {
    if (!medication) return;
    setIsConfirming(true);
    try {
      await confirmMedicationTaken(medication.id);
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      Alert.alert('ยืนยันการทานยาไม่สำเร็จ', message);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!medication) {
    return (
      <Screen center gap={Spacing.three}>
        <ScreenHeader title="ยืนยันการทานยา" />
        <Card tone="sunken" elevation="flat" gap={Spacing.two}>
          <ThemedText type="smallBold">ยังไม่มีรายการยา</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            เพิ่มรายการยาก่อน เพื่อให้สามารถยืนยันการทานยาได้
          </ThemedText>
        </Card>
        <AppButton
          label="เพิ่มรายการยา"
          onPress={() => router.replace({ pathname: '/medication-form', params: { memberId: selfMemberId } })}
        />
      </Screen>
    );
  }

  return (
    <Screen
      gap={Spacing.three}
      footer={
        <>
          <AppButton
            label={takenToday ? 'ยืนยันแล้ววันนี้' : 'ทานแล้ว และยืนยัน'}
            icon={takenToday ? '✓' : '💊'}
            size="xlarge"
            variant={takenToday ? 'success' : 'primary'}
            disabled={!photoCaptured || takenToday || isConfirming}
            loading={isConfirming}
            onPress={handleConfirm}
            accessibilityHint={photoCaptured ? 'บันทึกว่าคุณทานยาแล้ว' : 'ต้องถ่ายรูปยืนยันก่อนจึงจะกดได้'}
          />
          <AppButton label="ยกเลิก" variant="ghost" size="medium" onPress={() => router.back()} disabled={isConfirming} />
        </>
      }>
      <ScreenHeader
        title="ยืนยันการทานยา"
        eyebrow="ยาประจำวัน"
        subtitle="ถ่ายรูปยาแล้วกดยืนยัน เพื่อให้ครอบครัวเห็นว่าคุณทานยาแล้ว"
      />

      <View style={styles.stepper}>
        {steps.map((step, index) => {
          const isDone = currentStep > index;
          const isActive = currentStep === index;
          return (
            <View key={step.key} style={styles.step}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isDone ? theme.success : isActive ? theme.primary : theme.surfaceSunken,
                    borderColor: isDone ? theme.success : isActive ? theme.primary : theme.border,
                  },
                ]}>
                <ThemedText style={[styles.stepGlyph, { color: isDone || isActive ? '#FFFFFF' : theme.textMuted }]}>
                  {isDone ? '✓' : String(index + 1)}
                </ThemedText>
              </View>
              <ThemedText type="caption" themeColor={isDone || isActive ? 'text' : 'textMuted'} numberOfLines={1}>
                {step.label}
              </ThemedText>
              {index < steps.length - 1 ? (
                <View style={[styles.stepLine, { backgroundColor: currentStep > index ? theme.success : theme.border }]} />
              ) : null}
            </View>
          );
        })}
      </View>

      <Card gap={Spacing.three} padding={Spacing.four}>
        <View style={styles.pillHead}>
          <View style={[styles.pillIcon, { backgroundColor: theme.primarySoft }]}>
            <ThemedText style={styles.pillGlyph}>💊</ThemedText>
          </View>
          <View style={styles.pillText}>
            <ThemedText type="heading">{medication.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {medication.dosage}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        <InfoRow icon="⏰" label="เวลาที่กำหนด" value={medication.schedule.join(', ') + ' น.'} />
        {medication.reason ? <InfoRow icon="🩺" label="ใช้เพื่อ" value={medication.reason} /> : null}
        {medication.notes ? <InfoRow icon="📝" label="หมายเหตุ" value={medication.notes} /> : null}
      </Card>

      <Card tone={takenToday ? 'success' : photoCaptured ? 'primary' : 'sunken'} elevation="flat" gap={Spacing.two}>
        <StatusBadge
          label={takenToday ? 'ยืนยันแล้ววันนี้' : photoCaptured ? 'พร้อมยืนยัน' : 'รอถ่ายรูป'}
          tone={takenToday ? 'success' : photoCaptured ? 'primary' : 'neutral'}
        />
        <ThemedText type="small" themeColor="textSecondary">
          {takenToday
            ? 'ครอบครัวจะเห็นว่าคุณทานยาตามกำหนดแล้ว'
            : photoCaptured
              ? 'ภาพพร้อมส่งแล้ว กดปุ่มยืนยันด้านล่างเพื่อบันทึก'
              : 'ถ่ายรูปยาก่อนทาน เพื่อให้ครอบครัวมั่นใจว่าทานถูกต้อง'}
        </ThemedText>
      </Card>

      {photoCaptured ? (
        <Card gap={Spacing.two} style={styles.preview}>
          <View style={[styles.previewFrame, { backgroundColor: theme.surfaceSunken, borderColor: theme.border }]}>
            <ThemedText style={styles.previewEmoji}>🩺</ThemedText>
          </View>
          <ThemedText type="smallBold">ภาพยืนยันพร้อมส่ง</ThemedText>
          <ThemedText type="caption" themeColor="textMuted" style={styles.previewCaption}>
            รูปนี้จำลองการอัปโหลดจากกล้องเพื่อยืนยันการทานยา
          </ThemedText>
          <AppButton label="ถ่ายใหม่" variant="ghost" size="medium" onPress={() => setPhotoCaptured(true)} />
        </Card>
      ) : (
        <AppButton
          label="ถ่ายรูปยืนยัน"
          icon="📷"
          variant="secondary"
          size="xlarge"
          onPress={() => setPhotoCaptured(true)}
          accessibilityHint="เปิดกล้องเพื่อถ่ายภาพยาก่อนยืนยัน"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepGlyph: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  stepLine: { width: 28, height: 2, marginHorizontal: Spacing.one },

  pillHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  pillIcon: { width: 52, height: 52, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center' },
  pillGlyph: { fontSize: 24, lineHeight: 32 },
  pillText: { flex: 1, gap: Spacing.half },
  separator: { height: 1 },

  preview: { alignItems: 'center' },
  previewFrame: {
    width: '100%',
    height: 132,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewEmoji: { fontSize: 40, lineHeight: 48 },
  previewCaption: { textAlign: 'center' },
});
