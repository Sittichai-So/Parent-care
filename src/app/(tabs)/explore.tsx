import { useEffect, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import type { IconName } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { NotificationBanner } from '@/components/ui/notification-banner';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { VitalsSummary } from '@/components/ui/vitals-summary';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, isToday } from '@/utils/date';

type ElderAction = {
  label: string;
  detail: string;
  icon: IconName;
  route: Href;
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
  const { user } = useAuth();
  const { medications, appointments, primaryElderId, currentMembershipId, currentRole, checkIn } =
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

  const elderActions: ElderAction[] = [
    { label: 'ยาของฉัน', detail: 'ดูและยืนยันการทานยา', icon: 'medical-outline', route: { pathname: '/medications', params: { memberId: selfMemberId } } },
    { label: 'นัดหมาย', detail: 'ดูวันตรวจและสถานที่', icon: 'calendar-outline', route: { pathname: '/appointments', params: { memberId: selfMemberId } } },
    { label: 'บันทึกสุขภาพ', detail: 'บันทึกความดัน น้ำตาล หรือน้ำหนัก', icon: 'clipboard-outline', route: { pathname: '/vitals-form', params: { memberId: selfMemberId } } },
  ];

  const handleCheckIn = () => {
    checkIn()
      .then(() => Alert.alert('ส่งแล้ว', 'บอกครอบครัวแล้วว่าคุณสบายดีวันนี้'))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        Alert.alert('ส่งไม่สำเร็จ', message);
      });
  };

  return (
    <Screen gap={Spacing.four}>
      <View style={styles.greeting}>
        <ThemedText type="caption" themeColor="textMuted">
          {getTodayLabel()}
        </ThemedText>
        <ThemedText type="display" accessibilityRole="header">
          สวัสดีค่ะ {user?.name ?? 'คุณแม่'}
        </ThemedText>
      </View>

      <NotificationBanner />

      <Card tone="success" accented elevation="raised" padding={Spacing.four} gap={Spacing.two}>
        <Ionicons name="checkmark-circle" size={34} color={theme.success} />
        <ThemedText style={[styles.statusTitle, { color: theme.successText }]}>วันนี้ปกติดี</ThemedText>
        <ThemedText style={[styles.statusBody, { color: theme.successText }]}>
          {pendingCount > 0 ? `เหลืออีก ${pendingCount} รายการที่ต้องทำวันนี้` : 'ทำครบทุกอย่างวันนี้แล้ว เยี่ยมมาก!'}
        </ThemedText>
      </Card>

      <Pressable
        onPress={handleCheckIn}
        accessibilityRole="button"
        accessibilityLabel="ฉันสบายดี บอกครอบครัวว่าอยู่ดี"
        style={({ pressed }) => pressed && styles.pressed}>
        <Card gap={Spacing.two} padding={Spacing.four} style={styles.checkinCard}>
          <View style={[styles.actionIconWrap, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="hand-left-outline" size={26} color={theme.primaryText} />
          </View>
          <View style={styles.actionText}>
            <ThemedText style={styles.actionLabel}>ฉันสบายดี</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              บอกครอบครัวว่าวันนี้ปกติดี
            </ThemedText>
          </View>
        </Card>
      </Pressable>

      <SectionHeader title="สิ่งที่ทำได้" />
      <View style={styles.actions}>
        {elderActions.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.route)}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            accessibilityHint={action.detail}
            style={({ pressed }) => pressed && styles.pressed}>
            <Card gap={Spacing.three} padding={Spacing.four} style={styles.actionCard}>
              <View style={[styles.actionIconWrap, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name={action.icon} size={26} color={theme.primaryText} />
              </View>
              <View style={styles.actionText}>
                <ThemedText style={styles.actionLabel}>{action.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {action.detail}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward-outline" size={24} color={theme.textMuted} />
            </Card>
          </Pressable>
        ))}
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

      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      <Card tone="danger" accented elevation="flat" padding={Spacing.four} gap={Spacing.three}>
        <ThemedText style={[styles.helpTitle, { color: theme.dangerText }]}>ต้องการความช่วยเหลือ?</ThemedText>
        <ThemedText type="small" style={{ color: theme.dangerText }}>
          กดปุ่มนี้เพื่อแจ้งครอบครัวทันที
        </ThemedText>
        <AppButton
          label="ขอความช่วยเหลือ"
          icon="alert-circle-outline"
          variant="danger"
          size="xlarge"
          onPress={() => router.push('/emergency')}
          accessibilityHint="เปิดหน้ายืนยันการขอความช่วยเหลือจากครอบครัว"
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: Spacing.half },

  statusTitle: { fontSize: 24, lineHeight: 32, fontWeight: '800' },
  statusBody: { fontSize: 16, lineHeight: 24, fontWeight: '500' },

  checkinCard: { flexDirection: 'row', alignItems: 'center', minHeight: 88 },
  actions: { gap: Spacing.two },
  actionCard: { flexDirection: 'row', alignItems: 'center', minHeight: 88 },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { flex: 1, gap: Spacing.half },
  actionLabel: { fontSize: 19, lineHeight: 26, fontWeight: '700' },

  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  scheduleTime: { fontSize: 15, lineHeight: 22, fontWeight: '800', width: 52 },
  scheduleBody: { flex: 1, gap: Spacing.half },
  scheduleTitle: { fontSize: 17, lineHeight: 24, fontWeight: '700' },

  divider: { height: 1, marginTop: Spacing.two },
  helpTitle: { fontSize: 20, lineHeight: 28, fontWeight: '800' },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
