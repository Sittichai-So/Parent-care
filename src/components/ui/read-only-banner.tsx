import { StyleSheet } from 'react-native';

import { EyeIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

/** Viewer-role banner, per the reference design's read-only rule — self-gated
 *  on `canEdit` like `NotificationBanner` is on permission state, so every
 *  screen just drops this in with no prop wiring. Renders nothing for any
 *  role that can actually edit. */
export function ReadOnlyBanner() {
  const theme = useTheme();
  const { canEdit } = useFamilyContext();

  if (canEdit) return null;

  return (
    <Card tone="readOnly" elevation="flat" style={styles.card}>
      <EyeIcon weight="duotone" size={20} color={theme.warning} />
      <ThemedText type="small" style={[styles.text, { color: theme.warningText }]}>
        โหมดดูได้เท่านั้น — บันทึกและยืนยันข้อมูลไม่ได้
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  text: { flex: 1 },
});
