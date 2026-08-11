import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { HitSize, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

type Field = 'name' | 'email' | 'phone' | 'password' | 'confirmPassword';

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focused, setFocused] = useState<Field | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = (field: Field) => [
    styles.input,
    {
      backgroundColor: theme.inputBackground,
      color: theme.text,
      borderColor: focused === field ? theme.primary : theme.border,
      borderWidth: focused === field ? 2 : 1,
    },
  ];

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
          <ThemedText style={styles.logoGlyph}>💙</ThemedText>
        </View>
        <ThemedText type="display" style={styles.appName}>
          สร้างบัญชีใหม่
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
          สมัครสมาชิกเพื่อสร้างหรือเข้าร่วมกลุ่มครอบครัว
        </ThemedText>
      </View>

      <Card gap={Spacing.three} padding={Spacing.four}>
        <View style={styles.field}>
          <ThemedText type="smallBold">ชื่อ-นามสกุล</ThemedText>
          <TextInput
            style={inputStyle('name')}
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (error) setError(null);
            }}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            placeholder="เช่น คุณสมชาย ใจดี"
            placeholderTextColor={theme.placeholder}
            editable={!isLoading}
            accessibilityLabel="ชื่อ-นามสกุล"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">อีเมล</ThemedText>
          <TextInput
            style={inputStyle('email')}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (error) setError(null);
            }}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            placeholder="you@example.com"
            placeholderTextColor={theme.placeholder}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!isLoading}
            accessibilityLabel="อีเมล"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">เบอร์โทร (ไม่บังคับ)</ThemedText>
          <TextInput
            style={inputStyle('phone')}
            value={phone}
            onChangeText={setPhone}
            onFocus={() => setFocused('phone')}
            onBlur={() => setFocused(null)}
            placeholder="08X-XXX-XXXX"
            placeholderTextColor={theme.placeholder}
            keyboardType="phone-pad"
            editable={!isLoading}
            accessibilityLabel="เบอร์โทร"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">รหัสผ่าน</ThemedText>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[...inputStyle('password'), styles.passwordInput]}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (error) setError(null);
              }}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              placeholder="อย่างน้อย 4 ตัวอักษร"
              placeholderTextColor={theme.placeholder}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              accessibilityLabel="รหัสผ่าน"
              returnKeyType="next"
            />
            <Pressable
              onPress={() => setShowPassword((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              hitSlop={Spacing.two}
              style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
              <ThemedText type="caption" themeColor="primary">
                {showPassword ? 'ซ่อน' : 'แสดง'}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">ยืนยันรหัสผ่าน</ThemedText>
          <TextInput
            style={inputStyle('confirmPassword')}
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (error) setError(null);
            }}
            onFocus={() => setFocused('confirmPassword')}
            onBlur={() => setFocused(null)}
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            placeholderTextColor={theme.placeholder}
            secureTextEntry={!showPassword}
            editable={!isLoading}
            accessibilityLabel="ยืนยันรหัสผ่าน"
            returnKeyType="go"
            onSubmitEditing={handleRegister}
          />
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
            <ThemedText type="small" style={{ color: theme.dangerText }}>
              ⚠️ {error}
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
  logoGlyph: { fontSize: 34, lineHeight: 42 },
  appName: { textAlign: 'center' },
  tagline: { textAlign: 'center', maxWidth: 300 },
  field: { gap: Spacing.two },
  input: {
    minHeight: HitSize.large,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  passwordWrap: { justifyContent: 'center' },
  passwordInput: { paddingRight: 64 },
  toggle: { position: 'absolute', right: Spacing.three, paddingVertical: Spacing.two },
  errorBox: { borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  loginLink: { alignItems: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
});
