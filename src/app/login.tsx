import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('กรุณากรอกข้อมูล', 'โปรดกรอกอีเมลและรหัสผ่าน');
      return;
    }

    try {
      await login(email, password);
      router.replace('/');
    } catch (error) {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.header}>
            <ThemedText style={styles.title}>Parent Care</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              ระบบดูแลผู้สูงอายุสำหรับครอบครัว
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedText type="smallBold">อีเมล</ThemedText>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="อีเมลของคุณ"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />

            <ThemedText type="smallBold" style={styles.passwordLabel}>
              รหัสผ่าน
            </ThemedText>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="รหัสผ่าน"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              editable={!isLoading}
            />

            <Pressable
              style={({ pressed }) => [styles.loginButton, pressed && styles.pressed, isLoading && styles.disabled]}
              onPress={handleLogin}
              disabled={isLoading}>
              <ThemedText style={styles.loginButtonText}>
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </ThemedText>
            </Pressable>

            <ThemedView style={styles.demoCard}>
              <ThemedText style={styles.demoTitle}>📋 บัญชีทดสอบ</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Caregiver: caregiver@gmail.com / 1234
              </ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Elder: elder@gmail.com / 1234
              </ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Admin: admin@gmail.com / 1234
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.three, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  scrollContent: { gap: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.five },
  header: { gap: Spacing.one, alignItems: 'center', paddingTop: Spacing.six },
  title: { fontSize: 32, fontWeight: '700' },
  subtitle: { fontSize: 16, textAlign: 'center' },
  form: { gap: Spacing.two },
  input: { minHeight: 56, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: Spacing.three, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  passwordLabel: { marginTop: Spacing.one },
  loginButton: { minHeight: 56, borderRadius: 12, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.two },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.5 },
  demoCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half, backgroundColor: '#F1F5F9', marginTop: Spacing.two },
  demoTitle: { fontSize: 14, fontWeight: '700' },
});
