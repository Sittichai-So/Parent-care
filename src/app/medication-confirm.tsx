import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function MedicationConfirmScreen() {
  const router = useRouter();
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCapture = () => {
    setPhotoCaptured(true);
    Alert.alert('ถ่ายรูปสำเร็จ', 'ภาพยืนยันจากกล้องพร้อมแล้ว');
  };

  const handleConfirm = () => {
    if (!photoCaptured) {
      Alert.alert('ยังไม่ได้ถ่ายรูป', 'กรุณาถ่ายภาพยืนยันก่อนกดยืนยัน');
      return;
    }

    setConfirmed(true);
    Alert.alert('ยืนยันสำเร็จ', 'ระบบบันทึกการทานยาของคุณแล้ว', [{ text: 'ตกลง', onPress: () => router.back() }]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">ยืนยันการทานยา</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            Amlodipine 5 mg · เวลา 08:00
          </ThemedText>

          <ThemedView style={styles.helperCard}>
            <ThemedText style={styles.helperTitle}>{confirmed ? '✓ ยืนยันแล้ว' : '📸 ต้องถ่ายรูปเพื่อยืนยัน'}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {confirmed ? 'ครอบครัวจะเห็นว่าคุณทานยาตามกำหนดแล้ว' : 'ระบบจำลองกระบวนการถ่ายรูปก่อนส่งยืนยัน'}
            </ThemedText>
          </ThemedView>

          <Pressable style={({ pressed }) => [styles.captureButton, pressed && styles.pressed]} onPress={handleCapture}>
            <ThemedText style={styles.buttonText}>{photoCaptured ? '✓ ถ่ายรูปแล้ว' : '📷 ถ่ายรูปยืนยัน'}</ThemedText>
          </Pressable>

          {photoCaptured ? (
            <ThemedView style={styles.photoPreview}>
              <ThemedText style={styles.photoEmoji}>🩺</ThemedText>
              <ThemedText style={styles.photoText}>ภาพยืนยันพร้อมส่ง</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                รูปนี้จำลองการอัปโหลดจากกล้องเพื่อยืนยันการทานยา
              </ThemedText>
            </ThemedView>
          ) : null}

          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={handleConfirm}>
            <ThemedText style={styles.buttonText}>✓ ทานแล้วและยืนยัน</ThemedText>
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
  card: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.two, backgroundColor: '#FFFFFF' },
  description: { maxWidth: 320 },
  helperCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half, backgroundColor: '#EFF6FF' },
  helperTitle: { fontSize: 15, fontWeight: '700', color: '#1D4ED8' },
  captureButton: { minHeight: 48, borderRadius: 12, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
  photoPreview: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half, backgroundColor: '#F8FAFC', alignItems: 'center' },
  photoEmoji: { fontSize: 28 },
  photoText: { fontWeight: '700' },
  primaryButton: { minHeight: 56, borderRadius: 12, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  secondaryButton: { minHeight: 56, borderRadius: 12, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  buttonTextSecondary: { color: '#111827', fontWeight: '600' },
  pressed: { opacity: 0.9 },
});
