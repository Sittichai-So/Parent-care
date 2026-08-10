import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type MemberStatus = 'normal' | 'monitor';

type FamilyMemberCard = {
  name: string;
  role: string;
  status: MemberStatus;
  detail: string;
};

const familyMembers: FamilyMemberCard[] = [
  { name: 'แม่สมใจ', role: 'Elder', status: 'normal', detail: 'Check-in 08:32' },
  { name: 'พ่อประสิทธิ์', role: 'Elder', status: 'monitor', detail: 'ยา 12:00 ยังไม่ยืนยัน' },
  { name: 'พี่เกษม', role: 'Caregiver', status: 'normal', detail: 'รับผิดชอบดูแลวันนี้' },
];

const tasks = [
  { label: 'Check-in', detail: 'แม่สมใจยืนยันแล้ว', icon: '✓' },
  { label: 'Medication', detail: 'ยา 08:00 กำลังรอยืนยัน', icon: '💊' },
  { label: 'Appointment', detail: 'นัดตรวจ 14:00 พร้อม checklist', icon: '🏥' },
];

const timeline = [
  { title: 'Check-in completed', time: '08:32', detail: 'แม่สมใจยืนยันว่าปกติดี' },
  { title: 'Medication confirmation', time: '08:45', detail: 'Photo confirmation ถูกเพิ่มแล้ว' },
  { title: 'Family task assigned', time: '10:20', detail: 'พี่เกษมรับผิดชอบจัดเตรียมโรงพยาบาล' },
];

const statusConfig: Record<MemberStatus, { label: string; background: string; text: string }> = {
  normal: { label: '🟢 ปกติ', background: '#ECFDF5', text: '#065F46' },
  monitor: { label: '🟡 ต้องติดตาม', background: '#FFFBEB', text: '#92400E' },
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function HomeScreen() {
  const router = useRouter();
  const sortedMembers = [...familyMembers].sort((a, b) => {
    const priority = { normal: 1, monitor: 0 } as const;
    return priority[a.status] - priority[b.status] || a.name.localeCompare(b.name);
  });

  const needsAttention = sortedMembers.filter((member) => member.status !== 'normal').length;
  const nextAttention = sortedMembers.find((member) => member.status !== 'normal');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.heroCard}>
            <ThemedText style={styles.heroTitle}>สวัสดี คุณสมชาย</ThemedText>
            <ThemedText style={styles.heroSubtitle}>วันนี้มี {needsAttention} รายการที่ควรตรวจสอบ</ThemedText>
            <ThemedView style={styles.heroRow}>
              <ThemedView type="backgroundElement" style={styles.statusPill}>
                <ThemedText type="smallBold" themeColor="success">
                  🟢 {familyMembers.filter((member) => member.status === 'normal').length} ปกติ
                </ThemedText>
              </ThemedView>
              <ThemedText themeColor="textSecondary" type="small">
                Check-in ล่าสุด 08:32
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="smallBold">สถานะครอบครัววันนี้</ThemedText>
            <ThemedText type="subtitle">ดูสถานะสำคัญแบบสั้น ๆ ก่อนกดเข้าไปดูรายละเอียด</ThemedText>
          </ThemedView>

          {nextAttention ? (
            <ThemedView style={styles.alertCard}>
              <ThemedText style={styles.alertTitle}>⚠️ ต้องติดตามก่อน</ThemedText>
              <ThemedText style={styles.alertText}>{nextAttention.name} · {statusConfig[nextAttention.status].label}</ThemedText>
            </ThemedView>
          ) : null}

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            สมาชิกในบ้าน
          </ThemedText>
          <ThemedView style={styles.familyList}>
            {sortedMembers.map((member) => (
              <ThemedView key={member.name} type="backgroundElement" style={[styles.memberCard, member.status !== 'normal' && styles.memberCardAttention]}>
                <ThemedView style={styles.avatarWrap}>
                  <ThemedText style={styles.avatarText}>{getInitials(member.name)}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.memberBody}>
                  <ThemedView style={styles.memberHeader}>
                    <ThemedText type="smallBold">{member.name}</ThemedText>
                    <ThemedText themeColor="textSecondary" type="small">
                      {member.role}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={[styles.statusBadge, { backgroundColor: statusConfig[member.status].background }]}>
                    <ThemedText style={[styles.statusBadgeText, { color: statusConfig[member.status].text }]}>
                      {statusConfig[member.status].label}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText themeColor="textSecondary" type="small">
                    {member.detail}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            งานที่ต้องดูแลวันนี้
          </ThemedText>
          <ThemedView style={styles.taskList}>
            {tasks.map((task) => (
              <ThemedView key={task.label} type="backgroundElement" style={styles.taskItem}>
                <ThemedText style={styles.taskIcon}>{task.icon}</ThemedText>
                <ThemedView style={styles.taskTextWrap}>
                  <ThemedText type="smallBold">{task.label}</ThemedText>
                  <ThemedText themeColor="textSecondary" type="small">
                    {task.detail}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            การดำเนินการด่วน
          </ThemedText>
          <ThemedView style={styles.quickActions}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => Alert.alert('บันทึกสำเร็จ', 'จำลองการตรวจสอบสถานะเรียบร้อยแล้ว')}>
              <ThemedText style={styles.buttonText}>✓ ตรวจสอบสถานะ</ThemedText>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => router.push('/appointment-detail')}>
              <ThemedText style={styles.buttonTextSecondary}>📅 ดูนัดหมาย</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Family timeline
          </ThemedText>
          <ThemedView style={styles.timelineList}>
            {timeline.map((item) => (
              <ThemedView key={item.title} type="backgroundElement" style={styles.timelineItem}>
                <ThemedText type="smallBold">{item.title}</ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  {item.time}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.timelineDetail}>
                  {item.detail}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.three, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  scrollContent: { gap: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.five },
  heroCard: { borderRadius: Spacing.four, padding: Spacing.four, gap: Spacing.two, backgroundColor: '#0F172A' },
  heroTitle: { fontSize: 28, fontWeight: '700', lineHeight: 34, color: '#FFFFFF' },
  heroSubtitle: { fontSize: 16, lineHeight: 24, color: '#E2E8F0' },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.one },
  statusPill: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.half },
  summaryCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one, backgroundColor: '#F8FAFC' },
  alertCard: { borderRadius: Spacing.three, padding: Spacing.three, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74' },
  alertTitle: { fontSize: 15, fontWeight: '700', color: '#9A2C00' },
  alertText: { marginTop: Spacing.half, color: '#9A2C00' },
  sectionTitle: { marginTop: Spacing.one },
  familyList: { gap: Spacing.two },
  memberCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF' },
  memberCardAttention: { borderWidth: 1, borderColor: '#F59E0B' },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '700' },
  memberBody: { flex: 1, gap: Spacing.half, marginLeft: Spacing.two },
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.half },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  taskList: { gap: Spacing.two },
  taskItem: { flexDirection: 'row', alignItems: 'center', borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  taskIcon: { fontSize: 22 },
  taskTextWrap: { flex: 1, gap: Spacing.half },
  quickActions: { gap: Spacing.two },
  primaryButton: { minHeight: 56, borderRadius: 12, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.three },
  secondaryButton: { minHeight: 56, borderRadius: 12, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.three },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: '#111827', fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.9 },
  timelineList: { gap: Spacing.two },
  timelineItem: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half },
  timelineDetail: { marginTop: Spacing.half },
});
