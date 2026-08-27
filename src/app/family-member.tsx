import { useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CaretLeftIcon, ChatTeardropDotsIcon, HandHeartIcon, LinkIcon, PhoneCallIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { InfoRow } from '@/components/ui/info-row';
import { ReadOnlyBanner } from '@/components/ui/read-only-banner';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { VitalsSummary } from '@/components/ui/vitals-summary';
import { MemberDisplayStatusMeta } from '@/constants/status';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, formatDateKey, isToday } from '@/utils/date';
import { checkInTime, memberDisplayStatus } from '@/utils/member-status';

export default function FamilyMemberScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    selectedMemberId,
    familyMembers,
    medications,
    appointments,
    currentMembershipId,
    canEdit,
    canManageFor,
    checkIn,
    generateClaimCode,
  } = useFamilyContext();
  const member = familyMembers.find((item) => item.id === selectedMemberId) ?? familyMembers[0];
  const [isGeneratingClaim, setIsGeneratingClaim] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [pinged, setPinged] = useState(false);

  const memberMedications = useMemo(
    () => (member ? medications.filter((med) => med.memberId === member.id && med.active) : []),
    [medications, member]
  );
  const primaryMedication = memberMedications[0];
  const primaryMedTakenToday = primaryMedication?.lastTakenAt ? isToday(primaryMedication.lastTakenAt.slice(0, 10)) : false;

  const nextAppointment = useMemo(
    () =>
      member
        ? appointments
            .filter((apt) => apt.memberId === member.id && daysFromToday(apt.date) >= 0)
            .sort((a, b) => a.date.localeCompare(b.date))[0]
        : undefined,
    [appointments, member]
  );

  if (!member) {
    return (
      <Screen center>
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            ยังไม่ได้เลือกสมาชิก กรุณากลับไปเลือกจากหน้าหลัก
          </ThemedText>
        </Card>
        <AppButton label="กลับหน้าหลัก" onPress={() => router.back()} />
      </Screen>
    );
  }

  const status = MemberDisplayStatusMeta[memberDisplayStatus(member, medications)];
  const canManageMember = canManageFor(member.id);
  const isSelf = member.id === currentMembershipId;
  const checkedInAt = checkInTime(member);

  const handlePing = () => {
    setPinged(true);
  };

  const handleCheckIn = () => {
    setIsCheckingIn(true);
    checkIn(member.id)
      .then(() =>
        Alert.alert('เช็กอินแล้ว', isSelf ? 'บอกครอบครัวแล้วว่าวันนี้สบายดี' : `บันทึกว่า ${member.name} สบายดีวันนี้แล้ว`)
      )
      .catch((err) =>
        Alert.alert('เช็กอินไม่สำเร็จ', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      )
      .finally(() => setIsCheckingIn(false));
  };

  const handleGenerateClaimCode = async () => {
    setIsGeneratingClaim(true);
    try {
      const code = await generateClaimCode(member.id);
      await Share.share({
        message: `ผูกบัญชีของคุณกับโปรไฟล์ "${member.name}" ในแอป Parent Care ด้วยรหัส: ${code}\n\n(รหัสหมดอายุใน 24 ชั่วโมง — ไปที่หน้าเริ่มต้นใช้งาน แล้วเลือก "ผูกบัญชีเดิม")`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      Alert.alert('สร้างรหัสไม่สำเร็จ', message);
    } finally {
      setIsGeneratingClaim(false);
    }
  };

  return (
    <Screen
      gap={Spacing.three}
      footer={
        <>
          <AppButton
            label={pinged ? 'ส่งข้อความเตือนแล้ว' : 'ส่งข้อความเตือน'}
            phosphorIcon={ChatTeardropDotsIcon}
            disabled={!canEdit}
            onPress={
              canEdit
                ? () => {
                    handlePing();
                    router.push('/messages');
                  }
                : undefined
            }
            accessibilityHint={canEdit ? undefined : 'ดูได้เท่านั้น'}
          />
          {primaryMedication && (primaryMedTakenToday || canManageMember) ? (
            <AppButton
              label={primaryMedTakenToday ? 'ดูภาพยืนยันการทานยา' : `ยืนยันการทานยา ${primaryMedication.schedule[0] ?? ''}`}
              variant="secondary"
              onPress={() => router.push({ pathname: '/medication-confirm', params: { id: primaryMedication.id } })}
            />
          ) : null}
          <AppButton
            label="โทรหา"
            phosphorIcon={PhoneCallIcon}
            variant="secondary"
            onPress={() => Alert.alert('กำลังโทร', `ระบบจำลองการโทรหา ${member.name}`)}
          />
        </>
      }>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="กลับไปสมาชิกในบ้าน"
        style={({ pressed }) => [styles.backChip, { backgroundColor: theme.primarySoft }, pressed && styles.pressed]}>
        <CaretLeftIcon weight="bold" size={16} color={theme.primaryText} />
        <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
          สมาชิกในบ้าน
        </ThemedText>
      </Pressable>

      <ReadOnlyBanner />

      <Card elevation="floating" padding={Spacing.four} gap={Spacing.four} style={styles.hero}>
        <Avatar name={member.name} size={132} shape="rounded" tone={status.tone} />
        <View style={styles.heroBody}>
          <ThemedText type="eyebrow" themeColor="eyebrow">
            {member.role}
          </ThemedText>
          <ThemedText type="display" numberOfLines={2}>
            {member.name}
          </ThemedText>
          <View style={styles.badgeRow}>
            <StatusBadge label={status.label} tone={status.tone} phosphorIcon={status.icon} />
            {!member.hasAccount ? <StatusBadge label="ไม่มีบัญชี" tone="neutral" /> : null}
            {member.membershipState === 'pending' ? <StatusBadge label="รอการยืนยัน" tone="warning" /> : null}
          </View>
        </View>
      </Card>

      {member.membershipState === 'active' && canManageMember ? (
        <AppButton
          label={
            checkedInAt
              ? `เช็กอินแล้ววันนี้ · ${checkedInAt} น.`
              : isSelf
                ? 'ฉันสบายดีวันนี้'
                : `ยืนยันว่า ${member.name} สบายดีวันนี้`
          }
          phosphorIcon={HandHeartIcon}
          variant={checkedInAt ? 'success' : 'primary'}
          onPress={handleCheckIn}
          loading={isCheckingIn}
          disabled={isCheckingIn || !!checkedInAt}
        />
      ) : null}

      {!member.hasAccount ? (
        <Card tone="sunken" elevation="flat" gap={Spacing.two}>
          <ThemedText type="smallBold">สมาชิกคนนี้ยังไม่มีบัญชีของตัวเอง</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            สร้างรหัสผูกบัญชี แล้วส่งให้ {member.name} ไปสมัครบัญชีและกรอกรหัสนี้ เพื่อให้เขาเข้าถึงข้อมูลของตัวเองได้ในภายหลัง
            โดยประวัติยา/นัดหมาย/สุขภาพเดิมจะยังอยู่ครบ
          </ThemedText>
          <AppButton
            label="สร้างรหัสผูกบัญชี"
            phosphorIcon={LinkIcon}
            variant="secondary"
            onPress={canEdit ? handleGenerateClaimCode : undefined}
            disabled={!canEdit || isGeneratingClaim}
            loading={isGeneratingClaim}
          />
        </Card>
      ) : null}

      <Card gap={0} padding={Spacing.three}>
        <InfoRow label="ความสัมพันธ์" value={member.relation} />
        <View style={[styles.separator, { backgroundColor: theme.border }]} />
        <InfoRow label="สถานะ" value={member.detail || status.label} />
        <View style={[styles.separator, { backgroundColor: theme.border }]} />
        <InfoRow label="เช็กอินวันนี้" value={checkedInAt ? `${checkedInAt} น.` : 'ยังไม่เช็กอิน'} />
      </Card>

      <SectionHeader
        title="รายการยา"
        count={memberMedications.length}
        actionLabel={canManageMember ? '+ เพิ่มยา' : undefined}
        onActionPress={
          canManageMember ? () => router.push({ pathname: '/medication-form', params: { memberId: member.id } }) : undefined
        }
      />
      {memberMedications.length === 0 ? (
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            ยังไม่มีรายการยาที่ใช้อยู่
          </ThemedText>
        </Card>
      ) : (
        <View style={styles.list}>
          {memberMedications.map((med) => (
            <Pressable
              key={med.id}
              onPress={() => router.push({ pathname: '/medication-form', params: { id: med.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${med.name} ${med.dosage}`}
              style={({ pressed }) => pressed && styles.pressed}>
              <Card gap={Spacing.half} elevation="flat" tone="sunken">
                <ThemedText type="smallBold">{med.name}</ThemedText>
                <ThemedText type="caption" themeColor="textMuted">
                  {med.dosage} · {med.schedule.join(', ')} น.
                </ThemedText>
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <SectionHeader
        title="นัดหมายที่จะถึง"
        actionLabel={canManageMember ? '+ เพิ่มนัดหมาย' : undefined}
        onActionPress={
          canManageMember ? () => router.push({ pathname: '/appointment-form', params: { memberId: member.id } }) : undefined
        }
      />
      {nextAppointment ? (
        <Pressable
          onPress={() => router.push({ pathname: '/appointment-detail', params: { id: nextAppointment.id } })}
          accessibilityRole="button"
          style={({ pressed }) => pressed && styles.pressed}>
          <Card gap={Spacing.half} elevation="flat" tone="sunken">
            <ThemedText type="smallBold">{nextAppointment.title}</ThemedText>
            <ThemedText type="caption" themeColor="textMuted">
              {formatDateKey(nextAppointment.date)} · {nextAppointment.time} น. · {nextAppointment.hospital}
            </ThemedText>
          </Card>
        </Pressable>
      ) : (
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            ไม่มีนัดหมายที่จะถึง
          </ThemedText>
        </Card>
      )}
      <Pressable
        onPress={() => router.push({ pathname: '/appointments', params: { memberId: member.id } })}
        accessibilityRole="button"
        style={({ pressed }) => pressed && styles.pressed}>
        <ThemedText type="linkPrimary" style={styles.viewAll}>
          ดูนัดหมายทั้งหมด ›
        </ThemedText>
      </Pressable>

      <SectionHeader title="สุขภาพ" />
      <VitalsSummary memberId={member.id} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one + 2,
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
  },
  hero: { flexDirection: 'row', alignItems: 'center' },
  heroBody: { flex: 1, minWidth: 0, gap: Spacing.two },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  separator: { height: 1 },
  list: { gap: Spacing.two },
  viewAll: { textAlign: 'center', paddingVertical: Spacing.one },
  pressed: { opacity: 0.7 },
});
