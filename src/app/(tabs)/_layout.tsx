import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger, useTabTrigger } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
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

/** Reads its own focus state via `useTabTrigger` (documented and reliable)
 *  rather than depending on whatever props `TabTrigger`'s `asChild` may or
 *  may not forward — expo-router/ui's headless tabs are new enough in this
 *  SDK that the docs don't spell that part out. */
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

  // Caregivers and elders each get one tailored home screen — showing both would
  // let an elder browse every family member's private status, and a caregiver
  // land on the elder's simplified self-care screen by mistake. Owner/viewer
  // oversee everything, so both stay visible. Role is per-household now (this
  // account's membership in the *current* household), not a global account flag.
  const showCaregiverTab = currentRole !== 'Elder';
  const showElderTab = currentRole !== 'Caregiver';

  return (
    <Tabs style={styles.root}>
      <TabSlot />

      {/* `TabList` must be reachable from `Tabs`'s children through only
       *  Fragments/other `TabList`s — expo-router/ui's trigger scanner
       *  (`parseTriggersFromChildren`) only unwraps those two, so a plain
       *  `View` wrapping it (as this used to have, for the bar's
       *  background/border) makes the scanner find zero screens and throws
       *  "Couldn't find any screens for the navigator." So the bar's visual
       *  container has to be `TabList`'s own `asChild` target, and the FAB
       *  has to live *inside* that same target (as a non-trigger sibling —
       *  the scanner walks past non-`TabTrigger` children harmlessly)
       *  instead of wrapping it from outside. */}
      <TabList
        asChild
        style={StyleSheet.flatten([
          styles.bar,
          { backgroundColor: theme.backgroundElement, borderTopColor: theme.border, paddingBottom: insets.bottom },
        ])}>
        <View
          style={StyleSheet.flatten([
            styles.bar,
            { backgroundColor: theme.backgroundElement, borderTopColor: theme.border, paddingBottom: insets.bottom },
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

          {/* A shortcut into the same /emergency screen the "ขอความช่วยเหลือ"
           *  button on the self-service tab already opens — this is purely a
           *  faster path to it, not a new permission or behavior. */}
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
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    paddingTop: Spacing.two,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one,
  },
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

  // Raised, floating above the bar rather than sitting inline with the other
  // tab items — the one deliberately heavier element on the bar, matching
  // how the rest of the app treats the emergency action as visually distinct.
  // `alignSelf: 'center'` centers on the cross axis (vertical, since `bar`
  // is a row) — an absolutely positioned child needs `left: '50%'` +
  // negative `marginLeft` to actually center horizontally instead.
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
