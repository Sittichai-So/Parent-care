import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('โปรดกรอกชื่อ อีเมล และรหัสผ่านให้ครบถ้วน');
      return;
    }
    if (password.length < 4) {
      setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setError(null);

    try {
      // household-setup (the next screen the root guard sends a fresh
      // account to) reads useAuth().isAuthenticated, so no explicit
      // navigation is needed here — replace covers the case where the
      // guard hasn't re-evaluated yet on some platforms.
      await register(name.trim(), email.trim(), password, phone.trim() || undefined);
      router.replace('/household-setup');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setError(message);
      Alert.alert('สมัครสมาชิกไม่สำเร็จ', message);
    }
  };

  return (
    <Screen keyboardAvoiding gap={Spacing.four} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="heart" size={32} color={theme.primary} />
        </View>
        <ThemedText type="display" style={styles.appName}>
          สร้างบัญชีใหม่
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
          สมัครสมาชิกเพื่อสร้างหรือเข้าร่วมกลุ่มครอบครัว
        </ThemedText>
      </View>

      <Card gap={Spacing.three} padding={Spacing.four}>
        <TextField
          label="ชื่อ-นามสกุล"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (error) setError(null);
          }}
          placeholder="เช่น คุณสมชาย ใจดี"
          required
        />
        <TextField
          label="อีเมล"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (error) setError(null);
          }}
          placeholder="you@example.com"
          keyboardType="email-address"
          required
        />
        <TextField
          label="เบอร์โทร (ไม่บังคับ)"
          value={phone}
          onChangeText={setPhone}
          placeholder="08X-XXX-XXXX"
          keyboardType="phone-pad"
        />
        <TextField
          label="รหัสผ่าน"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (error) setError(null);
          }}
          placeholder="อย่างน้อย 4 ตัวอักษร"
          secureTextEntry
          required
        />
        <TextField
          label="ยืนยันรหัสผ่าน"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            if (error) setError(null);
          }}
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          secureTextEntry
          required
        />

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.dangerText} />
            <ThemedText type="small" style={{ color: theme.dangerText, flex: 1 }}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        <AppButton
          label="สมัครสมาชิก"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          accessibilityHint="สร้างบัญชีใหม่ด้วยข้อมูลที่กรอก"
        />
      </Card>

      <Pressable
        onPress={() => router.replace('/login')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.loginLink, pressed && styles.pressed]}>
        <ThemedText type="small" themeColor="textSecondary">
          มีบัญชีอยู่แล้ว? <ThemedText type="smallBold" themeColor="primary">เข้าสู่ระบบ</ThemedText>
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', paddingBottom: Spacing.five },
  header: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.four },
  logo: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: { textAlign: 'center' },
  tagline: { textAlign: 'center', maxWidth: 300 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  loginLink: { alignItems: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
});
