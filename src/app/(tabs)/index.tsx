import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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
import { DisplayStatusPriority, TaskStatusMeta } from '@/constants/status';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext, type FamilyTask, type Medication } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, isToday } from '@/utils/date';
import { isAttention, memberDisplayStatus } from '@/utils/member-status';

const taskIcons: Record<FamilyTask['relatedType'], PhosphorIcon> = {
  checkin: CheckCircleIcon,
  medication: PillIcon,
  appointment: CalendarPlusIcon,
  vitals: ListChecksIcon,
  custom: CheckIcon,
};

const gatedPressableStyle = (
  canEdit: boolean,
  pressed: boolean,
  ...extra: (StyleProp<ViewStyle> | false | undefined)[]
): StyleProp<ViewStyle> => [...extra, !canEdit && styles.readOnly, pressed && canEdit && styles.pressed];

type MedicationRowProps = {
  title: string;
  med: Medication;
  takenToday: boolean;
  canEdit: boolean;
  onPress: () => void;
};

function MedicationRow({ title, med, takenToday, canEdit, onPress }: MedicationRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={canEdit ? onPress : undefined}
      disabled={!canEdit}
      accessibilityRole="button"
      accessibilityLabel={`${title} — ${med.name} — ${takenToday ? 'ยืนยันแล้ว' : 'รอยืนยัน'}`}
      accessibilityState={{ disabled: !canEdit }}
      style={({ pressed }) => gatedPressableStyle(canEdit, pressed)}>
      <Card gap={Spacing.three} style={styles.medRow}>
        <View style={[styles.medChip, { backgroundColor: takenToday ? theme.successSoft : theme.warningSoft }]}>
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
  );
}

type TaskRowProps = {
  task: FamilyTask;
  canEdit: boolean;
  onToggle: () => void;
};

function TaskRow({ task, canEdit, onToggle }: TaskRowProps) {
  const theme = useTheme();
  const isDone = task.status === 'done';
  const meta = TaskStatusMeta[task.status];
  const TaskIcon = taskIcons[task.relatedType];

  return (
    <Pressable
      onPress={canEdit ? onToggle : undefined}
      disabled={!canEdit}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isDone, disabled: !canEdit }}
      accessibilityLabel={`${task.title} — ${meta.label}`}
      accessibilityHint={canEdit ? 'แตะเพื่อสลับสถานะงาน' : 'ดูได้เท่านั้น'}
      style={({ pressed }) => gatedPressableStyle(canEdit, pressed)}>
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
            <ThemedText type="smallBold" style={isDone ? [styles.taskDone, { color: theme.textMuted }] : undefined}>
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
}

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
        (a, b) =>
          DisplayStatusPriority[memberDisplayStatus(a, medications)] -
            DisplayStatusPriority[memberDisplayStatus(b, medications)] || a.name.localeCompare(b.name)
      ),
    [familyMembers, medications]
  );

  const attentionMembers = sortedMembers.filter((member) => isAttention(member, medications));

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

      <View style={[styles.bookingStrip, { backgroundColor: theme.primarySoft }]}>
        <Pressable
          onPress={() => router.push('/calendar')}
          accessibilityRole="button"
          accessibilityLabel="ปฏิทินครอบครัว"
          style={({ pressed }) => [styles.bookingTile, { backgroundColor: theme.sky }, pressed && styles.pressed]}>
          <CalendarPlusIcon weight="duotone" size={30} color={theme.primaryText} />
        </Pressable>
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
            {medicationRows.map(({ med, takenToday, title }) => (
              <MedicationRow
                key={med.id}
                title={title}
                med={med}
                takenToday={takenToday}
                canEdit={canEdit}
                onPress={() => router.push({ pathname: '/medication-confirm', params: { id: med.id } })}
              />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="งานอื่นวันนี้" />
      <View style={styles.list}>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            canEdit={canEdit}
            onToggle={() => {
              const nextStatus = task.status === 'done' ? 'pending' : 'done';
              updateTaskStatus(task.id, nextStatus).catch((err) => {
                const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
                Alert.alert('อัปเดตงานไม่สำเร็จ', message);
              });
            }}
          />
        ))}
      </View>

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
  readOnly: { opacity: 0.45 },
});
