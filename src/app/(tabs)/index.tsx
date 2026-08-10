import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext } from '@/context/family-context';

const statusConfig = {
  normal: { label: '🟢 ปกติ', background: '#ECFDF5', text: '#065F46' },
  monitor: { label: '🟡 ต้องติดตาม', background: '#FFFBEB', text: '#92400E' },
  urgent: { label: '🔴 ต้องช่วยเหลือ', background: '#FEF2F2', text: '#991B1B' },
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
  const { user, logout } = useAuth();
  const { familyMembers, tasks, timeline, setSelectedMemberId, updateTaskStatus } = useFamilyContext();

  const sortedMembers = [...familyMembers].sort((a, b) => {
    const priority = { urgent: 0, monitor: 1, normal: 2 } as const;
    return priority[a.status] - priority[b.status] || a.name.localeCompare(b.name);
  });

  const needsAttention = sortedMembers.filter((member) => member.status !== 'normal').length;
  const nextAttention = sortedMembers.find((member) => member.status !== 'normal');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.heroCard}>
            <ThemedView style={styles.heroHeader}>
              <ThemedText style={styles.heroTitle}>สวัสดี {user?.name || 'คุณ'}</ThemedText>
              <Pressable onPress={() => Alert.alert('ออกจากระบบ', 'ต้องการออกจากระบบหรือไม่?', [{ text: 'ยกเลิก' }, { text: 'ออกจากระบบ', style: 'destructive', onPress: () => { logout(); router.replace('/login'); } }])}>
                <ThemedText style={styles.logoutText}>ออกจากระบบ</ThemedText>
              </Pressable>
            </ThemedView>
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
              <ThemedText style={styles.alertText}>
                {nextAttention.name} · {statusConfig[nextAttention.status].label}
              </ThemedText>
            </ThemedView>
          ) : null}

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            สมาชิกในบ้าน
          </ThemedText>
          <ThemedView style={styles.familyList}>
            {sortedMembers.map((member) => (
              <Pressable
                key={member.id}
                onPress={() => {
                  setSelectedMemberId(member.id);
                  router.push('/family-member');
                }}
                style={({ pressed }) => [styles.memberCard, pressed && styles.pressed]}>
                <ThemedView
                  type="backgroundElement"
                  style={[styles.memberInner, member.status !== 'normal' && styles.memberInnerAttention]}>
                  <ThemedView style={styles.avatarWrap}>
                    <ThemedText style={styles.avatarText}>{getInitials(member.name)}</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.memberBody}>
                    <ThemedView style={styles.memberHeader}>
                      <ThemedText type="smallBold">{member.name}</ThemedText>
                      <ThemedText themeColor="textSecondary" type="small">
                        {member.relation}
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
                  <ThemedText style={styles.chevron}>›</ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>

          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              งานที่ต้องดูแลวันนี้
            </ThemedText>
            <Pressable onPress={() => router.push('/appointment-detail')}>
              <ThemedText themeColor="textSecondary" style={styles.linkText}>
                ดูทั้งหมด
              </ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedView style={styles.taskList}>
            {tasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => {
                  const nextStatus = task.status === 'done' ? 'pending' : 'done';
                  updateTaskStatus(task.id, nextStatus);
                  Alert.alert('อัปเดตงานแล้ว', `${task.title} ถูกเปลี่ยนเป็น ${nextStatus === 'done' ? 'เสร็จแล้ว' : 'รอดำเนินการ'}`);
                }}
                style={({ pressed }) => [styles.taskItem, pressed && styles.pushed]}>
                <ThemedText style={styles.taskIcon}>{task.status === 'done' ? '✓' : task.title === 'Medication' ? '💊' : '🏥'}</ThemedText>
                <ThemedView style={styles.taskTextWrap}>
                  <ThemedText type="smallBold">{task.title}</ThemedText>
                  <ThemedText themeColor="textSecondary" type="small">
                    {task.detail}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>

          <ThemedText type="smallBold" style={styles.sectionTitle}>
            การดำเนินการด่วน
          </ThemedText>
          <ThemedView style={styles.quickActions}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => {
                updateTaskStatus('checkin', 'done');
                Alert.alert('บันทึกสำเร็จ', 'จำลองการตรวจสอบสถานะเรียบร้อยแล้ว');
              }}>
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
              <ThemedView key={item.id} type="backgroundElement" style={styles.timelineItem}>
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
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.three, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  scrollContent: { gap: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.five },
  heroCard: { borderRadius: 20, padding: Spacing.four, gap: Spacing.two, backgroundColor: '#1E293B', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '800', lineHeight: 32, color: '#FFFFFF', letterSpacing: 0.3 },
  heroSubtitle: { fontSize: 15, lineHeight: 22, color: '#CBD5E1' },
  logoutText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', opacity: 0.85, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.one },
  statusPill: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.half, backgroundColor: 'rgba(255,255,255,0.1)' },
  summaryCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.one, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  alertCard: { borderRadius: 16, padding: Spacing.three, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: '#92400E' },
  alertText: { marginTop: Spacing.half, color: '#92400E', fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.two },
  sectionTitle: { marginTop: Spacing.one, fontSize: 16, fontWeight: '700', color: '#1E293B' },
  familyList: { gap: Spacing.two },
  memberCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  memberInner: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF' },
  memberInnerAttention: { borderWidth: 2, borderColor: '#F59E0B' },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
  memberBody: { flex: 1, gap: Spacing.one },
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  statusBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  chevron: { fontSize: 24, color: '#94A3B8', marginLeft: Spacing.one },
  taskList: { gap: Spacing.two },
  taskItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: Spacing.three, gap: Spacing.two, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  taskIcon: { fontSize: 24 },
  taskTextWrap: { flex: 1, gap: Spacing.half },
  quickActions: { gap: Spacing.two },
  primaryButton: { minHeight: 56, borderRadius: 16, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.three, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  secondaryButton: { minHeight: 56, borderRadius: 16, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.three, borderWidth: 1, borderColor: '#E2E8F0' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  buttonTextSecondary: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  pushed: { opacity: 0.95 },
  linkText: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },
  timelineList: { gap: Spacing.two },
  timelineItem: { borderRadius: 16, padding: Spacing.three, gap: Spacing.half, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  timelineDetail: { marginTop: Spacing.half },
});
