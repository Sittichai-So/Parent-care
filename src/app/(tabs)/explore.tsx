import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const elderActions = [
  { label: 'ฉันสบายดี', detail: 'บอกครอบครัวว่าอยู่ดี', icon: '✓', route: '/medication-confirm' as const },
  { label: 'ยาของฉัน', detail: 'ดูและยืนยันการทานยา', icon: '💊', route: '/medication-confirm' as const },
  { label: 'นัดหมาย', detail: 'ดูวันตรวจและสถานที่', icon: '🏥', route: '/appointment-detail' as const },
  { label: 'ต้องการความช่วยเหลือ', detail: 'ส่งคำขอไปยังครอบครัว', icon: '🆘', route: '/emergency' as const },
];

function getTodayLabel() {
  const today = new Date();
  return `วันนี้ ${today.toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}`;
}

export default function CarePlanScreen() {
  const router = useRouter();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">สวัสดีครับ คุณแม่</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.intro}>
            {getTodayLabel()} คุณมี 3 สิ่งที่ควรดูแลเรียบร้อย
          </ThemedText>

          <ThemedView style={styles.statusCard}>
            <ThemedText style={styles.statusEmoji}>🟢</ThemedText>
            <ThemedText style={styles.statusTitle}>วันนี้ปกติดี</ThemedText>
            <ThemedText themeColor="textSecondary">อย่าลืมทานยาและดูนัดหมายในช่วงบ่าย</ThemedText>
          </ThemedView>

          <ThemedView style={styles.actionsGrid}>
            {elderActions.map((action, index) => (
              <Pressable
                key={action.label}
                onPress={() => {
                  Alert.alert('กำลังเปิดหน้า', `${action.label} ถูกเลือกแล้ว`);
                  router.push(action.route);
                }}
                style={({ pressed }) => [
                  styles.actionButton,
                  index === elderActions.length - 1 && styles.emergencyButton,
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={styles.actionIcon}>{action.icon}</ThemedText>
                <ThemedText type="smallBold">{action.label}</ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  {action.detail}
                </ThemedText>
              </Pressable>
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
  intro: { maxWidth: 520, fontSize: 16, lineHeight: 24, color: '#64748B' },
  statusCard: { borderRadius: 20, padding: Spacing.four, gap: Spacing.one, backgroundColor: '#FFFFFF', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, borderWidth: 2, borderColor: '#10B981' },
  statusEmoji: { fontSize: 32 },
  statusTitle: { fontSize: 22, fontWeight: '800', color: '#065F46' },
  actionsGrid: { gap: Spacing.two },
  actionButton: { minHeight: 88, borderRadius: 20, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, backgroundColor: '#FFFFFF', gap: Spacing.half, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  emergencyButton: { backgroundColor: '#FEF2F2', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, borderWidth: 2, borderColor: '#FCA5A5', minHeight: 98 },
  actionIcon: { fontSize: 28 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
