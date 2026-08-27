import { Pressable, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CheckRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
};

export function CheckRow({ label, description, checked, onToggle }: CheckRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? theme.primary : theme.borderStrong,
            backgroundColor: checked ? theme.primary : 'transparent',
          },
        ]}>
        {checked ? <Ionicons name="checkmark" size={16} color={theme.onPrimary} /> : null}
      </View>
      <View style={styles.text}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {description ? (
          <ThemedText type="caption" themeColor="textMuted">
            {description}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.one },
  box: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { flex: 1, gap: 1 },
  pressed: { opacity: 0.7 },
});
