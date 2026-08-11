import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CheckRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
};

/** A tappable row with a checkbox — used for booleans like "reminder on" or
 *  "currently taking this medication" where a switch would be too small a target. */
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
        <ThemedText style={styles.glyph}>{checked ? '✓' : ''}</ThemedText>
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
  glyph: { color: '#FFFFFF', fontSize: 14, lineHeight: 18, fontWeight: '800' },
  text: { flex: 1, gap: 1 },
  pressed: { opacity: 0.7 },
});
