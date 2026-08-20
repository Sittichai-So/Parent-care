import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  CalendarPlusIcon,
  ChatTeardropDotsIcon,
  CheckCircleIcon,
  EnvelopeOpenIcon,
  InfoIcon,
  ListChecksIcon,
  PillIcon,
  WarningCircleIcon,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ReadOnlyBanner } from '@/components/ui/read-only-banner';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import type { BadgeTone } from '@/components/ui/status-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import type { NotificationType } from '@/services/notifications-inbox-api';
import { daysFromToday, relativeDayLabel } from '@/utils/date';
import { chipToneColors } from '@/utils/tone-colors';

/** Icon + tone per server notification type — the medicine/appointment
 *  due-time reminders and chat pings that come from the account's real
 *  notification inbox (`family-context.tsx#notifications`), alongside the
 *  client-derived categories below. */
const SERVER_NOTICE_META: Record<NotificationType, { icon: PhosphorIcon; tone: BadgeTone }> = {
  MEDICINE: { icon: PillIcon, tone: 'warning' },
  APPOINTMENT: { icon: CalendarPlusIcon, tone: 'primary' },
  MESSAGE: { icon: ChatTeardropDotsIcon, tone: 'primary' },
  EMERGENCY: { icon: WarningCircleIcon, tone: 'danger' },
  TASK: { icon: ListChecksIcon, tone: 'primary' },
  VITALS: { icon: ListChecksIcon, tone: 'neutral' },
  SYSTEM: { icon: InfoIcon, tone: 'neutral' },
};

type Notice = {
  id: string;
  title: string;
  detail: string;
  /** When this fires naturally from real data (e.g. an upcoming appointment's
   *  own date) — omitted rather than faked for notice kinds with no genuine
   *  "when" in the data model (member status, pending invites). */
  time?: string;
  icon: PhosphorIcon;
  tone: BadgeTone;
  onPress?: () => void;
};

/** Assembled from two sources: the account's real server-side notification
 *  inbox (medicine/appointment due-time reminders, chat pings, emergency —
 *  see `family-context.tsx#notifications`) plus signals derived client-side
 *  from data already in context (member attention status, pending invites,
 *  appointments within the next 2 days) that have no equivalent inbox row. */
export default function NoticesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { familyMembers, pendingInvites, appointments, notifications, markNotificationRead, setSelectedMemberId } =
    useFamilyContext();

  const notices = useMemo<Notice[]>(() => {
    const serverNotices: Notice[] = notifications.map((item) => {
      const meta = SERVER_NOTICE_META[item.type];
      const openTarget = () => {
        if (!item.isRead) markNotificationRead(item._id).catch(() => {});
        // `notifications` is already scoped to the currently selected
        // household (see family-context.tsx#householdNotifications), so
        // every id below is guaranteed to belong to it — no household
        // switch needed to find the record.
        if (item.type === 'MEDICINE' && item.data.medicineId) {
          router.push({ pathname: '/medication-confirm', params: { id: item.data.medicineId } });
        } else if (item.type === 'APPOINTMENT' && item.data.appointmentId) {
          router.push({ pathname: '/appointment-detail', params: { id: item.data.appointmentId } });
        } else if (item.type === 'MESSAGE') {
          router.push('/messages');
        } else if (item.type === 'EMERGENCY') {
          router.push('/emergency');
        }
      };
      return {
        id: `notif-${item._id}`,
        title: item.title,
        detail: item.message,
        time: new Date(item.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        icon: meta.icon,
        tone: meta.tone,
        onPress: openTarget,
      };
    });

    const attentionNotices: Notice[] = familyMembers
      .filter((member) => member.status !== 'normal')
      .map((member) => ({
        id: `member-${member.id}`,
        title: `${member.name} ต้องติดตาม`,
        detail: member.detail,
        icon: WarningCircleIcon,
        tone: member.status === 'urgent' ? 'danger' : 'warning',
        onPress: () => {
          setSelectedMemberId(member.id);
          router.push('/family-member');
        },
      }));

    const inviteNotices: Notice[] = pendingInvites.map((invite) => ({
      id: `invite-${invite.membershipId}`,
      title: `คำขอเข้าร่วม ${invite.householdName}`,
      detail: `บทบาท ${invite.role} · รอการตอบรับ`,
      icon: EnvelopeOpenIcon,
      tone: 'primary',
      onPress: () => router.push('/'),
    }));

    const soonAppointments: Notice[] = appointments
      .filter((apt) => {
        const days = daysFromToday(apt.date);
        return days >= 0 && days <= 2;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .map((apt) => ({
        id: `apt-${apt.id}`,
        title: apt.title,
        detail: `${relativeDayLabel(apt.date)} ${apt.time} น. · ${apt.hospital}`,
        time: relativeDayLabel(apt.date),
        icon: CalendarPlusIcon,
        tone: 'primary',
        onPress: () => router.push({ pathname: '/appointment-detail', params: { id: apt.id } }),
      }));

    return [...serverNotices, ...attentionNotices, ...inviteNotices, ...soonAppointments];
  }, [notifications, familyMembers, pendingInvites, appointments, router, setSelectedMemberId, markNotificationRead]);

  const toneColor = chipToneColors(theme);

  return (
    <Screen gap={Spacing.three}>
      <ScreenHeader title="การแจ้งเตือน" subtitle={notices.length > 0 ? `${notices.length} รายการใหม่` : undefined} />

      <ReadOnlyBanner />

      {notices.length === 0 ? (
        <Card tone="success" accented elevation="flat" gap={Spacing.two}>
          <View style={styles.okRow}>
            <CheckCircleIcon weight="fill" size={18} color={theme.success} />
            <ThemedText type="small" style={{ color: theme.successText }}>
              ไม่มีการแจ้งเตือนใหม่ ทุกอย่างเรียบร้อยดี
            </ThemedText>
          </View>
        </Card>
      ) : (
        <View style={styles.list}>
          {notices.map((notice) => {
            const colors = toneColor[notice.tone];
            const NoticeIcon = notice.icon;
            return (
              <Pressable
                key={notice.id}
                onPress={notice.onPress}
                disabled={!notice.onPress}
                accessibilityRole={notice.onPress ? 'button' : undefined}
                accessibilityLabel={`${notice.title} — ${notice.detail}`}
                style={({ pressed }) => pressed && styles.pressed}>
                <Card gap={Spacing.three} style={styles.row}>
                  <View style={[styles.chip, { backgroundColor: colors.chipBg }]}>
                    <NoticeIcon weight="duotone" size={20} color={colors.ink} />
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.rowHead}>
                      <ThemedText type="smallBold" style={styles.rowTitle} numberOfLines={1}>
                        {notice.title}
                      </ThemedText>
                      {notice.time ? (
                        <ThemedText type="caption" themeColor="textMuted" style={styles.rowTime}>
                          {notice.time}
                        </ThemedText>
                      ) : null}
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {notice.detail}
                    </ThemedText>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  chip: { width: 44, height: 44, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  rowBody: { flex: 1, gap: Spacing.half },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.two },
  rowTitle: { flex: 1 },
  rowTime: { flexShrink: 0 },
  okRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
