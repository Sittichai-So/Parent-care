import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { HitSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Show a circular back affordance. Detail screens open from a stack, so default on. */
  showBack?: boolean;
  onBack?: () => void;
  /** Rendered on the trailing edge, aligned with the title. */
  action?: ReactNode;
  /** Small label above the title (e.g. the section the screen belongs to). */
  eyebrow?: string;
};

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  action,
  eyebrow,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="ย้อนกลับ"
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="chevron-back-outline" size={24} color={theme.text} />
          </Pressable>
        ) : null}

        <View style={styles.titleWrap}>
          {eyebrow ? (
            <ThemedText type="caption" themeColor="textMuted">
              {eyebrow.toUpperCase()}
            </ThemedText>
          ) : null}
          <ThemedText type="heading" accessibilityRole="header">
            {title}
          </ThemedText>
        </View>

        {action ? <View style={styles.action}>{action}</View> : null}
      </View>

      {subtitle ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  backButton: {
    width: HitSize.small,
    height: HitSize.small,
    borderRadius: Radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: { flex: 1, gap: Spacing.half },
  action: { marginLeft: 'auto' },
  subtitle: { paddingLeft: HitSize.small + Spacing.three },
  pressed: { opacity: 0.7 },
});
