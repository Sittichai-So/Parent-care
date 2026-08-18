import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import {
  CalendarHeartIcon,
  CaretRightIcon,
  CheckCircleIcon,
  ChatTeardropDotsIcon,
  HandHeartIcon,
  PillIcon,
  SignOutIcon,
  SirenIcon,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { NotificationBanner } from '@/components/ui/notification-banner';
import { ReadOnlyBanner } from '@/components/ui/read-only-banner';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { VitalsSummary } from '@/components/ui/vitals-summary';
import { HitSize, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, isToday } from '@/utils/date';

type ElderAction = {
  label: string;
  detail: string;
  icon: PhosphorIcon;
  route: Href;
  /** `danger` — the reference design's distinct red "ต้องการความช่วยเหลือ"
   *  tile/border; every other action card is `primary`. */
  tone?: 'primary' | 'danger';
};

/** One row in "ตารางวันนี้" — tappable, so it doubles as the shortcut into
 *  the photo-confirm flow (medication) or the visit details (appointment). */
type ScheduleItem = {
  key: string;
  time: string;
  title: string;
  detail: string;
  done: boolean;
} & ({ kind: 'medication'; medicationId: string } | { kind: 'appointment'; appointmentId: string });

function getTodayLabel() {
  return new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ElderHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { medications, appointments, primaryElderId, currentMembershipId, currentRole, canEdit, checkIn } =
    useFamilyContext();

  // Mirrors the guard in (tabs)/index.tsx — a pure-Caregiver role has no
  // "explore" trigger in the tab bar, so bounce them back to their own screen.
  useEffect(() => {
    if (currentRole === 'Caregiver') {
      router.replace('/');
    }
  }, [currentRole, router]);

  // "Me" always means the *caller's own* membership in this household —
  // every member (Owner, Caregiver, Elder, Viewer) can track their own
  // medications/appointments here, separately from the family members they
  // manage from the "ผู้ดูแล" tab. Only fall back to `primaryElderId` if
  // the caller somehow has no membership id yet (e.g. mid-load).
  const selfMemberId = currentMembershipId ?? primaryElderId;

  const myMedications = useMemo(
    () => medications.filter((med) => med.memberId === selfMemberId && med.active),
    [medications, selfMemberId]
  );
  const nextAppointment = useMemo(
    () =>
      appointments
        .filter((apt) => apt.memberId === selfMemberId && daysFromToday(apt.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0],
    [appointments, selfMemberId]
  );

  /** Each active medication's daily schedule flattened into a single list, plus
   *  the next appointment if there is one — this is deliberately whole-day
   *  granularity (done if taken at all today), not per-slot, to match what the
   *  data model actually tracks. */
  const todaySchedule = useMemo<ScheduleItem[]>(() => {
    const medItems: ScheduleItem[] = myMedications.flatMap((med) =>
      med.schedule.map((time) => ({
        key: `${med.id}-${time}`,
        time,
        title: med.name,
        detail: med.dosage,
        done: med.lastTakenAt ? isToday(med.lastTakenAt.slice(0, 10)) : false,
        kind: 'medication',
        medicationId: med.id,
      }))
    );
    const items = [...medItems];
    if (nextAppointment && daysFromToday(nextAppointment.date) === 0) {
      items.push({
        key: nextAppointment.id,
        time: nextAppointment.time,
        title: `นัดหมาย: ${nextAppointment.title}`,
        detail: nextAppointment.hospital,
        done: false,
        kind: 'appointment',
        appointmentId: nextAppointment.id,
      });
    }
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [myMedications, nextAppointment]);

  const pendingCount = todaySchedule.filter((item) => !item.done).length;

  // Purely a this-session UI flag ("did I already tap the button"), not a
  // persisted server field — the same scope the reference design's own mock
  // check-in state has. `checkIn()` itself still calls the real API below.
  const [checkedIn, setCheckedIn] = useState(false);

  const elderActions: ElderAction[] = [
    {
      label: 'ยาของฉัน',
      detail: myMedications[0] ? `${myMedications[0].name} · ${myMedications[0].schedule[0] ?? ''}` : 'ดูและยืนยันการทานยา',
      icon: PillIcon,
      route: { pathname: '/medications', params: { memberId: selfMemberId } },
    },
    {
      label: 'นัดหมายของฉัน',
      detail: 'ดูวันตรวจและสถานที่',
      icon: CalendarHeartIcon,
      route: { pathname: '/appointments', params: { memberId: selfMemberId } },
    },
    { label: 'ข้อความครอบครัว', detail: 'คุยกับลูกและผู้ดูแล', icon: ChatTeardropDotsIcon, route: '/messages' },
    { label: 'ต้องการความช่วยเหลือ', detail: 'ส่งคำขอไปยังครอบครัว', icon: SirenIcon, route: '/emergency', tone: 'danger' },
  ];

  const handleCheckIn = () => {
    checkIn()
      .then(() => {
        setCheckedIn(true);
        Alert.alert('ส่งแล้ว', 'บอกครอบครัวแล้วว่าคุณสบายดีวันนี้');
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        Alert.alert('ส่งไม่สำเร็จ', message);
      });
  };

  // Mirrors the caregiver dashboard's confirm-then-logout flow — this
  // screen previously had no way out of the account at all.
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
    <Screen gap={Spacing.four}>
      <View style={styles.topRow}>
        <ThemedText type="caption" themeColor="textMuted">
          {getTodayLabel()}
        </ThemedText>
        <Pressable
          onPress={confirmLogout}
          accessibilityRole="button"
          accessibilityLabel="ออกจากระบบ"
          hitSlop={Spacing.two}
          style={({ pressed }) => [
            styles.logout,
            { backgroundColor: theme.surfaceSunken, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <SignOutIcon weight="bold" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <NotificationBanner />
      <ReadOnlyBanner />

      {/* Hero — greeting, today's status and the single most important
       *  action (check-in) folded into one card, per the reference design's
       *  "Elder home" screen, instead of a separate status banner. */}
      <Card elevation="floating" padding={Spacing.five} gap={Spacing.three} style={styles.heroCard}>
        <ThemedText type="display" style={styles.heroGreeting} accessibilityRole="header">
          สวัสดีค่ะ {user?.name ?? 'คุณแม่'}
        </ThemedText>
        <ThemedText style={[styles.heroStatus, { color: pendingCount === 0 ? theme.successText : theme.textSecondary }]}>
          {pendingCount === 0 ? 'ทำครบทุกอย่างวันนี้แล้ว เยี่ยมมาก!' : `เหลืออีก ${pendingCount} รายการที่ต้องทำวันนี้`}
        </ThemedText>
        <Pressable
          onPress={handleCheckIn}
          disabled={checkedIn || !canEdit}
          accessibilityRole="button"
          accessibilityLabel="ฉันสบายดี บอกครอบครัวว่าอยู่ดี"
          style={({ pressed }) => [
            styles.heroButton,
            { backgroundColor: checkedIn ? theme.success : theme.primary },
            !canEdit && styles.readOnly,
            pressed && styles.pressed,
          ]}>
          {checkedIn ? (
            <CheckCircleIcon weight="fill" size={26} color={theme.onPrimary} />
          ) : (
            <HandHeartIcon weight="fill" size={26} color={theme.onPrimary} />
          )}
          <ThemedText style={[styles.heroButtonLabel, { color: theme.onPrimary }]}>
            {checkedIn ? 'เช็กอินแล้ววันนี้' : 'ฉันสบายดี'}
          </ThemedText>
        </Pressable>
      </Card>

      <SectionHeader title="สิ่งที่ทำได้" />
      <View style={styles.actions}>
        {elderActions.map((action) => {
          const ActionIcon = action.icon;
          const isDanger = action.tone === 'danger';
          return (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.route)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityHint={action.detail}
              style={({ pressed }) => pressed && styles.pressed}>
              <Card
                tone={isDanger ? 'danger' : 'surface'}
                accented
                gap={Spacing.three}
                padding={Spacing.four}
                style={[styles.actionCard, !isDanger && { borderColor: theme.backgroundSelected }]}>
                <View
                  style={[styles.actionIconWrap, { backgroundColor: isDanger ? theme.dangerSoft : theme.primarySoft }]}>
                  <ActionIcon weight="duotone" size={32} color={isDanger ? theme.danger : theme.primaryText} />
                </View>
                <View style={styles.actionText}>
                  <ThemedText style={[styles.actionLabel, isDanger && { color: theme.dangerText }]}>
                    {action.label}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {action.detail}
                  </ThemedText>
                </View>
                <CaretRightIcon weight="bold" size={20} color={theme.textMuted} />
              </Card>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="ตารางวันนี้" />
      {todaySchedule.length === 0 ? (
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            วันนี้ไม่มีรายการยาหรือนัดหมาย
          </ThemedText>
        </Card>
      ) : (
        <Card gap={0} padding={Spacing.three}>
          {todaySchedule.map((item, index) => (
            <Pressable
              key={item.key}
              onPress={() => {
                if (item.kind === 'medication') {
                  router.push({ pathname: '/medication-confirm', params: { id: item.medicationId } });
                } else {
                  router.push({ pathname: '/appointment-detail', params: { id: item.appointmentId } });
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`${item.title} เวลา ${item.time} ${item.done ? 'ทำแล้ว' : 'ยังไม่ทำ'}`}
              accessibilityHint={item.kind === 'medication' ? 'เปิดหน้าถ่ายรูปและยืนยันการทานยา' : 'ดูรายละเอียดนัดหมาย'}
              style={({ pressed }) => pressed && styles.pressed}>
              <View
                style={[
                  styles.scheduleRow,
                  index < todaySchedule.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}>
                <ThemedText style={[styles.scheduleTime, { color: theme.textSecondary }]}>{item.time}</ThemedText>
                <View style={styles.scheduleBody}>
                  <ThemedText style={styles.scheduleTitle}>{item.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.detail}
                  </ThemedText>
                </View>
                <StatusBadge label={item.done ? 'ทำแล้ว' : 'ยังไม่ทำ'} tone={item.done ? 'success' : 'neutral'} />
              </View>
            </Pressable>
          ))}
        </Card>
      )}

      <SectionHeader title="สุขภาพของฉัน" />
      <VitalsSummary memberId={selfMemberId} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  logout: {
    width: HitSize.medium,
    height: HitSize.medium,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroCard: { alignItems: 'center' },
  heroGreeting: { textAlign: 'center' },
  heroStatus: { fontSize: 17, lineHeight: 24, fontWeight: '500', textAlign: 'center' },
  heroButton: {
    width: '100%',
    minHeight: HitSize.xlarge,
    borderRadius: Radius.lg,
    marginTop: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  heroButtonLabel: { fontSize: 19, lineHeight: 26, fontWeight: '700' },

  actions: { gap: Spacing.two },
  actionCard: { flexDirection: 'row', alignItems: 'center', minHeight: 92 },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { flex: 1, gap: Spacing.half },
  actionLabel: { fontSize: 20, lineHeight: 27, fontWeight: '800' },

  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  scheduleTime: { fontSize: 15, lineHeight: 22, fontWeight: '800', width: 52 },
  scheduleBody: { flex: 1, gap: Spacing.half },
  scheduleTitle: { fontSize: 17, lineHeight: 24, fontWeight: '700' },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  readOnly: { opacity: 0.45 },
});
