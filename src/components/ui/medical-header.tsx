import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BellIcon, ChatTeardropDotsIcon, SignOutIcon } from 'phosphor-react-native';

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
  /** Omit to hide the button — not every screen that uses this header has somewhere for it to go. */
  onMessagesPress?: () => void;
  /** Slot above the title — the household switcher pill, when the caller has one. */
  topSlot?: ReactNode;
  /** Slot for a `SearchPill`, rendered below the subtitle. */
  children?: ReactNode;
};

/** The dashboard's top block — a solid navy panel per the "Parent Care v3"
 *  reference design, full-bleed via `Screen`'s `header` slot and painted
 *  behind the status bar (this component pads itself using the top safe-area
 *  inset rather than relying on `SafeAreaView`). */
export function MedicalHeader({
  title,
  subtitle,
  notificationCount = 0,
  onNotificationPress,
  onLogoutPress,
  onMessagesPress,
  topSlot,
  children,
}: MedicalHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { backgroundColor: theme.hero, paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          {topSlot ? <View style={styles.topSlot}>{topSlot}</View> : null}
          <ThemedText type="heading" numberOfLines={1} style={{ color: theme.heroText }}>
            {title}
          </ThemedText>
          <ThemedText type="small" numberOfLines={1} style={{ color: theme.heroTextMuted }}>
            {subtitle}
          </ThemedText>
        </View>

        <View style={styles.iconRow}>
          {onMessagesPress ? (
            <Pressable
              onPress={onMessagesPress}
              accessibilityRole="button"
              accessibilityLabel="ข้อความครอบครัว (ตัวอย่าง)"
              hitSlop={Spacing.two}
              style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.heroSurface }, pressed && styles.pressed]}>
              <ChatTeardropDotsIcon weight="duotone" size={22} color={theme.heroText} />
            </Pressable>
          ) : null}

          <Pressable
            onPress={onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel={notificationCount > 0 ? `การแจ้งเตือน ${notificationCount} รายการ` : 'การแจ้งเตือน'}
            hitSlop={Spacing.two}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.heroSurface }, pressed && styles.pressed]}>
            <BellIcon weight="duotone" size={22} color={theme.heroText} />
            {notificationCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: theme.accentYellow, borderColor: theme.hero }]}>
                <ThemedText style={[styles.badgeLabel, { color: theme.accentYellowText }]}>
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
            style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.heroSurface }, pressed && styles.pressed]}>
            <SignOutIcon weight="bold" size={20} color={theme.heroText} />
          </Pressable>
        </View>
      </View>

      {children ? <View style={styles.childrenSlot}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  titleBlock: { flex: 1, gap: Spacing.half },
  topSlot: { marginBottom: Spacing.one },
  iconRow: { flexDirection: 'row', gap: Spacing.two },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
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
  // Content width elsewhere in the app is capped at `MaxContentWidth` and
  // centred; the header is full-bleed, so its own content gets the same cap
  // independently rather than inheriting it from `Screen`.
  childrenSlot: { width: '100%', maxWidth: 800, alignSelf: 'center' },
});