import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { DonutChart } from '@/components/ui/donut-chart';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { TrendLineChart } from '@/components/ui/trend-line-chart';
import { VitalsSummary } from '@/components/ui/vitals-summary';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, relativeDayLabel } from '@/utils/date';
import { adherenceTone, bloodPressureSeries, medicationAdherence, vitalSeries } from '@/utils/reports';

import { ReportHeader } from './report-header';

/** Personal report for the Elder role — no household roster, no other
 *  members' data, just this person's own medication adherence and vitals
 *  trends over time, the two things a health report about *them* is
 *  actually for. */
export function ElderReport() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const { medications, appointments, vitalLogs, selfMemberId, currentHousehold } = useFamilyContext();

  const myMedications = useMemo(
    () => medications.filter((med) => med.memberId === selfMemberId),
    [medications, selfMemberId]
  );
  const activeAdherence = useMemo(() => medicationAdherence(myMedications), [myMedications]);

  const myVitals = useMemo(() => vitalLogs.filter((log) => log.memberId === selfMemberId), [vitalLogs, selfMemberId]);
  const bloodPressure = useMemo(() => bloodPressureSeries(myVitals), [myVitals]);
  const sugarTrend = useMemo(() => vitalSeries(myVitals, 'sugar'), [myVitals]);
  const weightTrend = useMemo(() => vitalSeries(myVitals, 'weight'), [myVitals]);

  const myAppointments = useMemo(
    () =>
      appointments
        .filter((apt) => apt.memberId === selfMemberId && daysFromToday(apt.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
        .slice(0, 5),
    [appointments, selfMemberId]
  );

  return (
    <Screen
      header={
        <ReportHeader
          title="รายงานสุขภาพของฉัน"
          subtitle={
            currentHousehold
              ? `${currentHousehold.name}${user?.name ? ` · ${user.name}` : ''}`
              : (user?.name ?? 'สรุปสุขภาพของฉัน')
          }
        />
      }>
      <View style={styles.statRow}>
        <StatTile value={`${activeAdherence.pct}%`} label="ทานยาวันนี้" tone={adherenceTone(activeAdherence.pct)} />
        <StatTile value={myMedications.filter((med) => med.active).length} label="ยาที่ใช้อยู่" tone="primary" />
        <StatTile
          value={myAppointments[0] ? relativeDayLabel(myAppointments[0].date) : '-'}
          label="นัดหมายถัดไป"
          tone="neutral"
        />
      </View>

      <SectionHeader title="การทานยาวันนี้" />
      <Card>
        {activeAdherence.due === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            ยังไม่มีรายการยาที่ใช้งานอยู่
          </ThemedText>
        ) : (
          <DonutChart
            centerLabel="รายการ"
            data={[
              { label: 'ทานแล้ว', value: activeAdherence.taken, tone: 'success' },
              { label: 'ยังไม่ทาน', value: activeAdherence.due - activeAdherence.taken, tone: 'warning' },
            ]}
          />
        )}
      </Card>

      <SectionHeader title="แนวโน้มความดันโลหิต" />
      <Card>
        <TrendLineChart
          unit="mmHg"
          series={[
            { label: 'ค่าบน (Systolic)', color: theme.danger, points: bloodPressure.systolic },
            { label: 'ค่าล่าง (Diastolic)', color: theme.primary, points: bloodPressure.diastolic },
          ]}
        />
      </Card>

      <SectionHeader title="แนวโน้มน้ำตาลในเลือด" />
      <Card>
        <TrendLineChart unit="mg/dL" series={[{ label: 'น้ำตาลในเลือด', color: theme.warning, points: sugarTrend }]} />
      </Card>

      <SectionHeader title="แนวโน้มน้ำหนัก" />
      <Card>
        <TrendLineChart unit="กก." series={[{ label: 'น้ำหนัก', color: theme.teal, points: weightTrend }]} />
      </Card>

      <SectionHeader title="บันทึกสุขภาพล่าสุด" />
      <VitalsSummary memberId={selfMemberId} showAddButton={false} />

      <SectionHeader title="นัดหมายที่จะถึง" />
      {myAppointments.length === 0 ? (
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            ไม่มีนัดหมายที่จะถึง
          </ThemedText>
        </Card>
      ) : (
        <View style={styles.list}>
          {myAppointments.map((apt) => (
            <Pressable
              key={apt.id}
              onPress={() => router.push({ pathname: '/appointment-detail', params: { id: apt.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${apt.title} วันที่ ${apt.date}`}
              style={({ pressed }) => pressed && styles.pressed}>
              <Card gap={Spacing.one} style={styles.row}>
                <View style={styles.rowBody}>
                  <ThemedText type="smallBold">{apt.title}</ThemedText>
                  <ThemedText type="caption" themeColor="textMuted">
                    {apt.hospital}
                  </ThemedText>
                </View>
                <StatusBadge label={relativeDayLabel(apt.date)} tone="primary" dot={false} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: Spacing.two },
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBody: { flex: 1, gap: 1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
