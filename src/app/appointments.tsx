import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, formatDateKey, relativeDayLabel } from '@/utils/date';

export default function AppointmentsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ memberId?: string }>();
  const { appointments, familyMembers, primaryElderId } = useFamilyContext();

  const memberId = params.memberId;
  const member = memberId ? familyMembers.find((m) => m.id === memberId) : undefined;

  const scoped = useMemo(
    () => (memberId ? appointments.filter((apt) => apt.memberId === memberId) : appointments),
    [appointments, memberId]
  );

  const upcoming = useMemo(
    () => scoped.filter((apt) => daysFromToday(apt.date) >= 0).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [scoped]
  );
  const past = useMemo(
    () => scoped.filter((apt) => daysFromToday(apt.date) < 0).sort((a, b) => b.date.localeCompare(a.date)),
    [scoped]
  );

  const memberName = (id: string) => familyMembers.find((m) => m.id === id)?.name ?? '';

  return (
    <Screen
      gap={Spacing.three}
      footer={
        <AppButton
          label="เพิ่มนัดหมาย"
          icon="＋"
          onPress={() =>
            router.push({ pathname: '/appointment-form', params: memberId ? { memberId } : { memberId: primaryElderId } })
          }
        />
      }>
      <ScreenHeader title="นัดหมาย" subtitle={member ? `ของ ${member.name}` : 'นัดหมายทั้งหมดของครอบครัว'} />

      {scoped.length === 0 ? (
        <Card tone="sunken" elevation="flat" gap={Spacing.two}>
          <ThemedText type="smallBold">ยังไม่มีนัดหมาย</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            กด &quot;เพิ่มนัดหมาย&quot; ด้านล่างเพื่อสร้างนัดหมายใหม่
          </ThemedText>
        </Card>
      ) : (
        <>
          <SectionHeader title="กำลังจะถึง" count={upcoming.length} />
          {upcoming.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              ไม่มีนัดหมายที่จะถึง
            </ThemedText>
          ) : (
            <View style={styles.list}>
              {upcoming.map((apt) => (
                <Pressable
                  key={apt.id}
                  onPress={() => router.push({ pathname: '/appointment-detail', params: { id: apt.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${apt.title} ${formatDateKey(apt.date)}`}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <Card style={styles.row} gap={Spacing.three}>
                    <View style={[styles.dateBlock, { backgroundColor: theme.primarySoft }]}>
                      <ThemedText type="caption" style={{ color: theme.primaryText }}>
                        {formatDateKey(apt.date, { month: 'short' })}
                      </ThemedText>
                      <ThemedText style={[styles.dateNumber, { color: theme.primaryText }]}>
                        {apt.date.slice(-2)}
                      </ThemedText>
                    </View>
                    <View style={styles.body}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {apt.title}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {apt.time} น. · {apt.hospital}
                      </ThemedText>
                      {!memberId ? (
                        <ThemedText type="caption" themeColor="textMuted">
                          {memberName(apt.memberId)}
                        </ThemedText>
                      ) : null}
                    </View>
                    <StatusBadge label={relativeDayLabel(apt.date)} tone={daysFromToday(apt.date) === 0 ? 'danger' : 'primary'} dot={false} />
                  </Card>
                </Pressable>
              ))}
            </View>
          )}

          {past.length > 0 ? (
            <>
              <SectionHeader title="ผ่านมาแล้ว" count={past.length} />
              <View style={styles.list}>
                {past.map((apt) => (
                  <Pressable
                    key={apt.id}
                    onPress={() => router.push({ pathname: '/appointment-detail', params: { id: apt.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${apt.title} ${formatDateKey(apt.date)}`}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <Card elevation="flat" tone="sunken" style={styles.row} gap={Spacing.three}>
                      <View style={[styles.dateBlock, { backgroundColor: theme.surfaceSunken }]}>
                        <ThemedText type="caption" themeColor="textMuted">
                          {formatDateKey(apt.date, { month: 'short' })}
                        </ThemedText>
                        <ThemedText style={styles.dateNumber}>{apt.date.slice(-2)}</ThemedText>
                      </View>
                      <View style={styles.body}>
                        <ThemedText type="smallBold" numberOfLines={1} themeColor="textSecondary">
                          {apt.title}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>
                          {apt.time} น. · {apt.hospital}
                        </ThemedText>
                      </View>
                    </Card>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center' },
  dateBlock: { width: 52, borderRadius: Radius.md, paddingVertical: Spacing.one, alignItems: 'center' },
  dateNumber: { fontSize: 18, lineHeight: 22, fontWeight: '800' },
  body: { flex: 1, gap: 1 },
  pressed: { opacity: 0.85 },
});
