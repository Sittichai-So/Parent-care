import { Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function EmergencyScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">🆘 ต้องการความช่วยเหลือ</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            คุณต้องการให้ครอบครัวช่วยเหลือใช่ไหม?
          </ThemedText>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={() => {
              Alert.alert('ส่งคำขอแล้ว', 'ครอบครัวได้รับคำสั่งจำลองเรียบร้อยแล้ว', [{ text: 'ตกลง', onPress: () => router.back() }]);
            }}>
            <ThemedText style={styles.buttonText}>✓ ใช่ ต้องการความช่วยเหลือ</ThemedText>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => router.back()}>
            <ThemedText style={styles.buttonTextSecondary}>ยกเลิก</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.three, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%', justifyContent: 'center' },
  card: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.three, backgroundColor: '#FFFFFF' },
  description: { maxWidth: 320 },
  primaryButton: { minHeight: 56, borderRadius: 12, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center' },
  secondaryButton: { minHeight: 56, borderRadius: 12, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  buttonTextSecondary: { color: '#111827', fontWeight: '600' },
  pressed: { opacity: 0.9 },
});
