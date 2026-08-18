import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { OnboardingHeader } from '@/components/ui/onboarding-header';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

/** Step 1 of the reference design's 2-step register flow — account fields
 *  only. The mock's step 1 also has a role picker (Caregiver/Elder/Viewer),
 *  but that's not a real account attribute here: role is per-household
 *  (`HouseholdRole`), only ever chosen when creating or joining a household
 *  on the next screen — so it's not reproduced here to avoid a field that
 *  looks real but the server has nowhere to put it. */
export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('กรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (password.length < 4) {
      setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
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
    <Screen
      keyboardAvoiding
      gap={Spacing.three}
      header={<OnboardingHeader title="สร้างบัญชี" step={1} onBack={() => router.replace('/login')} />}>
      <View style={styles.form}>
        <TextField
          label="ชื่อที่ใช้แสดง"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (error) setError(null);
          }}
          placeholder="คุณสมชาย"
          required
        />
        <TextField
          label="อีเมล"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (error) setError(null);
          }}
          placeholder="you@gmail.com"
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

        <AppButton
          label="ต่อไป · กลุ่มบ้าน"
          size="large"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          accessibilityHint="สร้างบัญชีใหม่แล้วไปตั้งค่ากลุ่มบ้าน"
        />

        {error ? (
          <ThemedText type="small" style={[styles.status, { color: theme.warningText }]} accessibilityRole="alert">
            {error}
          </ThemedText>
        ) : null}
      </View>

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
  form: { gap: Spacing.three, paddingTop: Spacing.one },
  status: { textAlign: 'center' },
  loginLink: { alignItems: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
});
