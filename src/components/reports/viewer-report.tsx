import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { BarChart } from '@/components/ui/bar-chart';
import { Card } from '@/components/ui/card';
import { DonutChart } from '@/components/ui/donut-chart';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { MemberDisplayStatusMeta } from '@/constants/status';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { daysFromToday, relativeDayLabel } from '@/utils/date';
import { memberDisplayStatus } from '@/utils/member-status';
import { bucketEventsByDay, statusBreakdown } from '@/utils/reports';

import { ReportHeader } from './report-header';

export function ViewerReport() {
  const router = useRouter();
  const { currentHousehold, familyMembers, medications, appointments, timeline, setSelectedMemberId } =
    useFamilyContext();

  const statusCounts = useMemo(() => statusBreakdown(familyMembers), [familyMembers]);
  const activityByDay = useMemo(() => bucketEventsByDay(timeline, 7), [timeline]);

  const upcomingAppointments = useMemo(
    () =>
      [...appointments]
        .filter((apt) => daysFromToday(apt.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
        .slice(0, 3),
    [appointments]
  );

  const goToMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    router.push('/family-member');
  };

  return (
    <Screen
      header={
        <ReportHeader
          title="รายงานสถานะครอบครัว"
          subtitle={currentHousehold ? currentHousehold.name : 'ยังไม่ได้เลือกกลุ่มครอบครัว'}
        />
      }>
      <View style={styles.statRow}>
        <StatTile value={statusCounts.normal} label="ปกติดี" tone="success" />
        <StatTile value={statusCounts.monitor + statusCounts.urgent} label="ต้องติดตาม" tone="warning" />
        <StatTile value={familyMembers.length} label="สมาชิกทั้งหมด" tone="primary" />
      </View>

      <SectionHeader title="สถานะสมาชิกในบ้าน" />
      <Card>
        <DonutChart
          centerLabel="คน"
          data={[
            { label: 'ปกติดี', value: statusCounts.normal, tone: 'success' },
            { label: 'ต้องติดตาม', value: statusCounts.monitor, tone: 'warning' },
            { label: 'ต้องช่วยเหลือ', value: statusCounts.urgent, tone: 'danger' },
          ]}
        />
      </Card>

      <SectionHeader title="กิจกรรมในบ้าน 7 วันที่ผ่านมา" />
      <Card>
        <BarChart
          orientation="vertical"
          data={activityByDay.map((bucket) => ({ label: bucket.label, value: bucket.count }))}
        />
      </Card>

      <SectionHeader title="สมาชิกในบ้านทั้งหมด" count={familyMembers.length} />
      <View style={styles.list}>
        {familyMembers.map((member) => {
          const status = MemberDisplayStatusMeta[memberDisplayStatus(member, medications)];
          return (
            <Pressable
              key={member.id}
              onPress={() => goToMember(member.id)}
              accessibilityRole="button"
              accessibilityLabel={`${member.name} สถานะ ${status.label}`}
              accessibilityHint="ดูรายละเอียดสมาชิก"
              style={({ pressed }) => pressed && styles.pressed}>
              <Card gap={Spacing.one} style={styles.row}>
                <View style={styles.rowBody}>
                  <ThemedText type="smallBold">{member.name}</ThemedText>
                  <ThemedText type="caption" themeColor="textMuted">
                    {member.relation}
                  </ThemedText>
                </View>
                <StatusBadge label={status.label} tone={status.tone} />
              </Card>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="นัดหมายที่จะถึง" />
      {upcomingAppointments.length === 0 ? (
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            ไม่มีนัดหมายที่จะถึง
          </ThemedText>
        </Card>
      ) : (
        <View style={styles.list}>
          {upcomingAppointments.map((apt) => {
            const memberName = familyMembers.find((member) => member.id === apt.memberId)?.name ?? '';
            return (
              <Pressable
                key={apt.id}
                onPress={() => router.push({ pathname: '/appointment-detail', params: { id: apt.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${apt.title} ของ ${memberName} วันที่ ${apt.date}`}
                style={({ pressed }) => pressed && styles.pressed}>
                <Card gap={Spacing.one} style={styles.row}>
                  <View style={styles.rowBody}>
                    <ThemedText type="smallBold">{apt.title}</ThemedText>
                    <ThemedText type="caption" themeColor="textMuted">
                      {memberName} · {apt.hospital}
                    </ThemedText>
                  </View>
                  <StatusBadge label={relativeDayLabel(apt.date)} tone="primary" dot={false} />
                </Card>
              </Pressable>
            );
          })}
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
