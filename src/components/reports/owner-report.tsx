import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CheckCircleIcon, HospitalIcon, InfoIcon, WarningCircleIcon } from 'phosphor-react-native';

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
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import { daysFromToday, isDateInCurrentMonth, relativeDayLabel } from '@/utils/date';
import {
  adherenceTone,
  bucketEventsByDay,
  medicationAdherence,
  memberAdherenceDetail,
  statusBreakdown,
  taskBreakdown,
} from '@/utils/reports';

import { ReportHeader } from './report-header';

const rangeOptions = [
  { value: '7', label: '7 วัน' },
  { value: '30', label: '30 วัน' },
  { value: '90', label: '3 เดือน' },
] as const;
const rangeDays: Record<(typeof rangeOptions)[number]['value'], number> = { '7': 7, '30': 30, '90': 90 };

/** Fixed placeholder numbers — this app has no expense-tracking feature or
 *  data behind it. Shown only to preview the reference design's layout,
 *  never presented as real spending (see the banner above it). Colours are
 *  assigned from the theme below, not hardcoded, so dark mode still works. */
const DEMO_SPEND_META = [
  { label: 'ค่ายา', baht: '620', pct: 15 },
  { label: 'ค่าตรวจอายุรกรรม', baht: '1,900', pct: 44 },
  { label: 'ค่าเดินทางโรงพยาบาล', baht: '1,760', pct: 41 },
] as const;

/** Household-wide report for the Owner role — the one member who's meant to
 *  see everything: every member's status, task throughput, medication
 *  adherence across the family, and what's coming up next. Distinct from
 *  `CaregiverReport`, which narrows to "my" assigned work. */
export function OwnerReport() {
  const router = useRouter();
  const theme = useTheme();
  const { currentHousehold, familyMembers, tasks, medications, appointments, timeline, setSelectedMemberId } =
    useFamilyContext();

  const [range, setRange] = useState<(typeof rangeOptions)[number]['value']>('7');

  const attentionMembers = useMemo(
    () => familyMembers.filter((member) => member.status !== 'normal'),
    [familyMembers]
  );
  const openTasks = tasks.filter((task) => task.status !== 'done');
  const statusCounts = useMemo(() => statusBreakdown(familyMembers), [familyMembers]);
  const taskCounts = useMemo(() => taskBreakdown(tasks), [tasks]);
  const memberDetail = useMemo(() => memberAdherenceDetail(medications, familyMembers), [medications, familyMembers]);
  const dailyAdherence = useMemo(() => medicationAdherence(medications), [medications]);
  const monthAppointmentCount = useMemo(
    () => appointments.filter((apt) => isDateInCurrentMonth(apt.date)).length,
    [appointments]
  );
  const activityByDay = useMemo(() => bucketEventsByDay(timeline, rangeDays[range]), [timeline, range]);

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

  const demoSpend = DEMO_SPEND_META.map((entry, index) => ({
    ...entry,
    fill: [theme.primary, theme.teal, theme.warning][index],
  }));

  return (
    <Screen
      header={
        <ReportHeader
          title="รายงานภาพรวมครอบครัว"
          subtitle={currentHousehold ? currentHousehold.name : 'ยังไม่ได้เลือกกลุ่มครอบครัว'}
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

      <SectionHeader title={`กิจกรรมในบ้าน ${rangeDays[range]} วันที่ผ่านมา`} />
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

      <SectionHeader title="ค่าใช้จ่ายเดือนนี้" />
      <Card gap={Spacing.three}>
        <View style={styles.demoBadgeRow}>
          <InfoIcon weight="duotone" size={14} color={theme.warningText} />
          <ThemedText type="caption" style={{ color: theme.warningText }}>
            ตัวอย่างดีไซน์ — แอปยังไม่มีระบบบันทึกค่าใช้จ่ายจริง ตัวเลขด้านล่างเป็นตัวอย่างคงที่
          </ThemedText>
        </View>
        <View style={styles.spendHeadRow}>
          <ThemedText style={styles.spendTotal}>4,280</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            บาท · 6 รายการ
          </ThemedText>
        </View>
        <View style={styles.spendBar}>
          {demoSpend.map((entry) => (
            <View key={entry.label} style={{ width: `${entry.pct}%`, backgroundColor: entry.fill }} />
          ))}
        </View>
        <View style={styles.spendLegend}>
          {demoSpend.map((entry) => (
            <View key={entry.label} style={styles.spendLegendRow}>
              <View style={[styles.spendDot, { backgroundColor: entry.fill }]} />
              <ThemedText type="small" style={styles.spendLegendLabel}>
                {entry.label}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {entry.baht} บาท
              </ThemedText>
            </View>
          ))}
        </View>
      </Card>

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
  demoBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  spendHeadRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  spendTotal: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.4 },
  spendBar: { flexDirection: 'row', height: 12, borderRadius: Radius.sm, overflow: 'hidden' },
  spendLegend: { gap: Spacing.one },
  spendLegendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  spendDot: { width: 9, height: 9, borderRadius: Radius.full },
  spendLegendLabel: { flex: 1 },
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBody: { flex: 1, gap: 1 },
  okRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
