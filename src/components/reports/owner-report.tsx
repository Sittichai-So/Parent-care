import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { BarChart } from '@/components/ui/bar-chart';
import { Card } from '@/components/ui/card';
import { DonutChart } from '@/components/ui/donut-chart';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { MemberStatusMeta } from '@/constants/status';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, relativeDayLabel } from '@/utils/date';
import { adherenceTone, bucketEventsByDay, perMemberAdherence, statusBreakdown, taskBreakdown } from '@/utils/reports';

import { ReportHeader } from './report-header';

/** Household-wide report for the Owner role — the one member who's meant to
 *  see everything: every member's status, task throughput, medication
 *  adherence across the family, and what's coming up next. Distinct from
 *  `CaregiverReport`, which narrows to "my" assigned work. */
export function OwnerReport() {
  const router = useRouter();
  const theme = useTheme();
  const { currentHousehold, familyMembers, tasks, medications, appointments, timeline, setSelectedMemberId } =
    useFamilyContext();

  const attentionMembers = useMemo(
    () => familyMembers.filter((member) => member.status !== 'normal'),
    [familyMembers]
  );
  const openTasks = tasks.filter((task) => task.status !== 'done');
  const statusCounts = useMemo(() => statusBreakdown(familyMembers), [familyMembers]);
  const taskCounts = useMemo(() => taskBreakdown(tasks), [tasks]);
  const memberAdherence = useMemo(() => perMemberAdherence(medications, familyMembers), [medications, familyMembers]);
  const activityByDay = useMemo(() => bucketEventsByDay(timeline, 7), [timeline]);

  const upcomingAppointments = useMemo(
    () =>
      [...appointments]
        .filter((apt) => daysFromToday(apt.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
        .slice(0, 5),
    [appointments]
  );

  const goToMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    router.push('/family-member');
  };

  return (
    <Screen>
      <ReportHeader
        title="รายงานภาพรวมครอบครัว"
        subtitle={currentHousehold ? currentHousehold.name : 'ยังไม่ได้เลือกกลุ่มครอบครัว'}
      />

      <View style={styles.statRow}>
        <StatTile value={familyMembers.length} label="สมาชิกทั้งหมด" tone="primary" />
        <StatTile value={attentionMembers.length} label="ต้องติดตาม" tone="warning" />
        <StatTile value={openTasks.length} label="งานค้าง" tone="danger" />
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

      <SectionHeader title="ความคืบหน้างานในบ้าน" />
      <Card>
        <DonutChart
          centerLabel="งาน"
          data={[
            { label: 'เสร็จแล้ว', value: taskCounts.done, tone: 'success' },
            { label: 'กำลังดำเนินการ', value: taskCounts.inProgress, tone: 'primary' },
            { label: 'รอดำเนินการ', value: taskCounts.pending, tone: 'warning' },
          ]}
        />
      </Card>

      <SectionHeader title="การทานยาวันนี้ ตามสมาชิก" />
      <Card>
        {memberAdherence.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            ยังไม่มีสมาชิกที่มีรายการยาที่ใช้งานอยู่
          </ThemedText>
        ) : (
          <BarChart
            scaleMax={100}
            valueSuffix="%"
            data={memberAdherence.map((entry) => ({ label: entry.name, value: entry.pct, tone: adherenceTone(entry.pct) }))}
          />
        )}
      </Card>

      <SectionHeader title="กิจกรรมในบ้าน 7 วันที่ผ่านมา" />
      <Card>
        <BarChart
          orientation="vertical"
          data={activityByDay.map((bucket) => ({ label: bucket.label, value: bucket.count }))}
        />
      </Card>

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

      <SectionHeader title="สมาชิกที่ต้องติดตาม" count={attentionMembers.length} />
      {attentionMembers.length === 0 ? (
        <Card tone="success" accented elevation="flat">
          <View style={styles.okRow}>
            <Ionicons name="checkmark-circle" size={18} color={theme.success} />
            <ThemedText type="small" style={{ color: theme.successText }}>
              ทุกคนในบ้านสถานะปกติดี
            </ThemedText>
          </View>
        </Card>
      ) : (
        <View style={styles.list}>
          {attentionMembers.map((member) => {
            const status = MemberStatusMeta[member.status];
            return (
              <Pressable
                key={member.id}
                onPress={() => goToMember(member.id)}
                accessibilityRole="button"
                accessibilityLabel={`${member.name} สถานะ ${status.label}`}
                style={({ pressed }) => pressed && styles.pressed}>
                <Card tone="warning" accented elevation="flat" gap={Spacing.one} style={styles.row}>
                  <View style={styles.rowBody}>
                    <ThemedText type="smallBold">{member.name}</ThemedText>
                    <ThemedText type="caption" themeColor="textMuted" numberOfLines={1}>
                      {member.detail}
                    </ThemedText>
                  </View>
                  <StatusBadge label={status.label} tone={status.tone} />
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
  okRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
