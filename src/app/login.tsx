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

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('โปรดกรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setError(null);

    try {
      await login(email.trim(), password);
      // Role (caregiver/elder/...) now lives on the household membership,
      // not the account — the root layout guard sends a household-less
      // account to household-setup, and the tab layout below that picks
      // the right default tab from the current membership's role. Login
      // itself no longer knows or needs to know which.
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
          <Ionicons name="heart" size={32} color={theme.primary} />
        </View>
        <ThemedText type="display" style={styles.appName}>
          Parent Care
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
          ดูแลพ่อแม่ร่วมกันทั้งครอบครัว ในที่เดียว
        </ThemedText>
      </View>

      <Card gap={Spacing.three} padding={Spacing.four}>
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
          label="รหัสผ่าน"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (error) setError(null);
          }}
          placeholder="รหัสผ่าน"
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
          label="เข้าสู่ระบบ"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          accessibilityHint="เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่กรอก"
        />
      </Card>

      <Pressable
        onPress={() => router.replace('/register')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.registerLink, pressed && styles.pressed]}>
        <ThemedText type="small" themeColor="textSecondary">
          ยังไม่มีบัญชี? <ThemedText type="smallBold" themeColor="primary">สมัครสมาชิก</ThemedText>
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
  registerLink: { alignItems: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
});
