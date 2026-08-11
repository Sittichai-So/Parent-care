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

type Field = 'email' | 'password';

const demoAccounts = [
  { label: 'ผู้ดูแล', email: 'caregiver@gmail.com', icon: '👨‍👩‍👧' },
  { label: 'ผู้สูงอายุ', email: 'elder@gmail.com', icon: '🧓' },
  { label: 'ผู้ดูแลระบบ', email: 'admin@gmail.com', icon: '🛠️' },
];

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('โปรดกรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setError(null);

    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setError(message);
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', message);
    }
  };

  return (
    <Screen keyboardAvoiding gap={Spacing.four} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: theme.primarySoft }]}>
          <ThemedText style={styles.logoGlyph}>💙</ThemedText>
        </View>
        <ThemedText type="display" style={styles.appName}>
          Parent Care
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
          ดูแลพ่อแม่ร่วมกันทั้งครอบครัว ในที่เดียว
        </ThemedText>
      </View>

      <Card gap={Spacing.three} padding={Spacing.four}>
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
              placeholder="รหัสผ่าน"
              placeholderTextColor={theme.placeholder}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              accessibilityLabel="รหัสผ่าน"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
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

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
            <ThemedText type="small" style={{ color: theme.dangerText }}>
              ⚠️ {error}
            </ThemedText>
          </View>
        ) : null}

        <AppButton
          label="เข้าสู่ระบบ"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          accessibilityHint="เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่กรอก"
        />
      </Card>

      <Card tone="sunken" elevation="flat" gap={Spacing.two}>
        <ThemedText type="smallBold">บัญชีทดสอบ · แตะเพื่อกรอกอัตโนมัติ</ThemedText>
        <View style={styles.demoList}>
          {demoAccounts.map((account) => (
            <Pressable
              key={account.email}
              onPress={() => {
                setEmail(account.email);
                setPassword('1234');
                setError(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={`ใช้บัญชีทดสอบ ${account.label}`}
              style={({ pressed }) => [
                styles.demoChip,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                email === account.email && { borderColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <ThemedText style={styles.demoIcon}>{account.icon}</ThemedText>
              <View style={styles.demoText}>
                <ThemedText type="smallBold">{account.label}</ThemedText>
                <ThemedText type="caption" themeColor="textMuted">
                  {account.email}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
        <ThemedText type="caption" themeColor="textMuted">
          ทุกบัญชีใช้รหัสผ่าน 1234
        </ThemedText>
      </Card>
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
  demoList: { gap: Spacing.two },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: HitSize.medium,
  },
  demoIcon: { fontSize: 20, lineHeight: 26 },
  demoText: { flex: 1, gap: 1 },
  pressed: { opacity: 0.7 },
});
