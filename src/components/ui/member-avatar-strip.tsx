import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getInitials } from '@/components/ui/avatar';
import { MemberDisplayStatusMeta } from '@/constants/status';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext, type FamilyMember } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { memberDisplayStatus, statusBucket } from '@/utils/member-status';

type MemberAvatarStripProps = {
  members: FamilyMember[];
  onSelect: (member: FamilyMember) => void;
};

export function MemberAvatarStrip({ members, onSelect }: MemberAvatarStripProps) {
  const theme = useTheme();
  const { medications } = useFamilyContext();

  const toneColor: Record<string, string> = {
    danger: theme.danger,
    warning: theme.warning,
    success: theme.success,
    neutral: theme.textMuted,
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {members.map((member) => {
        const meta = MemberDisplayStatusMeta[memberDisplayStatus(member, medications)];
        const attention = statusBucket(memberDisplayStatus(member, medications)) === 'attention';
        const StatusIcon = meta.icon;
        return (
          <Pressable
            key={member.id}
            onPress={() => onSelect(member)}
            accessibilityRole="button"
            accessibilityLabel={`${member.name} — ${meta.label}`}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: attention ? toneColor[meta.tone] : theme.border },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.initialsTile, { backgroundColor: theme.primarySoft }]}>
              <ThemedText style={[styles.initials, { color: theme.primaryText }]}>{getInitials(member.name)}</ThemedText>
            </View>
            <View style={styles.nameRow}>
              <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
                {member.name}
              </ThemedText>
              <StatusIcon weight="fill" size={16} color={toneColor[meta.tone] ?? theme.textMuted} />
            </View>
            <ThemedText type="caption" themeColor="textMuted" numberOfLines={2} style={styles.detail}>
              {meta.label}
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
