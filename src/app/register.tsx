import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { OnboardingHeader } from '@/components/ui/onboarding-header';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFormError } from '@/hooks/use-form-error';
import { useTheme } from '@/hooks/use-theme';

const isValidThaiPhone = (digits: string) => /^0\d{8,9}$/.test(digits);

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setPendingRegistration } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { error, setError, onFieldChange } = useFormError();

  const handleNext = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError('กรอกข้อมูลที่จำเป็นให้ครบทุกช่อง');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (!isValidThaiPhone(phoneDigits)) {
      setError('เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก)');
      return;
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setError(null);
    setPendingRegistration({
      name: name.trim(),
      email: email.trim(),
      phone: phoneDigits,
      address: address.trim() || undefined,
      password,
    });
    router.push('/household-setup');
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
          onChangeText={onFieldChange(setName)}
          placeholder="คุณสมชาย"
          required
        />
        <TextField
          label="อีเมล"
          value={email}
          onChangeText={onFieldChange(setEmail)}
          placeholder="you@gmail.com"
          keyboardType="email-address"
          required
        />
        <TextField
          label="เบอร์โทร"
          value={phone}
          onChangeText={onFieldChange(setPhone)}
          placeholder="08X-XXX-XXXX"
          keyboardType="phone-pad"
          required
        />
        <TextField
          label="รหัสผ่าน"
          value={password}
          onChangeText={onFieldChange(setPassword)}
          placeholder="อย่างน้อย 6 ตัวอักษร"
          secureTextEntry
          required
        />
        <TextField
          label="ยืนยันรหัสผ่าน"
          value={confirmPassword}
          onChangeText={onFieldChange(setConfirmPassword)}
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          secureTextEntry
          required
        />

        <TextField
          label="ที่อยู่ (ไม่บังคับ)"
          value={address}
          onChangeText={setAddress}
          placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด"
          multiline
        />

        <AppButton
          label="ต่อไป · กลุ่มบ้าน"
          size="large"
          onPress={handleNext}
          accessibilityHint="ไปขั้นตอนถัดไป — ตั้งค่ากลุ่มบ้าน แล้วค่อยสร้างบัญชีจริงตอนนั้น"
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
