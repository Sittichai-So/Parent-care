import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const elderActions = [
  { label: 'ฉันสบายดี', detail: 'บอกครอบครัวว่าอยู่ดี', icon: '✓' },
  { label: 'ยาของฉัน', detail: 'ดูและยืนยันการทานยา', icon: '💊' },
  { label: 'นัดหมาย', detail: 'ดูวันตรวจและสถานที่', icon: '🏥' },
  { label: 'ต้องการความช่วยเหลือ', detail: 'ส่งคำขอไปยังครอบครัว', icon: '🆘' },
];

export default function CarePlanScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">สวัสดีครับ คุณแม่</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.intro}>
            วันนี้ 10 สิงหาคม คุณมี 3 สิ่งที่ควรดูแลเรียบร้อย
          </ThemedText>

          <ThemedView style={styles.statusCard}>
            <ThemedText style={styles.statusEmoji}>🟢</ThemedText>
            <ThemedText style={styles.statusTitle}>วันนี้ปกติดี</ThemedText>
            <ThemedText themeColor="textSecondary">อย่าลืมทานยาและดูนัดหมายในช่วงบ่าย</ThemedText>
          </ThemedView>

          <ThemedView style={styles.actionsGrid}>
            {elderActions.map((action) => (
              <Pressable key={action.label} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
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
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  scrollContent: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  intro: {
    maxWidth: 520,
  },
  statusCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
    backgroundColor: '#E8F5E9',
  },
  statusEmoji: {
    fontSize: 28,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#166534',
  },
  actionsGrid: {
    gap: Spacing.two,
  },
  actionButton: {
    minHeight: 72,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.half,
  },
  actionIcon: {
    fontSize: 24,
  },
  pressed: {
    opacity: 0.9,
  },
});
