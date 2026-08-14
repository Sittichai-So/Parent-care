import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { MemberStatusMeta } from '@/constants/status';
import { Radius, Spacing } from '@/constants/theme';
import type { FamilyMember } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

import { Avatar } from './avatar';

type MemberAvatarStripProps = {
  members: FamilyMember[];
  onSelect: (member: FamilyMember) => void;
};

/** Horizontal avatar row — the reference design's "available doctors today"
 *  strip, adapted to this app's actual domain: a fast-glance row of the
 *  household's family members, each ringed in their real status colour
 *  (instead of a favorite-heart, which has no equivalent here) and a small
 *  alert dot standing in for the reference's favorite marker. */
export function MemberAvatarStrip({ members, onSelect }: MemberAvatarStripProps) {
  const theme = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {members.map((member) => {
        const status = MemberStatusMeta[member.status];
        return (
          <Pressable
            key={member.id}
            onPress={() => onSelect(member)}
            accessibilityRole="button"
            accessibilityLabel={`${member.name} สถานะ ${status.label}`}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <View>
              <Avatar name={member.name} tone={status.tone} size={56} />
              {member.status !== 'normal' ? (
                <View style={[styles.alertDot, { backgroundColor: theme.danger, borderColor: theme.background }]}>
                  <Ionicons name="alert" size={9} color={theme.onPrimary} />
                </View>
              ) : null}
            </View>
            <ThemedText type="caption" numberOfLines={1} style={styles.name}>
              {member.name}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.one },
  item: { alignItems: 'center', gap: Spacing.one, width: 64 },
  name: { textAlign: 'center' },
  alertDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: { opacity: 0.8 },
});
