import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { HitSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  /** Masks the value and adds a show/hide eye toggle — for passwords. */
  secureTextEntry?: boolean;
  /** Leading glyph inside the field — the login screen's envelope/lock icons. Omit for the plain boxed look every other form uses. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Phosphor icon component — takes precedence over `icon` when given (see `AppButton`'s `phosphorIcon`). */
  phosphorIcon?: PhosphorIcon;
  /** `soft` swaps the bordered white box for a borderless filled pill (sunken
   *  background, larger radius) — used on the login screen's more marketing-led
   *  layout. `default` is every ordinary data-entry form's boxed, bordered field. */
  variant?: 'default' | 'soft';
};

/** Label + input pair shared by every form screen so spacing and focus styling stay consistent. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  multiline = false,
  keyboardType = 'default',
  secureTextEntry = false,
  icon,
  phosphorIcon: PhosphorIconComp,
  variant = 'default',
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const soft = variant === 'soft';

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">
        {label}
        {required ? <ThemedText style={{ color: theme.danger }}> *</ThemedText> : null}
      </ThemedText>
      <View
        style={[
          styles.row,
          multiline && styles.rowMultiline,
          {
            backgroundColor: soft ? theme.surfaceSunken : theme.inputBackground,
            borderColor: focused ? theme.primary : soft ? 'transparent' : theme.border,
            borderWidth: focused ? 2 : soft ? 2 : 1,
            // `soft` matches the reference design's login/register fields —
            // radius 14, same as `Radius.md` (a bordered `default` field
            // uses the same token for consistency, not because the mock
            // calls for it there too).
            borderRadius: Radius.md,
          },
        ]}>
        {PhosphorIconComp ? (
          <PhosphorIconComp weight="duotone" size={20} color={theme.primary} />
        ) : icon ? (
          <Ionicons name={icon} size={20} color={theme.primary} />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          multiline={multiline}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !revealed}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          style={[styles.input, { color: theme.text }, multiline && styles.multiline]}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            hitSlop={Spacing.two}
            style={({ pressed }) => pressed && styles.pressed}>
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    minHeight: HitSize.large,
  },
  rowMultiline: { alignItems: 'flex-start' },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  pressed: { opacity: 0.7 },
});
