import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

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
      <View style={styles.inputWrap}>
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
          style={[
            styles.input,
            soft && styles.inputSoft,
            {
              backgroundColor: soft ? theme.surfaceSunken : theme.inputBackground,
              color: theme.text,
              borderColor: focused ? theme.primary : soft ? 'transparent' : theme.border,
              borderWidth: focused ? 2 : soft ? 2 : 1,
            },
            multiline && styles.multiline,
            secureTextEntry && styles.withToggle,
          ]}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            hitSlop={Spacing.two}
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  inputWrap: { justifyContent: 'center' },
  input: {
    minHeight: HitSize.large,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  inputSoft: { borderRadius: Radius.lg },
  multiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: Spacing.two },
  withToggle: { paddingRight: Spacing.three + HitSize.small },
  toggle: {
    position: 'absolute',
    right: Spacing.three,
    padding: Spacing.one,
  },
  pressed: { opacity: 0.7 },
});
