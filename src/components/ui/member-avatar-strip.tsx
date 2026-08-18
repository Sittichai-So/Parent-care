import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CheckCircleIcon, ClockCountdownIcon, WarningCircleIcon, type Icon as PhosphorIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { getInitials } from '@/components/ui/avatar';
import { Radius, Spacing } from '@/constants/theme';
import type { FamilyMember, MemberStatus } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

type MemberAvatarStripProps = {
  members: FamilyMember[];
  onSelect: (member: FamilyMember) => void;
};

const STATUS_ICON: Record<MemberStatus, PhosphorIcon> = {
  normal: CheckCircleIcon,
  monitor: ClockCountdownIcon,
  urgent: WarningCircleIcon,
};

/** "สมาชิกในบ้านวันนี้" — the reference design's horizontal mini-card row:
 *  initials tile, name + status glyph, and a one-line status detail, per
 *  card (not just a bare avatar+name, which is what this used to render). */
export function MemberAvatarStrip({ members, onSelect }: MemberAvatarStripProps) {
  const theme = useTheme();

  const statusColor = (status: MemberStatus) =>
    status === 'urgent' ? theme.danger : status === 'monitor' ? theme.warning : theme.success;
  const borderColor = (status: MemberStatus) =>
    status === 'urgent' ? theme.danger : status === 'monitor' ? theme.warning : theme.border;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {members.map((member) => {
        const StatusIcon = STATUS_ICON[member.status];
        return (
          <Pressable
            key={member.id}
            onPress={() => onSelect(member)}
            accessibilityRole="button"
            accessibilityLabel={`${member.name} — ${member.detail}`}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: borderColor(member.status) },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.initialsTile, { backgroundColor: theme.primarySoft }]}>
              <ThemedText style={[styles.initials, { color: theme.primaryText }]}>{getInitials(member.name)}</ThemedText>
            </View>
            <View style={styles.nameRow}>
              <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
                {member.name}
              </ThemedText>
              <StatusIcon weight="fill" size={16} color={statusColor(member.status)} />
            </View>
            <ThemedText type="caption" themeColor="textMuted" numberOfLines={2} style={styles.detail}>
              {member.detail}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two, paddingVertical: Spacing.one },
  card: {
    width: 132,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: Spacing.two,
  },
  initialsTile: {
    width: '100%',
    height: 72,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: { fontSize: 22, fontWeight: '800', letterSpacing: 0.4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  name: { flex: 1 },
  detail: { paddingTop: 2, lineHeight: 16 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
