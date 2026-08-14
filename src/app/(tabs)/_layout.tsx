import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger, useTabTrigger } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type TabButtonProps = {
  name: string;
  activeIcon: IconName;
  inactiveIcon: IconName;
  label: string;
  badge?: number;
};

function TabButton({ name, activeIcon, inactiveIcon, label, badge }: TabButtonProps) {
  const theme = useTheme();
  const { trigger, triggerProps } = useTabTrigger({ name });
  const focused = trigger?.isFocused ?? false;
  const color = focused ? theme.primary : theme.textMuted;

  return (
    <Pressable
      {...triggerProps}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      style={styles.tabItem}>
      <View style={styles.iconWrap}>
        <Ionicons name={focused ? activeIcon : inactiveIcon} size={24} color={color} />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.backgroundElement }]}>
            <ThemedText style={[styles.badgeLabel, { color: theme.onPrimary }]}>{badge}</ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText type="caption" style={{ color, fontWeight: focused ? '800' : '600' }}>
        {label}
      </ThemedText>
      {/* Small brand-gradient pill instead of a flat colour underline — the
       *  one place in the nav that carries the logo's blue→teal identity. */}
      <View style={[styles.activeDot, focused && { experimental_backgroundImage: theme.brandGradient }]} />
    </Pressable>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { familyMembers, currentRole } = useFamilyContext();

  /** Surfaced on the tab bar so attention items are visible from any screen. */
  const attentionCount = familyMembers.filter((member) => member.status !== 'normal').length;

  const showCaregiverTab = currentRole !== 'Elder';
  const showElderTab = currentRole !== 'Caregiver';

  return (
    <Tabs style={styles.root}>
      <TabSlot />
      <TabList asChild>
        <View
          style={StyleSheet.flatten([
            styles.bar,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              shadowColor: theme.hero,
              marginBottom: insets.bottom + Spacing.two,
            },
          ])}>
          {showCaregiverTab ? (
            <TabTrigger name="index" href="/" asChild>
              <TabButton
                name="index"
                activeIcon="home"
                inactiveIcon="home-outline"
                label="ผู้ดูแล"
                badge={attentionCount}
              />
            </TabTrigger>
          ) : null}

          {showElderTab ? (
            <TabTrigger name="explore" href="/explore" asChild>
              <TabButton
                name="explore"
                activeIcon="person-circle"
                inactiveIcon="person-circle-outline"
                label="ข้อมูลของฉัน"
              />
            </TabTrigger>
          ) : null}

          {/* Every role gets a report — its content differs per role (see
           *  (tabs)/report.tsx), but the tab itself is never hidden. */}
          <TabTrigger name="report" href="/report" asChild>
            <TabButton name="report" activeIcon="stats-chart" inactiveIcon="stats-chart-outline" label="รายงาน" />
          </TabTrigger>

          <Pressable
            onPress={() => router.push('/emergency')}
            accessibilityRole="button"
            accessibilityLabel="ขอความช่วยเหลือฉุกเฉิน"
            accessibilityHint="เปิดหน้ายืนยันการขอความช่วยเหลือจากครอบครัว"
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: theme.danger, borderColor: theme.background },
              pressed && styles.fabPressed,
            ]}>
            <Ionicons name="alert-circle" size={28} color={theme.onPrimary} />
          </Pressable>
        </View>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Floating pill nav, per the reference design — margin on every side (instead
  // of the old full-bleed, top-border-only bar) plus an all-around shadow tinted
  // with the brand navy rather than the flat top hairline this used to have.
  bar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.three,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingTop: Spacing.two,
    ...Elevation.high,
    shadowOpacity: 0.25,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one,
  },
  activeDot: { width: 18, height: 4, borderRadius: Radius.full, marginTop: 1 },
  iconWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: Radius.full,
    borderWidth: 2,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLabel: { fontSize: 10, lineHeight: 12, fontWeight: '800' },

  fab: {
    position: 'absolute',
    top: -22,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
