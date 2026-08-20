import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CaretRightIcon, CheckCircleIcon, XCircleIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusBadge, type BadgeTone } from '@/components/ui/status-badge';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext, type FamilyMember, type MemberRole } from '@/context/family-context';
import type { HouseholdRole } from '@/services/households-api';
import { useTheme } from '@/hooks/use-theme';

/** What each role can actually do in this app — real capability gates
 *  verified elsewhere in the codebase (Viewer's `canEdit`-gated screens,
 *  Elder's tab list excluding the rest of the household, Owner-only routes
 *  like this one), not a fabricated per-user permission list. A chip here
 *  only exists if it names something genuinely enforced somewhere else. */
const ROLE_PERMISSIONS: Record<MemberRole, { label: string; granted: boolean }[]> = {
  Owner: [
    { label: 'จัดการสิทธิ์สมาชิก', granted: true },
    { label: 'แก้ไขข้อมูลได้ทุกอย่าง', granted: true },
    { label: 'ดูบันทึกการใช้งานระบบ', granted: true },
  ],
  Caregiver: [
    { label: 'แก้ไขข้อมูลได้', granted: true },
    { label: 'จัดการสิทธิ์สมาชิกไม่ได้', granted: false },
  ],
  Elder: [
    { label: 'แก้ไขข้อมูลของตัวเองได้', granted: true },
    { label: 'ไม่เห็นข้อมูลสมาชิกคนอื่น', granted: false },
  ],
  Viewer: [
    { label: 'ดูข้อมูลได้ทุกอย่าง', granted: true },
    { label: 'แก้ไขหรือบันทึกข้อมูลไม่ได้', granted: false },
  ],
};

const ROLE_TONE: Record<MemberRole, BadgeTone> = {
  Owner: 'primary',
  Caregiver: 'primary',
  Elder: 'warning',
  Viewer: 'neutral',
};

const ASSIGNABLE_ROLES: { role: Exclude<HouseholdRole, 'owner'>; label: MemberRole }[] = [
  { role: 'caregiver', label: 'Caregiver' },
  { role: 'elder', label: 'Elder' },
  { role: 'viewer', label: 'Viewer' },
];

type MemberAccessRowProps = {
  member: FamilyMember;
  isMe: boolean;
  isSaving: boolean;
  onPress: () => void;
};

function MemberAccessRow({ member, isMe, isSaving, onPress }: MemberAccessRowProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const editable = member.role !== 'Owner';

  return (
    <Pressable
      disabled={!editable || isSaving}
      onPress={onPress}
      accessibilityRole={editable ? 'button' : undefined}
      accessibilityLabel={editable ? `เปลี่ยนสิทธิ์ของ ${member.name}` : undefined}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card gap={Spacing.three}>
        <View style={styles.head}>
          <Avatar name={member.name} size={44} shape="rounded" tone={ROLE_TONE[member.role]} />
          <View style={styles.headBody}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {member.name}
            </ThemedText>
            {/* Only the signed-in member's own email is available here —
             *  other members' emails aren't exposed by the household member
             *  list (privacy-reasonable, and managed members with no account
             *  have none at all), so this falls back to relation rather than
             *  fabricating an address. */}
            <ThemedText type="caption" themeColor="textMuted" numberOfLines={1}>
              {isMe ? (user?.email ?? member.relation) : member.relation}
            </ThemedText>
          </View>
          <StatusBadge label={member.role} tone={ROLE_TONE[member.role]} dot={false} />
          {editable ? <CaretRightIcon weight="bold" size={18} color={theme.textMuted} /> : null}
        </View>

        <View style={styles.perms}>
          {ROLE_PERMISSIONS[member.role].map((perm) => (
            <StatusBadge
              key={perm.label}
              label={perm.label}
              tone={perm.granted ? 'success' : 'danger'}
              phosphorIcon={perm.granted ? CheckCircleIcon : XCircleIcon}
            />
          ))}
        </View>
      </Card>
    </Pressable>
  );
}

export default function HouseholdAccessScreen() {
  const router = useRouter();
  const { currentRole, currentHousehold, currentMembershipId, familyMembers, updateMemberRole } = useFamilyContext();
  const [savingId, setSavingId] = useState<string | null>(null);

  const isOwner = currentRole === 'Owner';

  const handleChangeRole = (member: FamilyMember) => {
    Alert.alert(
      `เปลี่ยนสิทธิ์ของ ${member.name}`,
      'เลือกสิทธิ์ใหม่',
      [
        ...ASSIGNABLE_ROLES.filter((option) => option.label !== member.role).map((option) => ({
          text: option.label,
          onPress: () => {
            setSavingId(member.id);
            updateMemberRole(member.id, option.role)
              .catch((err) => {
                const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
                Alert.alert('เปลี่ยนสิทธิ์ไม่สำเร็จ', message);
              })
              .finally(() => setSavingId(null));
          },
        })),
        { text: 'ยกเลิก', style: 'cancel' },
      ]
    );
  };

  if (!isOwner) {
    return (
      <Screen center gap={Spacing.three}>
        <ScreenHeader title="สมาชิกและสิทธิ์การเข้าถึง" />
        <Card tone="sunken" elevation="flat" gap={Spacing.two}>
          <ThemedText type="smallBold">เฉพาะเจ้าของบ้านเท่านั้น</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            หน้านี้ใช้จัดการสิทธิ์ของสมาชิกในบ้าน — เฉพาะบัญชี Owner ของกลุ่มครอบครัวจึงจะเข้าถึงได้
          </ThemedText>
        </Card>
        <AppButton label="กลับ" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen gap={Spacing.three}>
      <ScreenHeader
        title="สมาชิกและสิทธิ์การเข้าถึง"
        eyebrow={currentHousehold?.name ?? 'ครอบครัว'}
        subtitle="แตะสมาชิกเพื่อเปลี่ยนสิทธิ์การเข้าถึง"
      />

      <View style={styles.list}>
        {familyMembers.map((member) => (
          <MemberAccessRow
            key={member.id}
            member={member}
            isMe={member.id === currentMembershipId}
            isSaving={savingId === member.id}
            onPress={() => handleChangeRole(member)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  headBody: { flex: 1, minWidth: 0, gap: 1 },
  perms: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
