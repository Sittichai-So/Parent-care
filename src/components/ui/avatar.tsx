import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { BadgeTone } from './status-badge';

type AvatarProps = {
  name: string;
  size?: number;
  /** Ring colour — mirrors the member's status so the list scans at a glance. */
  tone?: BadgeTone;
  /** `circle` (default) — the Profile identity avatar's look. `rounded` —
   *  a rounded-square initials tile, per the reference design's list-row
   *  avatars (Family, Member detail, Members & access). */
  shape?: 'circle' | 'rounded';
};

/** Thai names have no space-separated surname, so fall back to the first glyphs.
 *  Exported for callers that need the same initials logic but can't use
 *  `Avatar` itself — e.g. a non-square tile shape `Avatar`'s single `size`
 *  can't express (see `MemberAvatarStrip`). */
export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words
      .map((word) => [...word][0] ?? '')
      .join('')
      .slice(0, 2);
  }
  return [...(words[0] ?? '')].slice(0, 2).join('');
}

export function Avatar({ name, size = 48, tone = 'primary', shape = 'circle' }: AvatarProps) {
  const theme = useTheme();

  const tones: Record<BadgeTone, { background: string; text: string }> = {
    neutral: { background: theme.surfaceSunken, text: theme.textSecondary },
    primary: { background: theme.primarySoft, text: theme.primaryText },
    success: { background: theme.successSoft, text: theme.successText },
    warning: { background: theme.warningSoft, text: theme.warningText },
    danger: { background: theme.dangerSoft, text: theme.dangerText },
  };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: shape === 'rounded' ? Radius.lg : Radius.full,
          backgroundColor: tones[tone].background,
        },
      ]}>
      <ThemedText style={[styles.text, { fontSize: size * 0.36, color: tones[tone].text }]}>
        {getInitials(name)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { justifyContent: 'center', alignItems: 'center' },
  text: { fontWeight: '800' },
});
