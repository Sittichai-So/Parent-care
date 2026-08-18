import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ArrowRightIcon, EnvelopeSimpleIcon, LockKeyIcon, UserPlusIcon } from 'phosphor-react-native';

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
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setError(message);
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundElement }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Hero — light-blue backdrop with a rounded picture frame, cut off by
           *  a wave into the white body below. Per the reference design; the
           *  wave is the one place in the app that isn't a straight edge. */}
          <View style={[styles.hero, { backgroundColor: theme.sky }]}>
            <View style={[styles.heroFrame, { backgroundColor: theme.heroArt }]}>
              <Image
                source={require('@/assets/images/background.png')}
                style={styles.heroImage}
                contentFit="cover"
                contentPosition="top"
              />
            </View>
            <Svg viewBox="0 0 402 70" preserveAspectRatio="none" style={styles.wave}>
              <Path
                d="M0 34C86 4 150 62 236 44 300 31 348 8 402 22V70H0Z"
                fill={theme.backgroundElement}
              />
            </Svg>
          </View>

          <View style={styles.body}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">
                เข้าสู่ระบบ
              </ThemedText>
              <ThemedText type="display">Parent Care</ThemedText>
            </View>

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
                phosphorIcon={EnvelopeSimpleIcon}
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
                phosphorIcon={LockKeyIcon}
                required
              />

              <AppButton
                label="เข้าสู่ระบบ"
                phosphorIcon={ArrowRightIcon}
                iconPosition="trailing"
                size="large"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                accessibilityHint="เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่กรอก"
              />

              {error ? (
                <ThemedText type="small" style={[styles.status, { color: theme.dangerText }]} accessibilityRole="alert">
                  {error}
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <ThemedText type="caption" themeColor="textMuted">
                หรือ
              </ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <AppButton
              label="สร้างบัญชีใหม่"
              phosphorIcon={UserPlusIcon}
              variant="secondary"
              size="large"
              onPress={() => router.push('/register')}
              style={styles.registerButton}
            />

            <ThemedText type="caption" themeColor="textMuted" style={styles.footnote}>
              ลืมรหัสผ่าน? ติดต่อผู้ดูแลกลุ่มบ้านของคุณ
            </ThemedText>
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
    height: 246,
    position: 'relative',
  },
  heroFrame: {
    position: 'absolute',
    top: 56,
    left: 40,
    right: 40,
    bottom: 78,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    width: '100%',
    height: 70,
  },
  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.half,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  form: { gap: Spacing.three, paddingTop: Spacing.four },
  status: { textAlign: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two },
  dividerLine: { flex: 1, height: 1 },
  registerButton: { width: '100%' },
  footnote: { textAlign: 'center' },
});
