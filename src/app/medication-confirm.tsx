import { useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import {
  ArrowCounterClockwiseIcon,
  CameraIcon,
  ChartDonutIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  ClockIcon,
  FileTextIcon,
  NotepadIcon,
  PillIcon,
  UsersThreeIcon,
} from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { InfoRow } from '@/components/ui/info-row';
import { ReadOnlyBanner } from '@/components/ui/read-only-banner';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import * as uploadsApi from '@/services/uploads-api';
import { isToday } from '@/utils/date';

const steps = [
  { key: 'photo', label: '1 ถ่ายภาพ' },
  { key: 'review', label: '2 ตรวจภาพ' },
  { key: 'confirm', label: '3 ยืนยัน' },
] as const;

const hints = [
  { icon: PillIcon, text: 'ถ่ายให้เห็นเม็ดยาและซองยาในภาพเดียว' },
  { icon: ClockIcon, text: 'ระบบบันทึกเวลาถ่ายภาพให้อัตโนมัติ' },
  { icon: UsersThreeIcon, text: 'ครอบครัวเห็นภาพและเวลาที่ยืนยันทันที' },
] as const;

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function MedicationConfirmScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const { medications, familyMembers, primaryElderId, currentMembershipId, canEdit, confirmMedicationTaken } =
    useFamilyContext();

  // Real camera capture — `photoUri` is the local file the OS camera handed
  // back (via expo-image-picker's native camera UI), `shotAt` the real
  // moment it was taken. `takenToday`, derived below from real data, is
  // what actually drives the "done" stage.
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [shotAt, setShotAt] = useState<Date | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
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

  const isMe = medication?.memberId === currentMembershipId;
  const person = useMemo(
    () => familyMembers.find((member) => member.id === medication?.memberId),
    [familyMembers, medication]
  );

  const takenToday = medication?.lastTakenAt ? isToday(medication.lastTakenAt.slice(0, 10)) : false;
  const stage: 'idle' | 'review' | 'done' = takenToday ? 'done' : photoUri ? 'review' : 'idle';
  const currentStepIndex = stage === 'done' ? 2 : stage === 'review' ? 1 : 0;

  const takePhoto = async () => {
    if (!canEdit) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('ต้องอนุญาตใช้กล้อง', 'กรุณาอนุญาตให้แอปใช้กล้องในตั้งค่าเครื่อง เพื่อถ่ายภาพยืนยันการทานยา');
      return;
    }
    setIsCapturing(true);
    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setShotAt(new Date());
      }
    } catch {
      Alert.alert('ถ่ายภาพไม่สำเร็จ', 'เกิดข้อผิดพลาดขณะเปิดกล้อง กรุณาลองใหม่');
    } finally {
      setIsCapturing(false);
    }
  };

  const retake = () => {
    if (!canEdit) return;
    setPhotoUri(null);
    setShotAt(null);
    takePhoto();
  };

  const handleConfirm = async () => {
    if (!medication || !photoUri || !shotAt) return;
    setIsConfirming(true);
    try {
      const uploaded = await uploadsApi.uploadImage(photoUri);
      await confirmMedicationTaken(medication.id, { image: uploaded.url, photoTakenAt: shotAt.toISOString() });
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
          {stage === 'done' ? (
            <AppButton
              label="ดูแดชบอร์ดการทานยา"
              phosphorIcon={ChartDonutIcon}
              size="xlarge"
              onPress={() => router.push('/report')}
            />
          ) : (
            <AppButton
              label="ทานแล้ว และยืนยัน"
              phosphorIcon={PillIcon}
              size="xlarge"
              disabled={!canEdit || !photoUri || isConfirming}
              loading={isConfirming}
              onPress={handleConfirm}
              accessibilityHint={
                !canEdit ? 'ดูได้เท่านั้น' : photoUri ? 'บันทึกว่าคุณทานยาแล้ว' : 'ต้องถ่ายรูปยืนยันก่อนจึงจะกดได้'
              }
            />
          )}
          <AppButton label="ยกเลิก" variant="ghost" size="medium" onPress={() => router.back()} disabled={isConfirming} />
        </>
      }>
      <ReadOnlyBanner />

      <View style={styles.headerRow}>
        <View style={[styles.headerChip, { backgroundColor: theme.primarySoft }]}>
          <PillIcon weight="duotone" size={28} color={theme.primaryText} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="heading" numberOfLines={1}>
            {medication.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            ยา {medication.schedule.join(', ')} · {isMe ? 'ของฉัน' : (person?.name ?? '')}
          </ThemedText>
        </View>
      </View>

      <View style={styles.stepper}>
        {steps.map((step, index) => {
          const on = currentStepIndex >= index;
          return (
            <View key={step.key} style={styles.step}>
              <View style={[styles.stepBar, { backgroundColor: on ? theme.primary : theme.border }]} />
              <ThemedText
                type="caption"
                numberOfLines={1}
                style={{ color: on ? theme.primaryText : theme.textMuted }}>
                {step.label}
              </ThemedText>
            </View>
          );
        })}
      </View>

      <Card gap={Spacing.three} padding={Spacing.four}>
        <InfoRow phosphorIcon={ClockCountdownIcon} label="เวลาที่กำหนด" value={medication.schedule.join(', ') + ' น.'} />
        {medication.reason ? <InfoRow phosphorIcon={FileTextIcon} label="ใช้เพื่อ" value={medication.reason} /> : null}
        {medication.notes ? <InfoRow phosphorIcon={NotepadIcon} label="หมายเหตุ" value={medication.notes} /> : null}
      </Card>

      {stage === 'idle' ? (
        <Card gap={Spacing.four} padding={Spacing.four}>
          <View style={styles.hintList}>
            {hints.map((hint) => {
              const HintIcon = hint.icon;
              return (
                <View key={hint.text} style={styles.hintRow}>
                  <View style={[styles.hintIconWrap, { backgroundColor: theme.primarySoft }]}>
                    <HintIcon weight="duotone" size={19} color={theme.primaryText} />
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
                    {hint.text}
                  </ThemedText>
                </View>
              );
            })}
          </View>
          <AppButton
            label="ถ่ายภาพยืนยัน"
            phosphorIcon={CameraIcon}
            size="xlarge"
            disabled={!canEdit}
            loading={isCapturing}
            onPress={takePhoto}
            accessibilityHint={canEdit ? undefined : 'ดูได้เท่านั้น'}
          />
        </Card>
      ) : null}

      {stage === 'review' || stage === 'done' ? (
        <>
          <View style={[styles.previewFrame, { backgroundColor: theme.surfaceSunken, borderColor: theme.border }]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <CameraIcon weight="duotone" size={40} color={theme.textMuted} />
            )}
            <View
              style={[
                styles.stampPill,
                { backgroundColor: theme.backgroundElement, shadowColor: theme.shadow },
              ]}>
              {stage === 'done' ? (
                <CheckCircleIcon weight="fill" size={16} color={theme.successText} />
              ) : (
                <ClockCountdownIcon weight="fill" size={16} color={theme.warningText} />
              )}
              <ThemedText type="caption" style={{ color: stage === 'done' ? theme.successText : theme.warningText }}>
                {stage === 'done'
                  ? `ยืนยันแล้ว ${new Date(medication.lastTakenAt!).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`
                  : 'รอการยืนยัน'}
              </ThemedText>
            </View>
          </View>

          <Card gap={0} padding={Spacing.three}>
            <InfoRow label="เวลาถ่ายภาพ" value={shotAt ? formatTime(shotAt) : '—'} />
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
            <InfoRow label="ผู้บันทึก" value={user?.name ?? '—'} />
          </Card>

          {stage === 'review' ? (
            <AppButton
              label="ถ่ายใหม่"
              phosphorIcon={ArrowCounterClockwiseIcon}
              variant="secondary"
              size="large"
              disabled={!canEdit || isCapturing}
              loading={isCapturing}
              onPress={retake}
            />
          ) : null}

          <ThemedText type="small" themeColor="textSecondary" style={styles.previewCaption}>
            {stage === 'done' ? 'ครอบครัวเห็นแล้ว' : 'ตรวจภาพให้ชัดเจน แล้วกดยืนยันเพื่อบันทึก'}
          </ThemedText>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  headerChip: { width: 52, height: 52, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1, gap: Spacing.half, minWidth: 0 },

  stepper: { flexDirection: 'row', gap: Spacing.two },
  step: { flex: 1, gap: Spacing.one },
  stepBar: { height: 4, borderRadius: 2 },

  hintList: { gap: Spacing.three },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  hintIconWrap: { width: 34, height: 34, borderRadius: Radius.sm + 1, justifyContent: 'center', alignItems: 'center' },
  hintText: { flex: 1 },

  previewFrame: {
    width: '100%',
    height: 220,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  stampPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  separator: { height: 1 },
  previewCaption: { textAlign: 'center' },
});