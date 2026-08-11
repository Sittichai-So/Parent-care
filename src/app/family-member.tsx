import { useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { InfoRow } from '@/components/ui/info-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { VitalsSummary } from '@/components/ui/vitals-summary';
import { MemberStatusMeta } from '@/constants/status';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, formatDateKey } from '@/utils/date';

export default function FamilyMemberScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { selectedMemberId, familyMembers, medications, appointments, generateClaimCode } = useFamilyContext();
  const member = familyMembers.find((item) => item.id === selectedMemberId) ?? familyMembers[0];
  const [isGeneratingClaim, setIsGeneratingClaim] = useState(false);

  const memberMedications = useMemo(
    () => (member ? medications.filter((med) => med.memberId === member.id && med.active) : []),
    [medications, member]
  );
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
        <ScreenHeader title="ไม่พบข้อมูลสมาชิก" />
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            ยังไม่ได้เลือกสมาชิก กรุณากลับไปเลือกจากหน้าหลัก
          </ThemedText>
        </Card>
        <AppButton label="กลับหน้าหลัก" onPress={() => router.back()} />
      </Screen>
    );
  }

  const status = MemberStatusMeta[member.status];

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
            label="ส่งข้อความเตือน"
            icon="💬"
            onPress={() => Alert.alert('ส่งข้อความแล้ว', `ระบบส่งข้อความเตือนถึง ${member.name} เรียบร้อยแล้ว`)}
          />
          <AppButton
            label="โทรหา"
            icon="📞"
            variant="secondary"
            onPress={() => Alert.alert('กำลังโทร', `ระบบจำลองการโทรหา ${member.name}`)}
          />
        </>
      }>
      <ScreenHeader title="รายละเอียดสมาชิก" eyebrow="ครอบครัว" />

      <Card
        elevation="raised"
        padding={Spacing.four}
        gap={Spacing.three}
        accented={member.status !== 'normal'}
        tone={member.status === 'normal' ? 'surface' : 'warning'}
        style={styles.profile}>
        <Avatar name={member.name} size={72} tone={status.tone} />
        <ThemedText type="heading" style={styles.profileName}>
          {member.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {member.relation} · {member.role}
        </ThemedText>
        <View style={styles.badgeRow}>
          <StatusBadge label={status.label} tone={status.tone} />
          {!member.hasAccount ? <StatusBadge label="ไม่มีบัญชี" tone="neutral" /> : null}
          {member.membershipState === 'pending' ? <StatusBadge label="รอการยืนยัน" tone="warning" /> : null}
        </View>
      </Card>

      {!member.hasAccount ? (
        <Card tone="sunken" elevation="flat" gap={Spacing.two}>
          <ThemedText type="smallBold">สมาชิกคนนี้ยังไม่มีบัญชีของตัวเอง</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            สร้างรหัสผูกบัญชี แล้วส่งให้ {member.name} ไปสมัครบัญชีและกรอกรหัสนี้ เพื่อให้เขาเข้าถึงข้อมูลของตัวเองได้ในภายหลัง
            โดยประวัติยา/นัดหมาย/สุขภาพเดิมจะยังอยู่ครบ
          </ThemedText>
          <AppButton
            label="สร้างรหัสผูกบัญชี"
            icon="🔗"
            variant="secondary"
            onPress={handleGenerateClaimCode}
            loading={isGeneratingClaim}
            disabled={isGeneratingClaim}
          />
        </Card>
      ) : null}

      <Card gap={Spacing.three}>
        <InfoRow icon="📌" label="สถานะล่าสุด" value={member.detail} />
        <View style={[styles.separator, { backgroundColor: theme.border }]} />
        <InfoRow icon="🧑‍🤝‍🧑" label="ความสัมพันธ์" value={member.relation} />
        <View style={[styles.separator, { backgroundColor: theme.border }]} />
        <InfoRow icon="🔑" label="สิทธิ์ในระบบ" value={member.role} />
      </Card>

      <SectionHeader
        title="รายการยา"
        count={memberMedications.length}
        actionLabel="+ เพิ่มยา"
        onActionPress={() => router.push({ pathname: '/medication-form', params: { memberId: member.id } })}
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
        actionLabel="+ เพิ่มนัดหมาย"
        onActionPress={() => router.push({ pathname: '/appointment-form', params: { memberId: member.id } })}
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
  profile: { alignItems: 'center' },
  profileName: { textAlign: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, justifyContent: 'center' },
  separator: { height: 1 },
  list: { gap: Spacing.two },
  viewAll: { textAlign: 'center', paddingVertical: Spacing.one },
  pressed: { opacity: 0.7 },
});
