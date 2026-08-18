import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaretLeftIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type OnboardingHeaderProps = {
  title: string;
  onBack?: () => void;
  /** Shows "ขั้นที่ N จาก 2" + a 2-segment progress bar. Omit when this
   *  screen is reached outside the register→household onboarding flow
   *  (e.g. household-setup opened later from "มีรหัสผูกบัญชี?"). */
  step?: 1 | 2;
};

/** Shared navy masthead for the register → household-setup onboarding
 *  flow, per the reference design's 2-step "สร้างบัญชี" header. */
export function OnboardingHeader({ title, onBack, step }: OnboardingHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { backgroundColor: theme.hero, paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="ย้อนกลับ"
            style={({ pressed }) => [styles.back, { backgroundColor: theme.heroSurface }, pressed && styles.pressed]}>
            <CaretLeftIcon weight="bold" size={18} color={theme.heroText} />
          </Pressable>
        ) : null}
        <View style={styles.titleBlock}>
          <ThemedText type="heading" style={{ color: theme.heroText }}>
            {title}
          </ThemedText>
          {step ? (
            <ThemedText type="small" style={{ color: theme.heroTextMuted }}>
              ขั้นที่ {step} จาก 2
            </ThemedText>
          ) : null}
        </View>
      </View>

      {step ? (
        <View style={styles.progressRow}>
          <View style={styles.segment} />
          <View style={[styles.segment, step === 1 && { backgroundColor: theme.heroSurface }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.three, gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  back: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  titleBlock: { flex: 1, gap: Spacing.half },
  progressRow: { flexDirection: 'row', gap: Spacing.two },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' },
  pressed: { opacity: 0.8 },
});
