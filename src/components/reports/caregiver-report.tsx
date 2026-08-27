import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CheckCircleIcon, HospitalIcon, WarningCircleIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { AdherenceRingCard } from '@/components/ui/adherence-ring-card';
import { BarChart } from '@/components/ui/bar-chart';
import { Card } from '@/components/ui/card';
import { DonutChart } from '@/components/ui/donut-chart';
import { MemberAdherenceRow } from '@/components/ui/member-adherence-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { MemberStatusMeta } from '@/constants/status';
import { Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, isDateInCurrentMonth, relativeDayLabel } from '@/utils/date';
import { adherenceTone, bucketEventsByDay, medicationAdherence, memberAdherenceDetail, taskBreakdown } from '@/utils/reports';

import { ReportHeader } from './report-header';

const rangeOptions = [
  { value: '7', label: '7 วัน' },
  { value: '30', label: '30 วัน' },
  { value: '90', label: '3 เดือน' },
] as const;
const rangeDays: Record<(typeof rangeOptions)[number]['value'], number> = { '7': 7, '30': 30, '90': 90 };

export function CaregiverReport() {
  const router = useRouter();
  const theme = useTheme();
  const {
    currentHousehold,
    currentMembershipId,
    familyMembers,
    tasks,
    medications,
    appointments,
    timeline,
    setSelectedMemberId,
  } = useFamilyContext();

  const [range, setRange] = useState<(typeof rangeOptions)[number]['value']>('7');

  const myName = familyMembers.find((member) => member.id === currentMembershipId)?.name ?? '';
  const myTasks = useMemo(() => (myName ? tasks.filter((task) => task.owner === myName) : []), [tasks, myName]);
  const usingHouseholdFallback = myTasks.length === 0;
  const focusTasks = usingHouseholdFallback ? tasks : myTasks;
  const focusTaskCounts = useMemo(() => taskBreakdown(focusTasks), [focusTasks]);

  const attentionMembers = useMemo(
    () => familyMembers.filter((member) => member.status !== 'normal'),
    [familyMembers]
  );
  const memberDetail = useMemo(() => memberAdherenceDetail(medications, familyMembers), [medications, familyMembers]);
  const dailyAdherence = useMemo(() => medicationAdherence(medications), [medications]);
  const monthAppointmentCount = useMemo(
    () => appointments.filter((apt) => isDateInCurrentMonth(apt.date)).length,
    [appointments]
  );
  const careActivityByDay = useMemo(
    () =>
      bucketEventsByDay(
        timeline.filter((event) => event.type === 'task' || event.type === 'medication'),
        rangeDays[range]
      ),
    [timeline, range]
  );

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
          title="รายงานงานดูแลของฉัน"
          subtitle={
            currentHousehold
              ? myName
                ? `${currentHousehold.name} · ผู้ดูแล: ${myName}`
                : currentHousehold.name
              : 'ยังไม่ได้เลือกกลุ่มครอบครัว'
          }
        />
      }>
      <SegmentedToggle options={rangeOptions} value={range} onChange={setRange} />

      <AdherenceRingCard
        pct={dailyAdherence.pct}
        headline={
          dailyAdherence.due === 0
            ? 'ยังไม่มีรายการยาที่ใช้งานอยู่'
            : dailyAdherence.taken >= dailyAdherence.due
              ? 'ทุกคนทานยาครบวันนี้'
              : `เหลือยาที่ยังไม่ยืนยัน ${dailyAdherence.due - dailyAdherence.taken} รายการ`
        }
        sub={`จาก ${dailyAdherence.due} ครั้งที่กำหนดวันนี้ · พลาด ${dailyAdherence.due - dailyAdherence.taken} ครั้ง`}
      />

      <View style={styles.statRow}>
        <StatTile value={dailyAdherence.taken} label="ยืนยันพร้อมรูป" tone="success" phosphorIcon={CheckCircleIcon} />
        <StatTile
          value={dailyAdherence.due - dailyAdherence.taken}
          label="พลาด / เลยเวลา"
          tone="warning"
          phosphorIcon={WarningCircleIcon}
        />
        <StatTile value={monthAppointmentCount} label="นัดหมายเดือนนี้" tone="primary" phosphorIcon={HospitalIcon} />
      </View>

      <View style={styles.statRow}>
        <StatTile value={focusTasks.filter((task) => task.status !== 'done').length} label="งานค้าง" tone="warning" />
        <StatTile value={focusTaskCounts.done} label="เสร็จแล้ว" tone="success" />
        <StatTile value={attentionMembers.length} label="สมาชิกต้องติดตาม" tone="danger" />
      </View>

      <SectionHeader title={usingHouseholdFallback ? 'งานทั้งหมดในบ้าน' : 'งานของฉัน'} />
      {usingHouseholdFallback ? (
        <ThemedText type="caption" themeColor="textMuted">
          ยังไม่มีงานที่มอบหมายให้คุณโดยตรง จึงแสดงภาพรวมงานทั้งหมดของบ้านแทน
        </ThemedText>
      ) : null}
      <Card>
        <DonutChart
          centerLabel="งาน"
          data={[
            { label: 'เสร็จแล้ว', value: focusTaskCounts.done, tone: 'success' },
            { label: 'กำลังดำเนินการ', value: focusTaskCounts.inProgress, tone: 'primary' },
            { label: 'รอดำเนินการ', value: focusTaskCounts.pending, tone: 'warning' },
          ]}
        />
      </Card>

      <SectionHeader title="รายคน" />
      {memberDetail.length === 0 ? (
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            ยังไม่มีสมาชิกที่มีรายการยาที่ใช้งานอยู่
          </ThemedText>
        </Card>
      ) : (
        <View style={styles.list}>
          {memberDetail.map((entry) => (
            <MemberAdherenceRow
              key={entry.memberId}
              name={entry.name}
              pct={entry.pct}
              tone={adherenceTone(entry.pct)}
              note={entry.note}
              onPress={() => goToMember(entry.memberId)}
            />
          ))}
        </View>
      )}

      <SectionHeader title={`กิจกรรมการดูแล ${rangeDays[range]} วันที่ผ่านมา`} />
      <Card>
        <BarChart
          orientation="vertical"
          data={careActivityByDay.map((bucket) => ({ label: bucket.label, value: bucket.count }))}
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
            <CheckCircleIcon weight="fill" size={18} color={theme.success} />
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
