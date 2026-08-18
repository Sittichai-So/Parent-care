import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger, useTabTrigger } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import {
  ChartDonutIcon,
  HouseIcon,
  PhoneCallIcon,
  UserCircleIcon,
  UsersThreeIcon,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

type TabButtonProps = {
  name: string;
  icon: PhosphorIcon;
  label: string;
  badge?: number;
};

function TabButton({ name, icon: Icon, label, badge }: TabButtonProps) {
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
        {/* Rounded chip behind the icon, filled when active — per the
         *  reference design, replacing the old underline-dot indicator. */}
        <View style={[styles.iconChip, focused && { backgroundColor: theme.primarySoft }]}>
          <Icon weight={focused ? 'fill' : 'regular'} size={22} color={color} />
        </View>
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

/** The centre SOS button — navy, phone-call glyph, a slow breathing shadow
 *  pulse to draw the eye (this is the one control on the tab bar that
 *  should never be missed), per the reference design's `Emergency` FAB. */
function EmergencyButton() {
  const theme = useTheme();
  const router = useRouter();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.4 + pulse.value * 0.22,
    shadowRadius: 10 + pulse.value * 8,
  }));

  return (
    <View style={styles.fabSlot} pointerEvents="box-none">
      <Animated.View style={[styles.fabShadow, { shadowColor: theme.primary }, pulseStyle]}>
        <Pressable
          onPress={() => router.push('/emergency')}
          accessibilityRole="button"
          accessibilityLabel="ขอความช่วยเหลือฉุกเฉิน"
          accessibilityHint="เปิดหน้ายืนยันการขอความช่วยเหลือจากครอบครัว"
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: theme.primary, borderColor: theme.backgroundElement },
            pressed && styles.fabPressed,
          ]}>
          <PhoneCallIcon weight="fill" size={26} color={theme.onPrimary} />
        </Pressable>
      </Animated.View>
      <ThemedText style={[styles.fabLabel, { color: theme.primary }]}>Emergency</ThemedText>
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
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
              <TabButton name="index" icon={HouseIcon} label="หน้าหลัก" badge={attentionCount} />
            </TabTrigger>
          ) : null}

          {showCaregiverTab ? (
            <TabTrigger name="family" href="/family" asChild>
              <TabButton name="family" icon={UsersThreeIcon} label="ครอบครัว" />
            </TabTrigger>
          ) : null}

          {showElderTab ? (
            <TabTrigger name="explore" href="/explore" asChild>
              <TabButton name="explore" icon={UserCircleIcon} label="ข้อมูลของฉัน" />
            </TabTrigger>
          ) : null}

          {/* Every role gets a report — its content differs per role (see
           *  (tabs)/report.tsx), but the tab itself is never hidden. */}
          <TabTrigger name="report" href="/report" asChild>
            <TabButton name="report" icon={ChartDonutIcon} label="แดชบอร์ด" />
          </TabTrigger>

          {showCaregiverTab ? (
            <TabTrigger name="profile" href="/profile" asChild>
              <TabButton name="profile" icon={UserCircleIcon} label="โปรไฟล์" />
            </TabTrigger>
          ) : null}

          <EmergencyButton />
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
  iconWrap: { position: 'relative' },
  iconChip: {
    width: 38,
    height: 32,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
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

  // Overlaps the bar's top edge, centred — matches the reference design's
  // always-visible SOS button rather than tucking it in as just another tab.
  fabSlot: {
    position: 'absolute',
    top: -34,
    left: '50%',
    marginLeft: -30,
    width: 60,
    alignItems: 'center',
    gap: Spacing.one,
  },
  fabShadow: {
    borderRadius: Radius.full,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  fabLabel: { fontSize: 11, fontWeight: '700' },
});
