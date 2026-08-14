import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MedicalHeaderProps = {
  title: string;
  subtitle: string;
  /** Badge count on the notification bell — omit or 0 to hide the badge. */
  notificationCount?: number;
  onNotificationPress: () => void;
  onLogoutPress: () => void;
  /** Slot for a `SearchPill`, rendered below the subtitle. */
  children?: ReactNode;
};

/** The dashboard's top block — plain text on the page's own background, not a
 *  solid colour panel. A heavy navy slab read as dated corporate chrome next
 *  to the airy, mostly-white brand backdrop; icon buttons carry the only
 *  colour here, each tinted to what it actually does (lavender for
 *  notifications, neutral for logout) rather than a uniform brand colour. */
export function MedicalHeader({
  title,
  subtitle,
  notificationCount = 0,
  onNotificationPress,
  onLogoutPress,
  children,
}: MedicalHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <ThemedText type="heading" numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        </View>

        <View style={styles.iconRow}>
          <Pressable
            onPress={onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel={notificationCount > 0 ? `การแจ้งเตือน ${notificationCount} รายการ` : 'การแจ้งเตือน'}
            hitSlop={Spacing.two}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.lavenderSoft }, pressed && styles.pressed]}>
            <Ionicons name="notifications-outline" size={20} color={theme.lavenderText} />
            {notificationCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.background }]}>
                <ThemedText style={[styles.badgeLabel, { color: theme.onPrimary }]}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={onLogoutPress}
            accessibilityRole="button"
            accessibilityLabel="ออกจากระบบ"
            hitSlop={Spacing.two}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.surfaceSunken }, pressed && styles.pressed]}>
            <Ionicons name="log-out-outline" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.three },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  titleBlock: { flex: 1, gap: Spacing.half },
  iconRow: { flexDirection: 'row', gap: Spacing.two },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: Radius.full,
    borderWidth: 2,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLabel: { fontSize: 9, lineHeight: 11, fontWeight: '800' },
  pressed: { opacity: 0.8 },
});
