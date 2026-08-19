import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  ArrowRightIcon,
  CalendarPlusIcon,
  CheckCircleIcon,
  CheckIcon,
  ListChecksIcon,
  PillIcon,
  ShieldCheckIcon,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { AppointmentSpotlightCard } from '@/components/ui/appointment-spotlight-card';
import { Card } from '@/components/ui/card';
import { HouseholdSwitcher } from '@/components/ui/household-switcher';
import { MedicalHeader } from '@/components/ui/medical-header';
import { MemberAvatarStrip } from '@/components/ui/member-avatar-strip';
import { ReadOnlyBanner } from '@/components/ui/read-only-banner';
import { Screen } from '@/components/ui/screen';
import { SearchPill } from '@/components/ui/search-pill';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatusPriority, TaskStatusMeta } from '@/constants/status';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext, type FamilyTask } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, isToday } from '@/utils/date';

const taskIcons: Record<FamilyTask['relatedType'], PhosphorIcon> = {
  checkin: CheckCircleIcon,
  medication: PillIcon,
  appointment: CalendarPlusIcon,
  vitals: ListChecksIcon,
  custom: CheckIcon,
};

export default function CaregiverDashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const {
    familyMembers,
    tasks,
    appointments,
    medications,
    primaryElderId,
    currentMembershipId,
    currentRole,
    canEdit,
    canManageFor,
    pendingInvites,
    notifications,
    setSelectedMemberId,
    updateTaskStatus,
  } = useFamilyContext();

  const [search, setSearch] = useState('');

  const unreadMessageCount = useMemo(
    () => notifications.filter((item) => item.type === 'MESSAGE' && !item.isRead).length,
    [notifications]
  );
  // Everything else in the inbox (medicine/appointment reminders, emergency,
  // etc.) — MESSAGE is excluded here since it already has its own badge on
  // the chat icon, and counting it in both would double it.
  const unreadNoticeCount = useMemo(
    () => notifications.filter((item) => item.type !== 'MESSAGE' && !item.isRead).length,
    [notifications]
  );

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

  const attentionMembers = sortedMembers.filter((member) => member.status !== 'normal');

  // Search only narrows the member strip below.
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

  const medicationRows = useMemo(
    () =>
      familyMembers
        .map((member) => {
          const med = medications.find((item) => item.memberId === member.id && item.active);
          if (!med) return null;
          const takenToday = med.lastTakenAt ? isToday(med.lastTakenAt.slice(0, 10)) : false;
          const isMe = member.id === currentMembershipId;
          return {
            member,
            med,
            takenToday,
            title: `${isMe ? 'ยาของฉัน' : `ยาของ${member.relation}`} · ${med.schedule[0] ?? ''}`,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null),
    [familyMembers, medications, currentMembershipId]
  );

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
    <Screen
      header={
        <MedicalHeader
          topSlot={<HouseholdSwitcher />}
          title="Parent Care"
          subtitle={
            attentionMembers.length > 0
              ? `สวัสดี ${user?.name ?? 'คุณ'} · ${attentionMembers.length} รายการต้องติดตาม`
              : `สวัสดี ${user?.name ?? 'คุณ'} · ทุกอย่างปกติวันนี้`
          }
          notificationCount={attentionMembers.length + pendingInvites.length + unreadNoticeCount}
          onNotificationPress={() => router.push('/notices')}
          onLogoutPress={confirmLogout}
          onMessagesPress={() => router.push('/messages')}
          messageCount={unreadMessageCount}>
          <SearchPill
            value={search}
            onChangeText={setSearch}
            placeholder="ค้นหายา นัดหมาย สมาชิก..."
            accessibilityLabel="ค้นหายา นัดหมาย หรือสมาชิกในบ้าน"
          />
        </MedicalHeader>
      }>
      <ReadOnlyBanner />

      {/* Booking strip — per the reference design's compact "จองนัดหมาย" banner.
       *  The left tile is decorative in the reference design; made tappable
       *  here as a shortcut into the calendar now that `/calendar` exists. */}
      <View style={[styles.bookingStrip, { backgroundColor: theme.primarySoft }]}>
        <Pressable
          onPress={() => router.push('/calendar')}
          accessibilityRole="button"
          accessibilityLabel="ปฏิทินครอบครัว"
          style={({ pressed }) => [styles.bookingTile, { backgroundColor: theme.sky }, pressed && styles.pressed]}>
          <CalendarPlusIcon weight="duotone" size={30} color={theme.primaryText} />
        </Pressable>
        {/* Targets primaryElderId as a starting suggestion — the form itself
         *  offers a "สำหรับใคร" picker to change who it's for. Hidden for Viewer. */}
        {canManageFor(primaryElderId) ? (
          <AppButton
            label="จองนัดหมาย"
            phosphorIcon={ArrowRightIcon}
            iconPosition="trailing"
            style={styles.bookingButton}
            onPress={() => router.push({ pathname: '/appointment-form', params: { memberId: primaryElderId } })}
          />
        ) : null}
      </View>

      {nextAppointment ? (
        <>
          <SectionHeader title="นัดหมายของคุณ" actionLabel="ดูทั้งหมด" onActionPress={() => router.push('/calendar')} />
          <AppointmentSpotlightCard
            appointment={nextAppointment}
            memberName={nextAppointmentMemberName}
            onPress={() => router.push({ pathname: '/appointment-detail', params: { id: nextAppointment.id } })}
            onMessagePress={() => router.push('/messages')}
          />
        </>
      ) : null}

      <SectionHeader title="สมาชิกในบ้านวันนี้" count={familyMembers.length} />
      {visibleMembers.length === 0 ? (
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            ไม่พบสมาชิกที่ตรงกับ &quot;{search}&quot;
          </ThemedText>
        </Card>
      ) : (
        <MemberAvatarStrip
          members={visibleMembers}
          onSelect={(member) => {
            setSelectedMemberId(member.id);
            router.push('/family-member');
          }}
        />
      )}

      {medicationRows.length > 0 ? (
        <>
          <SectionHeader title="ยาวันนี้ · รวมของฉัน" />
          <View style={styles.list}>
            {medicationRows.map(({ member, med, takenToday, title }) => (
              <Pressable
                key={med.id}
                onPress={canEdit ? () => router.push({ pathname: '/medication-confirm', params: { id: med.id } }) : undefined}
                disabled={!canEdit}
                accessibilityRole="button"
                accessibilityLabel={`${title} — ${med.name} — ${takenToday ? 'ยืนยันแล้ว' : 'รอยืนยัน'}`}
                accessibilityState={{ disabled: !canEdit }}
                style={({ pressed }) => [!canEdit && styles.readOnly, pressed && canEdit && styles.pressed]}>
                <Card gap={Spacing.three} style={styles.medRow}>
                  <View
                    style={[
                      styles.medChip,
                      { backgroundColor: takenToday ? theme.successSoft : theme.warningSoft },
                    ]}>
                    {takenToday ? (
                      <CheckCircleIcon weight="fill" size={22} color={theme.successText} />
                    ) : (
                      <PillIcon weight="duotone" size={22} color={theme.warningText} />
                    )}
                  </View>
                  <View style={styles.medBody}>
                    <ThemedText type="smallBold">{title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {med.name} {med.dosage} · {takenToday ? 'ยืนยันพร้อมรูปแล้ว' : 'รอถ่ายภาพยืนยัน'}
                    </ThemedText>
                  </View>
                  <ThemedText
                    type="caption"
                    style={{ color: takenToday ? theme.successText : theme.warningText, fontWeight: '700' }}>
                    {takenToday ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                  </ThemedText>
                </Card>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="งานอื่นวันนี้" />
      <View style={styles.list}>
        {tasks.map((task) => {
          const isDone = task.status === 'done';
          const meta = TaskStatusMeta[task.status];
          const TaskIcon = taskIcons[task.relatedType];
          return (
            <Pressable
              key={task.id}
              onPress={
                canEdit
                  ? () => {
                      updateTaskStatus(task.id, isDone ? 'pending' : 'done').catch((err) => {
                        const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
                        Alert.alert('อัปเดตงานไม่สำเร็จ', message);
                      });
                    }
                  : undefined
              }
              disabled={!canEdit}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isDone, disabled: !canEdit }}
              accessibilityLabel={`${task.title} — ${meta.label}`}
              accessibilityHint={canEdit ? 'แตะเพื่อสลับสถานะงาน' : 'ดูได้เท่านั้น'}
              style={({ pressed }) => [!canEdit && styles.readOnly, pressed && canEdit && styles.pressed]}>
              <Card gap={Spacing.three} style={styles.taskCard}>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isDone ? theme.success : theme.borderStrong,
                      backgroundColor: isDone ? theme.success : 'transparent',
                    },
                  ]}>
                  {isDone ? <CheckIcon weight="bold" size={14} color={theme.onPrimary} /> : null}
                </View>

                <View style={styles.taskBody}>
                  <View style={styles.taskTitleRow}>
                    <TaskIcon weight="duotone" size={16} color={isDone ? theme.textMuted : theme.textSecondary} />
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

      {/* Owner-only tools — role management and the household's real
       *  activity log, both gated again inside their own screens. Invites,
       *  add-member, member stat tiles and the attention list now live on
       *  the "ครอบครัว" tab instead (see family.tsx) — moved, not deleted,
       *  to keep Home's top-of-scroll matching the reference design. */}
      {currentRole === 'Owner' ? (
        <View style={styles.quickRow}>
          <AppButton
            label="สิทธิ์การเข้าถึง"
            phosphorIcon={ShieldCheckIcon}
            variant="secondary"
            style={styles.quickHalf}
            onPress={() => router.push('/household-access')}
          />
          <AppButton
            label="บันทึกการใช้งาน"
            phosphorIcon={ListChecksIcon}
            variant="secondary"
            style={styles.quickHalf}
            onPress={() => router.push('/audit-log')}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bookingStrip: {
    marginTop: -Spacing.four,
    borderRadius: Radius.lg,
    padding: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  bookingTile: {
    width: 92,
    height: 64,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  bookingButton: { flex: 1 },

  list: { gap: Spacing.two },
  quickRow: { flexDirection: 'row', gap: Spacing.two },
  quickHalf: { flex: 1 },

  medRow: { flexDirection: 'row', alignItems: 'center' },
  medChip: { width: 44, height: 44, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  medBody: { flex: 1, gap: 2 },

  taskCard: { flexDirection: 'row', alignItems: 'center' },
  taskBody: { flex: 1, gap: Spacing.half },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  taskDone: { textDecorationLine: 'line-through' },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  // Viewer role — matches the reference design's gated-control treatment
  // (opacity .45; `disabled` + `accessibilityState` cover the "not-allowed"
  // part, per the handoff's own RN translation note).
  readOnly: { opacity: 0.45 },
});
