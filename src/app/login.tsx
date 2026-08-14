import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
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
    // Same edge-to-edge hero shell as `welcome.tsx`, not the shared `Screen` —
    // the hero here needs to run full-bleed to the screen edges, which
    // `Screen`'s fixed horizontal padding can't do.
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Cropped to the top of `background.png` — the logo, wordmark and
           *  feature icons — not its lower half (the family photo), which
           *  would fight with the form for attention right below it. */}
          <View style={styles.hero}>
            <Image
              source={require('@/assets/images/background.png')}
              style={styles.heroImage}
              contentFit="cover"
              contentPosition="top"
            />
          </View>

          <View style={styles.body}>
            <View style={styles.form}>
              <TextField
                label="อีเมล"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (error) setError(null);
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                variant="soft"
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
                variant="soft"
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
                icon="arrow-forward"
                iconPosition="trailing"
                size="xlarge"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                accessibilityHint="เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่กรอก"
              />
            </View>

            <Pressable
              onPress={() => router.replace('/register')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.registerLink, pressed && styles.pressed]}>
              <ThemedText type="small" themeColor="textSecondary">
                ยังไม่มีบัญชี? <ThemedText type="smallBold" themeColor="primary">สมัครสมาชิก</ThemedText>
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  hero: {
    height: 280,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
    gap: Spacing.five,
  },
  form: { gap: Spacing.three },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  registerLink: { alignItems: 'center', paddingVertical: Spacing.one },
  pressed: { opacity: 0.7 },
});
