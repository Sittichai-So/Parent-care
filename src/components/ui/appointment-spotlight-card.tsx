import { Pressable, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Appointment } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey, relativeDayLabel } from '@/utils/date';

import { Card } from './card';

type AppointmentSpotlightCardProps = {
  appointment: Appointment;
  memberName: string;
  onPress: () => void;
};

/** The large "next appointment" card from the reference Home screen — a status
 *  label + amber relative-day badge up top, then date/time/doctor detail rows. */
export function AppointmentSpotlightCard({ appointment, memberName, onPress }: AppointmentSpotlightCardProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${appointment.title} ของ ${memberName}`}>
      {({ pressed }) => (
        <Card elevation="raised" gap={Spacing.three} style={[styles.card, pressed && styles.pressed]}>
          <View style={styles.headRow}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.headTitle}>
              {appointment.title}
            </ThemedText>
            <View
              style={[
                styles.dayBadge,
                { backgroundColor: theme.accentYellow },
              ]}>
              <ThemedText type="caption" style={{ color: theme.accentYellowText }}>
                {relativeDayLabel(appointment.date)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {formatDateKey(appointment.date, { day: 'numeric', month: 'long' })}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {appointment.time} น. · {appointment.hospital}
            </ThemedText>
          </View>

          <View style={[styles.footRow, { borderTopColor: theme.border }]}>
            <View style={styles.footBody}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {appointment.doctor ?? memberName}
              </ThemedText>
              <ThemedText type="caption" themeColor="textMuted" numberOfLines={1}>
                {appointment.department ?? memberName}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color={theme.textMuted} />
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  pressed: { opacity: 0.9 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.two },
  headTitle: { flex: 1 },
  dayBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.two, paddingVertical: Spacing.half },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    paddingTop: Spacing.three,
  },
  footBody: { flex: 1, gap: 1 },
});
