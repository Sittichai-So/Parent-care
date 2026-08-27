import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, HitSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'medium' | 'large' | 'xlarge';
export type IconName = ComponentProps<typeof Ionicons>['name'];

type AppButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  phosphorIcon?: PhosphorIcon;
  iconPosition?: 'leading' | 'trailing';
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  icon,
  phosphorIcon: PhosphorIconComp,
  iconPosition = 'leading',
  disabled = false,
  loading = false,
  hint,
  accessibilityHint,
  style,
}: AppButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<ButtonVariant, { background: string; text: string; border: string }> = {
    primary: { background: theme.primary, text: theme.onPrimary, border: theme.primary },
    secondary: { background: theme.primarySoft, text: theme.primaryText, border: theme.primarySoft },
    danger: { background: theme.danger, text: theme.onPrimary, border: theme.danger },
    success: { background: theme.success, text: theme.onPrimary, border: theme.success },
    ghost: { background: 'transparent', text: theme.primary, border: 'transparent' },
  };

  const heights: Record<ButtonSize, number> = {
    medium: HitSize.medium,
    large: HitSize.large,
    xlarge: HitSize.xlarge,
  };

  const { background, text, border } = palette[variant];
  const raised = variant === 'primary' || variant === 'danger' || variant === 'success';
  const iconSize = size === 'xlarge' ? 22 : 18;

  const iconNode = PhosphorIconComp ? (
    <PhosphorIconComp weight="bold" size={iconSize} color={text} />
  ) : icon ? (
    <Ionicons
      name={icon}
      size={iconSize}
      color={text}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  ) : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint ?? hint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: heights[size],
          backgroundColor: background,
          borderColor: border,
          paddingVertical: hint ? Spacing.two : 0,
        },
        variant === 'primary' && !isDisabled && { experimental_backgroundImage: theme.brandGradient },
        raised && !isDisabled && { ...Elevation.medium, shadowColor: background },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <View style={styles.content}>
          <View style={styles.labelRow}>
            {iconNode && iconPosition === 'leading' ? iconNode : null}
            <ThemedText
              numberOfLines={2}
              style={[styles.label, size === 'xlarge' && styles.labelLarge, { color: text }]}>
              {label}
            </ThemedText>
            {iconNode && iconPosition === 'trailing' ? iconNode : null}
          </View>
          {hint ? (
            <ThemedText style={[styles.hint, { color: text }]} numberOfLines={2}>
              {hint}
            </ThemedText>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  content: { alignItems: 'center', gap: Spacing.half },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { fontSize: 16, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
  labelLarge: { fontSize: 18, lineHeight: 26 },
  hint: { fontSize: 13, lineHeight: 18, fontWeight: '500', opacity: 0.85, textAlign: 'center' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
});
