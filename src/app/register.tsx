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
import { useTheme } from '@/hooks/use-theme';

/** Thai phone numbers: a landline is 9 digits starting with 0, a mobile is
 *  10 — both `0xxxxxxxx`/`0xxxxxxxxx` once formatting is stripped. Whatever
 *  the user types (dashes, spaces, per the placeholder's `08X-XXX-XXXX`
 *  shape) is normalized to plain digits before this check and before it's
 *  ever sent to the API, so the stored value is always consistent
 *  regardless of how it was typed. */
const isValidThaiPhone = (digits: string) => /^0\d{8,9}$/.test(digits);

/** Step 1 of the reference design's 2-step register flow — account fields
 *  only. The mock's step 1 also has a role picker (Caregiver/Elder/Viewer),
 *  but that's not a real account attribute here: role is per-household
 *  (`HouseholdRole`), only ever chosen when creating or joining a household
 *  on the next screen — so it's not reproduced here to avoid a field that
 *  looks real but the server has nowhere to put it.
 *
 *  Deliberately doesn't call the register API itself: it stashes these
 *  fields as `pendingRegistration` and pushes (not replaces) to
 *  household-setup, so — the account only ever gets created once step 2's
 *  household action actually runs (see household-setup.tsx#ensureRegistered),
 *  and — since this screen stays on the stack (push, not replace), its own
 *  "ย้อนกลับ" button naturally returns here with these fields still filled
 *  in, rather than to an already-committed account with nothing to undo. */
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
  const [error, setError] = useState<string | null>(null);

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
          label="เบอร์โทร"
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            if (error) setError(null);
          }}
          placeholder="08X-XXX-XXXX"
          keyboardType="phone-pad"
          required
        />
        <TextField
          label="รหัสผ่าน"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (error) setError(null);
          }}
          placeholder="อย่างน้อย 6 ตัวอักษร"
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
