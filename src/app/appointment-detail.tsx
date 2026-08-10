import { Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const familyCalendar = [
  { day: 'จ', date: '12', title: 'ตรวจสุขภาพ', time: '09:00', type: 'main' },
  { day: 'อ', date: '14', title: 'รับยา', time: '12:00', type: 'med' },
  { day: 'พ', date: '16', title: 'นัดหมอ', time: '15:30', type: 'care' },
];

export default function AppointmentDetailScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">รายละเอียดนัดหมาย</ThemedText>
          <ThemedText themeColor="textSecondary">12 สิงหาคม 09:00</ThemedText>
          <ThemedText>โรงพยาบาลกรุงเทพ</ThemedText>
          <ThemedText themeColor="textSecondary">อายุรกรรม • หมอพงศ์</ThemedText>

          <ThemedView style={styles.calendarCard}>
            <ThemedText style={styles.calendarTitle}>ปฏิทินครอบครัว</ThemedText>
            <ThemedView style={styles.calendarGrid}>
              {familyCalendar.map((item) => (
                <ThemedView key={`${item.day}-${item.date}`} style={styles.calendarItem}>
                  <ThemedText style={styles.calendarDay}>{item.day}</ThemedText>
                  <ThemedText style={styles.calendarDate}>{item.date}</ThemedText>
                  <ThemedText style={styles.calendarItemTitle}>{item.title}</ThemedText>
                  <ThemedText themeColor="textSecondary" type="small">
                    {item.time}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={() => {
              Alert.alert('เตือนแล้ว', 'ระบบจำลองบันทึกการเตือนนัดหมายเรียบร้อยแล้ว');
            }}>
            <ThemedText style={styles.buttonText}>บันทึกเตือน</ThemedText>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => router.back()}>
            <ThemedText style={styles.buttonTextSecondary}>ย้อนกลับ</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.three, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%', justifyContent: 'center' },
  card: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.two, backgroundColor: '#FFFFFF' },
  calendarCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two, backgroundColor: '#F8FAFC' },
  calendarTitle: { fontSize: 15, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.one },
  calendarItem: { flex: 1, borderRadius: 12, padding: Spacing.one, backgroundColor: '#FFFFFF', alignItems: 'center', gap: Spacing.half },
  calendarDay: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  calendarDate: { fontSize: 18, fontWeight: '700' },
  calendarItemTitle: { fontSize: 12, textAlign: 'center' },
  primaryButton: { minHeight: 56, borderRadius: 12, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.one },
  secondaryButton: { minHeight: 56, borderRadius: 12, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.two },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  buttonTextSecondary: { color: '#111827', fontWeight: '600' },
  pressed: { opacity: 0.9 },
});
