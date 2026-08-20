import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { CaretRightIcon, EnvelopeOpenIcon, WarningCircleIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Card, type CardTone } from '@/components/ui/card';
import { MedicalHeader } from '@/components/ui/medical-header';
import { ReadOnlyBanner } from '@/components/ui/read-only-banner';
import { Screen } from '@/components/ui/screen';
import { SearchPill } from '@/components/ui/search-pill';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { MemberStatusMeta, StatusPriority } from '@/constants/status';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext, type PendingInvite } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

const STATUS_TONE: Record<'normal' | 'monitor' | 'urgent', CardTone> = {
  normal: 'surface',
  monitor: 'warning',
  urgent: 'danger',
};

// Shared by every Viewer-gated Pressable on this screen (the invite
// accept/decline buttons, "+ เพิ่มสมาชิกเข้ากลุ่ม") — same dim-when-read-only,
// no-press-feedback-when-disabled treatment each time.
const gatedPressableStyle = (
  canEdit: boolean,
  pressed: boolean,
  ...extra: (StyleProp<ViewStyle> | false | undefined)[]
): StyleProp<ViewStyle> => [...extra, !canEdit && styles.readOnly, pressed && canEdit && styles.pressed];

type PendingInviteRowProps = {
  invite: PendingInvite;
  canEdit: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

function PendingInviteRow({ invite, canEdit, onAccept, onDecline }: PendingInviteRowProps) {
  const theme = useTheme();
  return (
    <View style={styles.inviteRow}>
      <View style={styles.inviteBody}>
        <ThemedText type="small" style={{ color: theme.primaryText }}>
          {invite.householdName} · {invite.role}
        </ThemedText>
      </View>
      <View style={styles.inviteActions}>
        <Pressable
          onPress={canEdit ? onDecline : undefined}
          disabled={!canEdit}
          accessibilityRole="button"
          accessibilityLabel={`ปฏิเสธคำขอเข้าร่วม ${invite.householdName}`}
          accessibilityState={{ disabled: !canEdit }}
          style={({ pressed }) => gatedPressableStyle(canEdit, pressed, styles.inviteDecline, { borderColor: theme.border })}>
          <ThemedText type="caption">ปฏิเสธ</ThemedText>
        </Pressable>
        <Pressable
          onPress={canEdit ? onAccept : undefined}
          disabled={!canEdit}
          accessibilityRole="button"
          accessibilityLabel={`ยอมรับคำขอเข้าร่วม ${invite.householdName}`}
          accessibilityState={{ disabled: !canEdit }}
          style={({ pressed }) => gatedPressableStyle(canEdit, pressed, styles.inviteAccept, { backgroundColor: theme.primary })}>
          <ThemedText type="caption" style={{ color: theme.onPrimary, fontWeight: '700' }}>
            ยอมรับ
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

export default function FamilyScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { logout } = useAuth();
  const {
    familyMembers,
    currentHousehold,
    pendingInvites,
    notifications,
    canEdit,
    setSelectedMemberId,
    acceptInvite,
    declineInvite,
  } = useFamilyContext();

  const [search, setSearch] = useState('');

  const sortedMembers = useMemo(
    () =>
      [...familyMembers].sort(
        (a, b) => StatusPriority[a.status] - StatusPriority[b.status] || a.name.localeCompare(b.name)
      ),
    [familyMembers]
  );

  const normalCount = familyMembers.filter((member) => member.status === 'normal').length;
  const attentionMembers = sortedMembers.filter((member) => member.status !== 'normal');
  // Matches (tabs)/index.tsx's bell badge exactly — MESSAGE is excluded
  // since that has its own badge on the chat icon elsewhere.
  const unreadNoticeCount = useMemo(
    () => notifications.filter((item) => item.type !== 'MESSAGE' && !item.isRead).length,
    [notifications]
  );

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedMembers;
    return sortedMembers.filter(
      (member) => member.name.toLowerCase().includes(query) || member.relation.toLowerCase().includes(query)
    );
  }, [sortedMembers, search]);

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
      { text: 'ออกจากระบบ', style: 'destructive', onPress: () => { logout(); router.replace('/login'); } },
    ]);
  };

  return (
    <Screen
      header={
        <MedicalHeader
          title="ครอบครัว"
          subtitle={currentHousehold ? currentHousehold.name : 'ยังไม่ได้เลือกกลุ่มครอบครัว'}
          notificationCount={attentionMembers.length + pendingInvites.length + unreadNoticeCount}
          onNotificationPress={() => router.push('/notices')}
          onLogoutPress={confirmLogout}>
          <SearchPill
            value={search}
            onChangeText={setSearch}
            placeholder="ค้นหาสมาชิกในบ้าน..."
            accessibilityLabel="ค้นหาสมาชิกในบ้าน"
          />
        </MedicalHeader>
      }>
      <ReadOnlyBanner />

      <View style={styles.statRow}>
        <StatTile value={normalCount} label="ปกติดี" tone="success" />
        <StatTile value={attentionMembers.length} label="ต้องติดตาม" tone="warning" />
        <StatTile value={familyMembers.length} label="ทั้งหมด" tone="primary" />
      </View>

      {pendingInvites.length > 0 ? (
        <Card tone="primary" accented elevation="flat" gap={Spacing.two}>
          <View style={styles.alertHead}>
            <EnvelopeOpenIcon weight="duotone" size={18} color={theme.primaryText} />
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
              มีคำขอเข้าร่วมกลุ่มรออยู่
            </ThemedText>
          </View>
          {pendingInvites.map((invite) => (
            <PendingInviteRow
              key={invite.membershipId}
              invite={invite}
              canEdit={canEdit}
              onAccept={() => handleAcceptInvite(invite.householdId, invite.membershipId, invite.householdName)}
              onDecline={() => handleDeclineInvite(invite.householdId, invite.membershipId)}
            />
          ))}
        </Card>
      ) : null}

      {currentHousehold ? (
        <Pressable
          onPress={canEdit ? () => router.push('/add-member') : undefined}
          disabled={!canEdit}
          accessibilityRole="button"
          accessibilityLabel={`${currentHousehold.name} เพิ่มสมาชิก`}
          accessibilityState={{ disabled: !canEdit }}
          accessibilityHint={canEdit ? 'เปิดหน้าเพิ่มสมาชิกเข้ากลุ่มครอบครัว' : 'ดูได้เท่านั้น'}
          style={({ pressed }) => gatedPressableStyle(canEdit, pressed)}>
          <Card tone="sunken" elevation="flat" gap={Spacing.half} style={styles.inviteCard}>
            <ThemedText type="caption" themeColor="textMuted">
              {currentHousehold.name}
            </ThemedText>
            <ThemedText type="smallBold">+ เพิ่มสมาชิกเข้ากลุ่ม</ThemedText>
          </Card>
        </Pressable>
      ) : null}

      {attentionMembers.length > 0 ? (
        <Card tone="warning" accented elevation="flat" gap={Spacing.two}>
          <View style={styles.alertHead}>
            <WarningCircleIcon weight="duotone" size={18} color={theme.warningText} />
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

      <SectionHeader title="สมาชิกทั้งหมด" count={familyMembers.length} />
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
                tone={STATUS_TONE[member.status]}
                gap={Spacing.three}
                style={styles.memberCard}>
                <Avatar name={member.name} size={64} shape="rounded" tone={status.tone} />

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
                    <StatusBadge label={status.label} tone={status.tone} phosphorIcon={status.icon} />
                    {!member.hasAccount ? <StatusBadge label="ไม่มีบัญชี" tone="neutral" /> : null}
                    {member.membershipState === 'pending' ? <StatusBadge label="รอการยืนยัน" tone="warning" /> : null}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                    {member.detail}
                  </ThemedText>
                </View>

                <CaretRightIcon weight="bold" size={20} color={theme.textMuted} />
              </Card>
            </Pressable>
          );
        })}
      </View>

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
  statRow: { flexDirection: 'row', gap: Spacing.two },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  inviteCard: { alignItems: 'flex-start' },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  inviteBody: { flex: 1 },
  inviteActions: { flexDirection: 'row', gap: Spacing.two },
  inviteDecline: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  inviteAccept: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  list: { gap: Spacing.two },
  memberCard: { flexDirection: 'row', alignItems: 'center' },
  memberBody: { flex: 1, gap: Spacing.one + 2 },
  memberHead: { gap: 1 },
  memberName: { fontSize: 16, lineHeight: 22 },
  memberBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  claimLink: { textAlign: 'center', paddingVertical: Spacing.one },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  readOnly: { opacity: 0.45 },
});
