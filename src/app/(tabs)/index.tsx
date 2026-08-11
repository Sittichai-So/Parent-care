import { useEffect, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { MemberStatusMeta, StatusPriority, TaskStatusMeta } from '@/constants/status';
import { HitSize, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext, type FamilyEvent, type FamilyTask } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

const timelineIcons: Record<FamilyEvent['type'], string> = {
  'check-in': '✓',
  medication: '💊',
  task: '👥',
  appointment: '🏥',
  vitals: '📋',
  emergency: '🆘',
};

const taskIcons: Record<FamilyTask['relatedType'], string> = {
  checkin: '✓',
  medication: '💊',
  appointment: '🏥',
  vitals: '📋',
  custom: '•',
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
    currentHousehold,
    currentRole,
    pendingInvites,
    setSelectedMemberId,
    updateTaskStatus,
    checkIn,
    acceptInvite,
    declineInvite,
  } = useFamilyContext();

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
      {/* Hero — who you are, and the one number that matters today. */}
      <Card
        tone="surface"
        elevation="floating"
        padding={Spacing.four}
        gap={Spacing.three}
        style={{ backgroundColor: theme.hero, borderColor: theme.hero }}>
        <View style={styles.heroTop}>
          <View style={styles.heroGreeting}>
            <ThemedText type="caption" style={{ color: theme.heroTextMuted }}>
              {greetingForNow().toUpperCase()}
            </ThemedText>
            <ThemedText type="display" style={{ color: theme.heroText }} numberOfLines={1}>
              {user?.name ?? 'คุณ'}
            </ThemedText>
          </View>

          <Pressable
            onPress={confirmLogout}
            accessibilityRole="button"
            accessibilityLabel="ออกจากระบบ"
            hitSlop={Spacing.two}
            style={({ pressed }) => [
              styles.logout,
              { backgroundColor: theme.heroSurface },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="caption" style={{ color: theme.heroText }}>
              ออกจากระบบ
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText type="small" style={{ color: theme.heroTextMuted }}>
          {attentionMembers.length > 0
            ? `วันนี้มี ${attentionMembers.length} คนที่ควรตรวจสอบ และ ${openTasks.length} งานที่ยังไม่เสร็จ`
            : 'วันนี้ทุกคนในบ้านสถานะปกติดี ไม่มีเรื่องเร่งด่วน'}
        </ThemedText>

        <View style={[styles.heroFooter, { borderTopColor: theme.heroSurface }]}>
          <ThemedText type="caption" style={{ color: theme.heroTextMuted }}>
            Check-in ล่าสุด 08:32 น.
          </ThemedText>
        </View>
      </Card>

      {pendingInvites.length > 0 ? (
        <Card tone="primary" accented elevation="flat" gap={Spacing.two}>
          <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
            📨 มีคำขอเข้าร่วมกลุ่มรออยู่
          </ThemedText>
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
            <ThemedText style={styles.alertIcon}>⚠️</ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.warningText }}>
              ต้องติดตามก่อน
            </ThemedText>
          </View>
          {attentionMembers.map((member) => (
            <ThemedText key={member.id} type="small" style={{ color: theme.warningText }}>
              • {member.name} — {member.detail}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      <SectionHeader title="สมาชิกในบ้าน" count={familyMembers.length} />
      <View style={styles.list}>
        {sortedMembers.map((member) => {
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

                <ThemedText style={[styles.chevron, { color: theme.textMuted }]}>›</ThemedText>
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
                  <ThemedText style={styles.checkGlyph}>{isDone ? '✓' : ''}</ThemedText>
                </View>

                <View style={styles.taskBody}>
                  <ThemedText
                    type="smallBold"
                    style={isDone ? [styles.taskDone, { color: theme.textMuted }] : undefined}>
                    {taskIcons[task.relatedType]} {task.title}
                  </ThemedText>
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
          icon="✓"
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
          <AppButton label="นัดหมาย" icon="📅" variant="secondary" style={styles.quickHalf} onPress={() => router.push('/appointments')} />
          <AppButton label="รายการยา" icon="💊" variant="secondary" style={styles.quickHalf} onPress={() => router.push('/medications')} />
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
                  <ThemedText style={[styles.timelineIcon, { color: theme.primaryText }]}>
                    {timelineIcons[item.type]}
                  </ThemedText>
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
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  heroGreeting: { flex: 1, gap: Spacing.half },
  logout: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  heroFooter: { borderTopWidth: 1, paddingTop: Spacing.two },
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
  alertIcon: { fontSize: 16, lineHeight: 22 },

  list: { gap: Spacing.two },
  quickRow: { flexDirection: 'row', gap: Spacing.two },
  quickHalf: { flex: 1 },

  memberCard: { flexDirection: 'row', alignItems: 'center' },
  memberBody: { flex: 1, gap: Spacing.one + 2 },
  memberHead: { gap: 1 },
  memberName: { fontSize: 16, lineHeight: 22 },
  memberBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chevron: { fontSize: 26, lineHeight: 30, fontWeight: '600' },

  taskCard: { flexDirection: 'row', alignItems: 'center' },
  taskBody: { flex: 1, gap: Spacing.half },
  taskDone: { textDecorationLine: 'line-through' },
  checkbox: {
    width: HitSize.small - 12,
    height: HitSize.small - 12,
    borderRadius: Radius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkGlyph: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, fontWeight: '800' },

  timelineRow: { flexDirection: 'row', gap: Spacing.three },
  timelineRail: { alignItems: 'center', width: 32 },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIcon: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  timelineLine: { width: 2, flex: 1, marginVertical: Spacing.one },
  timelineBody: { flex: 1, gap: Spacing.half, paddingBottom: Spacing.three },
  timelineBodyLast: { paddingBottom: 0 },
  timelineHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  timelineTitle: { flex: 1 },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
