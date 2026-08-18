import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  CalendarPlusIcon,
  CheckCircleIcon,
  EnvelopeOpenIcon,
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
import { daysFromToday, relativeDayLabel } from '@/utils/date';

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

/** Assembled from real signals already in `family-context.tsx` (attention
 *  status, pending invites, appointments within the next 2 days) — not a
 *  separate notifications feed/backend, since the app doesn't have one. */
export default function NoticesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { familyMembers, pendingInvites, appointments, setSelectedMemberId } = useFamilyContext();

  const notices = useMemo<Notice[]>(() => {
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

    return [...attentionNotices, ...inviteNotices, ...soonAppointments];
  }, [familyMembers, pendingInvites, appointments, router, setSelectedMemberId]);

  const toneColor: Record<BadgeTone, { chipBg: string; ink: string }> = {
    neutral: { chipBg: theme.surfaceSunken, ink: theme.textSecondary },
    primary: { chipBg: theme.primarySoft, ink: theme.primaryText },
    success: { chipBg: theme.successSoft, ink: theme.successText },
    warning: { chipBg: theme.warningSoft, ink: theme.warningText },
    danger: { chipBg: theme.dangerSoft, ink: theme.dangerText },
  };

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
