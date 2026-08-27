import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Elevation, HitSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SearchPillProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
};

export function SearchPill({ value, onChangeText, placeholder, accessibilityLabel }: SearchPillProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, shadowColor: theme.shadow },
        Elevation.low,
      ]}>
      <Ionicons name="search-outline" size={18} color={theme.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, { color: theme.text }]}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="ล้างคำค้นหา"
          hitSlop={Spacing.two}>
          <Ionicons name="close-circle" size={18} color={theme.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: HitSize.large,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: Spacing.three,
  },
  input: { flex: 1, fontSize: 15, height: '100%' },
});
