import { Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';

export default function FamilyMemberScreen() {
  const router = useRouter();
  const { selectedMemberId, familyMembers } = useFamilyContext();
  const member = familyMembers.find((item) => item.id === selectedMemberId) ?? familyMembers[0];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">รายละเอียดสมาชิก</ThemedText>
          <ThemedText type="smallBold">{member?.name}</ThemedText>
          <ThemedText themeColor="textSecondary">บทบาท: {member?.role}</ThemedText>
          <ThemedText themeColor="textSecondary">ความสัมพันธ์: {member?.relation}</ThemedText>
          <ThemedText themeColor="textSecondary">สถานะ: {member?.detail}</ThemedText>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={() => {
              Alert.alert('ส่งข้อความแล้ว', `ระบบจำลองส่งข้อความถึง ${member?.name} แล้ว`);
            }}>
            <ThemedText style={styles.buttonText}>ส่งข้อความเตือน</ThemedText>
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
  primaryButton: { minHeight: 56, borderRadius: 12, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.two },
  secondaryButton: { minHeight: 56, borderRadius: 12, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.two },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  buttonTextSecondary: { color: '#111827', fontWeight: '600' },
  pressed: { opacity: 0.9 },
});
