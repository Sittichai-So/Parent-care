import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import type { IconName } from '@/components/ui/app-button';
import { AppointmentSpotlightCard } from '@/components/ui/appointment-spotlight-card';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { MedicalHeader } from '@/components/ui/medical-header';
import { MemberAvatarStrip } from '@/components/ui/member-avatar-strip';
import { PromoCard } from '@/components/ui/promo-card';
import { Screen } from '@/components/ui/screen';
import { SearchPill } from '@/components/ui/search-pill';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { MemberStatusMeta, StatusPriority, TaskStatusMeta } from '@/constants/status';
import { HitSize, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext, type FamilyEvent, type FamilyTask } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday } from '@/utils/date';

const timelineIcons: Record<FamilyEvent['type'], IconName> = {
  'check-in': 'checkmark',
  medication: 'medical-outline',
  task: 'people-outline',
  appointment: 'calendar-outline',
  vitals: 'clipboard-outline',
  emergency: 'alert-circle-outline',
};

const taskIcons: Record<FamilyTask['relatedType'], IconName> = {
  checkin: 'checkmark',
  medication: 'medical-outline',
  appointment: 'calendar-outline',
  vitals: 'clipboard-outline',
  custom: 'ellipse',
};

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'สวัสดีตอนเช้า';
  if (hour < 18) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนค่ำ';
}

export default function CaregiverDashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const {
    familyMembers,
    tasks,
    timeline,
    appointments,
    primaryElderId,
    currentHousehold,
    currentRole,
    pendingInvites,
    setSelectedMemberId,
    updateTaskStatus,
    checkIn,
    acceptInvite,
    declineInvite,
  } = useFamilyContext();

  const [search, setSearch] = useState('');

  // This route ("/") is the (tabs) group's default screen regardless of
  // which NativeTabs.Trigger the tab layout renders — a pure-Elder role
  // never gets an "index" trigger there, so landing here would show a tab
  // that doesn't exist in their tab bar. Bounce them to their own screen.
  useEffect(() => {
    if (currentRole === 'Elder') {
      router.replace('/explore');
    }
  }, [currentRole, router]);

  const sortedMembers = useMemo(
    () =>
      [...familyMembers].sort(
        (a, b) => StatusPriority[a.status] - StatusPriority[b.status] || a.name.localeCompare(b.name)
      ),
    [familyMembers]
  );

  const normalCount = familyMembers.filter((member) => member.status === 'normal').length;
  const attentionMembers = sortedMembers.filter((member) => member.status !== 'normal');
  const openTasks = tasks.filter((task) => task.status !== 'done');

  // Search only narrows the member list below — stat tiles and alert cards
  // still reflect the true household counts regardless of what's typed.
  const visibleMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedMembers;
    return sortedMembers.filter(
      (member) => member.name.toLowerCase().includes(query) || member.relation.toLowerCase().includes(query)
    );
  }, [sortedMembers, search]);

  const nextAppointment = useMemo(
    () =>
      [...appointments]
        .filter((apt) => daysFromToday(apt.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0],
    [appointments]
  );
  const nextAppointmentMemberName =
    familyMembers.find((member) => member.id === nextAppointment?.memberId)?.name ?? '';

  const handleAcceptInvite = (householdId: string, membershipId: string, householdName: string) => {
    acceptInvite(householdId, membershipId)
      .then(() => Alert.alert('เข้าร่วมกลุ่มแล้ว', `เข้าร่วมกลุ่ม "${householdName}" เรียบร้อยแล้ว`))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        Alert.alert('เข้าร่วมกลุ่มไม่สำเร็จ', message);
      });
  };

  const handleDeclineInvite = (householdId: string, membershipId: string) => {
    declineInvite(householdId, membershipId).catch((err) => {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      Alert.alert('ปฏิเสธคำขอไม่สำเร็จ', message);
    });
  };

  const confirmLogout = () => {
    Alert.alert('ออกจากระบบ', 'ต้องการออกจากระบบใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ออกจากระบบ',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <Screen>
      {/* Header — who you are, and the one number that matters today. */}
      <MedicalHeader
        title={user?.name ?? 'คุณ'}
        subtitle={
          attentionMembers.length > 0
            ? `${greetingForNow()} · มี ${attentionMembers.length} คนที่ควรตรวจสอบ`
            : `${greetingForNow()} · วันนี้ทุกคนในบ้านสถานะปกติดี`
        }
        notificationCount={attentionMembers.length + pendingInvites.length}
        onNotificationPress={() =>
          Alert.alert(
            'การแจ้งเตือน',
            [
              attentionMembers.length > 0 ? `${attentionMembers.length} คนที่ควรตรวจสอบ` : null,
              pendingInvites.length > 0 ? `${pendingInvites.length} คำขอเข้าร่วมกลุ่มรออยู่` : null,
            ]
              .filter(Boolean)
              .join('\n') || 'ไม่มีการแจ้งเตือนใหม่'
          )
        }
        onLogoutPress={confirmLogout}>
        <SearchPill
          value={search}
          onChangeText={setSearch}
          placeholder="ค้นหาสมาชิกในบ้าน..."
          accessibilityLabel="ค้นหาสมาชิกในบ้าน"
        />
      </MedicalHeader>

      <PromoCard
        title="ถึงเวลานัดหมายครั้งต่อไปหรือยัง? จองนัดหมายใหม่ให้สมาชิกในบ้านได้ที่นี่"
        ctaLabel="จองนัดหมาย"
        icon="calendar-outline"
        onPress={() => router.push({ pathname: '/appointment-form', params: { memberId: primaryElderId } })}
      />

      {nextAppointment ? (
        <>
          <SectionHeader title="นัดหมายที่ใกล้ที่สุด" />
          <AppointmentSpotlightCard
            appointment={nextAppointment}
            memberName={nextAppointmentMemberName}
            onPress={() => router.push({ pathname: '/appointment-detail', params: { id: nextAppointment.id } })}
          />
        </>
      ) : null}

      {pendingInvites.length > 0 ? (
        <Card tone="primary" accented elevation="flat" gap={Spacing.two}>
          <View style={styles.alertHead}>
            <Ionicons name="mail-unread-outline" size={18} color={theme.primaryText} />
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
              มีคำขอเข้าร่วมกลุ่มรออยู่
            </ThemedText>
          </View>
          {pendingInvites.map((invite) => (
            <View key={invite.membershipId} style={styles.inviteRow}>
              <View style={styles.inviteBody}>
                <ThemedText type="small" style={{ color: theme.primaryText }}>
                  {invite.householdName} · {invite.role}
                </ThemedText>
              </View>
              <View style={styles.inviteActions}>
                <Pressable
                  onPress={() => handleDeclineInvite(invite.householdId, invite.membershipId)}
                  accessibilityRole="button"
                  accessibilityLabel={`ปฏิเสธคำขอเข้าร่วม ${invite.householdName}`}
                  style={({ pressed }) => [styles.inviteDecline, { borderColor: theme.border }, pressed && styles.pressed]}>
                  <ThemedText type="caption">ปฏิเสธ</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => handleAcceptInvite(invite.householdId, invite.membershipId, invite.householdName)}
                  accessibilityRole="button"
                  accessibilityLabel={`ยอมรับคำขอเข้าร่วม ${invite.householdName}`}
                  style={({ pressed }) => [styles.inviteAccept, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
                  <ThemedText type="caption" style={{ color: theme.onPrimary, fontWeight: '700' }}>
                    ยอมรับ
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {currentHousehold ? (
        <Pressable
          onPress={() => router.push('/add-member')}
          accessibilityRole="button"
          accessibilityLabel={`${currentHousehold.name} เพิ่มสมาชิก`}
          accessibilityHint="เปิดหน้าเพิ่มสมาชิกเข้ากลุ่มครอบครัว"
          style={({ pressed }) => pressed && styles.pressed}>
          <Card tone="sunken" elevation="flat" gap={Spacing.half} style={styles.inviteCard}>
            <ThemedText type="caption" themeColor="textMuted">
              {currentHousehold.name}
            </ThemedText>
            <ThemedText type="smallBold">+ เพิ่มสมาชิกเข้ากลุ่ม</ThemedText>
          </Card>
        </Pressable>
      ) : null}

      {/* At-a-glance counts. */}
      <View style={styles.statRow}>
        <StatTile value={normalCount} label="ปกติดี" tone="success" />
        <StatTile value={attentionMembers.length} label="ต้องติดตาม" tone="warning" />
        <StatTile value={openTasks.length} label="งานค้าง" tone="primary" />
      </View>

      {attentionMembers.length > 0 ? (
        <Card tone="warning" accented elevation="flat" gap={Spacing.two}>
          <View style={styles.alertHead}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.warningText} />
            <ThemedText type="smallBold" style={{ color: theme.warningText }}>
              ต้องติดตามก่อน
            </ThemedText>
          </View>
          {attentionMembers.map((member) => (
            <ThemedText key={member.id} type="small" style={{ color: theme.warningText }}>
              {member.name} — {member.detail}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      <SectionHeader title="สมาชิกในบ้าน" count={familyMembers.length} />
      <MemberAvatarStrip
        members={sortedMembers}
        onSelect={(member) => {
          setSelectedMemberId(member.id);
          router.push('/family-member');
        }}
      />
      <View style={styles.list}>
        {visibleMembers.length === 0 ? (
          <Card tone="sunken" elevation="flat">
            <ThemedText type="small" themeColor="textSecondary">
              ไม่พบสมาชิกที่ตรงกับ &quot;{search}&quot;
            </ThemedText>
          </Card>
        ) : null}
        {visibleMembers.map((member) => {
          const status = MemberStatusMeta[member.status];
          return (
            <Pressable
              key={member.id}
              onPress={() => {
                setSelectedMemberId(member.id);
                router.push('/family-member');
              }}
              accessibilityRole="button"
              accessibilityLabel={`${member.name} ${member.relation} สถานะ ${status.label}`}
              accessibilityHint="เปิดรายละเอียดสมาชิก"
              style={({ pressed }) => pressed && styles.pressed}>
              <Card
                accented={member.status !== 'normal'}
                tone={member.status === 'normal' ? 'surface' : 'warning'}
                gap={Spacing.three}
                style={styles.memberCard}>
                <Avatar name={member.name} tone={status.tone} />

                <View style={styles.memberBody}>
                  <View style={styles.memberHead}>
                    <ThemedText type="smallBold" numberOfLines={1} style={styles.memberName}>
                      {member.name}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textMuted">
                      {member.relation} · {member.role}
                    </ThemedText>
                  </View>
                  <View style={styles.memberBadges}>
                    <StatusBadge label={status.label} tone={status.tone} />
                    {!member.hasAccount ? <StatusBadge label="ไม่มีบัญชี" tone="neutral" /> : null}
                    {member.membershipState === 'pending' ? <StatusBadge label="รอการยืนยัน" tone="warning" /> : null}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                    {member.detail}
                  </ThemedText>
                </View>

                <Ionicons name="chevron-forward-outline" size={22} color={theme.textMuted} />
              </Card>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader
        title="งานที่ต้องดูแลวันนี้"
        actionLabel="ดูนัดหมาย"
        onActionPress={() => router.push('/appointments')}
      />
      <View style={styles.list}>
        {tasks.map((task) => {
          const isDone = task.status === 'done';
          const meta = TaskStatusMeta[task.status];
          return (
            <Pressable
              key={task.id}
              onPress={() => {
                updateTaskStatus(task.id, isDone ? 'pending' : 'done').catch((err) => {
                  const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
                  Alert.alert('อัปเดตงานไม่สำเร็จ', message);
                });
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isDone }}
              accessibilityLabel={`${task.title} — ${meta.label}`}
              accessibilityHint="แตะเพื่อสลับสถานะงาน"
              style={({ pressed }) => pressed && styles.pressed}>
              <Card gap={Spacing.three} style={styles.taskCard}>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isDone ? theme.success : theme.borderStrong,
                      backgroundColor: isDone ? theme.success : 'transparent',
                    },
                  ]}>
                  {isDone ? <Ionicons name="checkmark" size={14} color={theme.onPrimary} /> : null}
                </View>

                <View style={styles.taskBody}>
                  <View style={styles.taskTitleRow}>
                    <Ionicons
                      name={taskIcons[task.relatedType]}
                      size={14}
                      color={isDone ? theme.textMuted : theme.textSecondary}
                    />
                    <ThemedText
                      type="smallBold"
                      style={isDone ? [styles.taskDone, { color: theme.textMuted }] : undefined}>
                      {task.title}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                    {task.detail}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textMuted">
                    ผู้รับผิดชอบ: {task.owner}
                  </ThemedText>
                </View>

                <StatusBadge label={meta.label} tone={meta.tone} dot={false} />
              </Card>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="การดำเนินการด่วน" />
      <View style={styles.list}>
        <AppButton
          label="ตรวจสอบสถานะ"
          icon="checkmark-outline"
          onPress={() => {
            checkIn()
              .then(() => Alert.alert('บันทึกสำเร็จ', 'บันทึกการตรวจสอบสถานะเรียบร้อยแล้ว'))
              .catch((err) => {
                const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
                Alert.alert('บันทึกไม่สำเร็จ', message);
              });
          }}
        />
        <View style={styles.quickRow}>
          <AppButton label="นัดหมาย" icon="calendar-outline" variant="secondary" style={styles.quickHalf} onPress={() => router.push('/appointments')} />
          <AppButton label="รายการยา" icon="medical-outline" variant="secondary" style={styles.quickHalf} onPress={() => router.push('/medications')} />
        </View>
      </View>

      <SectionHeader title="ไทม์ไลน์ครอบครัว" />
      <Card gap={0} padding={Spacing.three}>
        {timeline.map((item, index) => {
          const isLast = index === timeline.length - 1;
          return (
            <View key={item.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name={timelineIcons[item.type]} size={14} color={theme.primaryText} />
                </View>
                {!isLast ? <View style={[styles.timelineLine, { backgroundColor: theme.border }]} /> : null}
              </View>

              <View style={[styles.timelineBody, isLast && styles.timelineBodyLast]}>
                <View style={styles.timelineHead}>
                  <ThemedText type="smallBold" style={styles.timelineTitle}>
                    {item.title}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textMuted">
                    {item.time}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.detail}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </Card>

      <Pressable
        onPress={() => router.push('/household-setup')}
        accessibilityRole="button"
        style={({ pressed }) => pressed && styles.pressed}>
        <ThemedText type="linkPrimary" style={styles.claimLink}>
          มีรหัสผูกบัญชีจากผู้ดูแลคนอื่น? กดที่นี่
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inviteCard: { alignItems: 'flex-start' },

  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  inviteBody: { flex: 1 },
  inviteActions: { flexDirection: 'row', gap: Spacing.two },
  inviteDecline: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  inviteAccept: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },

  claimLink: { textAlign: 'center', paddingVertical: Spacing.one },

  statRow: { flexDirection: 'row', gap: Spacing.two },

  alertHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },

  list: { gap: Spacing.two },
  quickRow: { flexDirection: 'row', gap: Spacing.two },
  quickHalf: { flex: 1 },

  memberCard: { flexDirection: 'row', alignItems: 'center' },
  memberBody: { flex: 1, gap: Spacing.one + 2 },
  memberHead: { gap: 1 },
  memberName: { fontSize: 16, lineHeight: 22 },
  memberBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },

  taskCard: { flexDirection: 'row', alignItems: 'center' },
  taskBody: { flex: 1, gap: Spacing.half },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  taskDone: { textDecorationLine: 'line-through' },
  checkbox: {
    width: HitSize.small - 12,
    height: HitSize.small - 12,
    borderRadius: Radius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  timelineRow: { flexDirection: 'row', gap: Spacing.three },
  timelineRail: { alignItems: 'center', width: 32 },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: { width: 2, flex: 1, marginVertical: Spacing.one },
  timelineBody: { flex: 1, gap: Spacing.half, paddingBottom: Spacing.three },
  timelineBodyLast: { paddingBottom: 0 },
  timelineHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  timelineTitle: { flex: 1 },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
