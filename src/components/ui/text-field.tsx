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
  secureTextEntry?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  phosphorIcon?: PhosphorIcon;
  variant?: 'default' | 'soft';
};

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
