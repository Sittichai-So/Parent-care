import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { OnboardingHeader } from '@/components/ui/onboarding-header';
import { Screen } from '@/components/ui/screen';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { TextField } from '@/components/ui/text-field';
import { HouseholdKindMeta } from '@/constants/household';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import type { HouseholdKind } from '@/services/households-api';

type Mode = 'create' | 'join' | 'claim';

const roleOptions = [
  { value: 'caregiver', label: 'ผู้ดูแล' },
  { value: 'elder', label: 'ผู้สูงอายุ' },
  { value: 'viewer', label: 'ดูอย่างเดียว' },
] as const;

const kindOptions = (Object.keys(HouseholdKindMeta) as HouseholdKind[]).map((value) => ({
  value,
  label: HouseholdKindMeta[value].label,
}));

const modeOptions = [
  { value: 'create', label: 'สร้างกลุ่ม' },
  { value: 'join', label: 'เข้าร่วม' },
  { value: 'claim', label: 'ผูกบัญชี' },
] as const;

/**
 * Step 2 of signup (reached from register.tsx before the account even
 * exists yet — see `ensureRegistered` below), and also shown after login to
 * any already-registered account that doesn't belong to a household yet —
 * the root layout guard (_layout.tsx) routes here instead of the tabs in
 * that case. Create starts a new household as its owner; Join redeems an
 * invite code from someone who already created one.
 */
export default function HouseholdSetupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { logout, register, pendingRegistration, setPendingRegistration } = useAuth();
  const { households, createHousehold, joinHousehold, claimMembership } = useFamilyContext();
  // Two different reasons this screen has nothing but "สร้างบัญชี" step 2 to
  // show: a brand-new signup (pendingRegistration still set), or the account
  // is genuinely authenticated but somehow has zero households. Either way
  // it reads as onboarding, distinct from a signed-in account with at least
  // one household landing here on demand (e.g. "มีรหัสผูกบัญชี?").
  const isOnboarding = households.length === 0;
  // A back destination exists either way: mid-signup, back returns to
  // register.tsx (still on the stack, fields intact, nothing to undo yet —
  // register() hasn't been called); post-signup with existing households,
  // back returns wherever this screen was opened from.
  const canGoBack = pendingRegistration !== null || households.length > 0;

  // Only ever called once per successful signup: register() genuinely
  // creates the account, so pendingRegistration is cleared immediately after
  // so a retry (if the household action below fails) never calls it twice.
  const ensureRegistered = async () => {
    if (!pendingRegistration) return;
    await register(
      pendingRegistration.name,
      pendingRegistration.email,
      pendingRegistration.password,
      pendingRegistration.phone,
      pendingRegistration.address
    );
    setPendingRegistration(null);
  };

  const [mode, setMode] = useState<Mode>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [householdName, setHouseholdName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [relation, setRelation] = useState('');
  const [kind, setKind] = useState<HouseholdKind>('parents');

  const [inviteCode, setInviteCode] = useState('');
  const [role, setRole] = useState<(typeof roleOptions)[number]['value']>('caregiver');

  const [claimCode, setClaimCode] = useState('');

  const handleCreate = async () => {
    if (!householdName.trim() || !displayName.trim() || !relation.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await ensureRegistered();
      const household = await createHousehold(householdName.trim(), displayName.trim(), relation.trim(), kind);
      // The invite code only ever shows here and on the dashboard's invite
      // card — there's no dedicated household-settings screen yet, so this
      // is the one guaranteed moment the owner sees it right after creation.
      Alert.alert(
        'สร้างกลุ่มครอบครัวสำเร็จ',
        `รหัสเชิญของกลุ่ม "${household.name}" คือ ${household.inviteCode}\n\nส่งรหัสนี้ให้สมาชิกคนอื่นเพื่อเข้าร่วมกลุ่ม (ดูรหัสนี้ได้อีกครั้งที่หน้าหลัก)`,
        [{ text: 'ตกลง', onPress: () => router.replace('/') }]
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setError(message);
      Alert.alert('สร้างกลุ่มครอบครัวไม่สำเร็จ', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || !displayName.trim() || !relation.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await ensureRegistered();
      await joinHousehold(inviteCode.trim().toUpperCase(), role, displayName.trim(), relation.trim());
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setError(message);
      Alert.alert('เข้าร่วมกลุ่มครอบครัวไม่สำเร็จ', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = async () => {
    if (!claimCode.trim()) {
      setError('กรุณากรอกรหัสผูกบัญชี');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await ensureRegistered();
      await claimMembership(claimCode.trim().toUpperCase());
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setError(message);
      Alert.alert('ผูกบัญชีไม่สำเร็จ', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      keyboardAvoiding
      gap={Spacing.four}
      header={
        <OnboardingHeader
          title={isOnboarding ? 'สร้างบัญชี' : 'กลุ่มบ้าน'}
          step={isOnboarding ? 2 : undefined}
          onBack={canGoBack ? () => router.back() : undefined}
        />
      }>
      <ThemedText type="small" themeColor="textSecondary">
        สร้างกลุ่มครอบครัวใหม่ เข้าร่วมด้วยรหัสเชิญ หรือผูกบัญชีกับโปรไฟล์ที่มีอยู่แล้ว
      </ThemedText>

      <SegmentedToggle
        options={modeOptions}
        value={mode}
        onChange={(value) => {
          setMode(value);
          setError(null);
        }}
      />

      {mode === 'create' ? (
        <Card gap={Spacing.three}>
          <TextField
            label="ชื่อกลุ่มครอบครัว"
            value={householdName}
            onChangeText={setHouseholdName}
            placeholder="เช่น บ้านสมชาย"
            required
          />
          <View style={styles.field}>
            <ThemedText type="smallBold">ประเภทกลุ่ม</ThemedText>
            <ChipSelect options={kindOptions} selected={[kind]} onToggle={(value) => setKind(value as HouseholdKind)} />
          </View>
          <TextField
            label="ชื่อของคุณในกลุ่ม"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="เช่น คุณสมชาย"
            required
          />
          <TextField
            label="ความสัมพันธ์"
            value={relation}
            onChangeText={setRelation}
            placeholder="เช่น ลูกชาย"
            required
          />
          <ThemedText type="caption" themeColor="textMuted">
            คุณจะเป็นเจ้าของกลุ่มนี้ และได้รหัสเชิญไว้ส่งให้สมาชิกคนอื่น — กลุ่มแรกของบัญชีนี้จะถูกตั้งเป็น
            &quot;กลุ่มเริ่มต้น&quot; ให้อัตโนมัติ (เปลี่ยนได้ทีหลังจากตัวสลับกลุ่มบ้าน)
          </ThemedText>
        </Card>
      ) : null}

      {mode === 'join' ? (
        <Card gap={Spacing.three}>
          <TextField
            label="รหัสเชิญ"
            value={inviteCode}
            onChangeText={(value) => setInviteCode(value.toUpperCase())}
            placeholder="เช่น 2FSQJTN9"
            required
          />
          <View style={styles.field}>
            <ThemedText type="smallBold">บทบาทของคุณในกลุ่ม *</ThemedText>
            <ChipSelect options={roleOptions} selected={[role]} onToggle={(value) => setRole(value as typeof role)} />
          </View>
          <TextField
            label="ชื่อของคุณในกลุ่ม"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="เช่น แม่สมใจ"
            required
          />
          <TextField
            label="ความสัมพันธ์"
            value={relation}
            onChangeText={setRelation}
            placeholder="เช่น แม่"
            required
          />
        </Card>
      ) : null}

      {mode === 'claim' ? (
        <Card gap={Spacing.three}>
          <TextField
            label="รหัสผูกบัญชี"
            value={claimCode}
            onChangeText={(value) => setClaimCode(value.toUpperCase())}
            placeholder="เช่น GG4W2ZD5PP25"
            required
          />
          <ThemedText type="caption" themeColor="textMuted">
            ใช้เมื่อผู้ดูแลเคยเพิ่มคุณเป็นสมาชิกไว้ล่วงหน้าแบบไม่มีบัญชี แล้วตอนนี้อยากผูกบัญชีของคุณเองเข้ากับโปรไฟล์นั้น
            ประวัติยา/นัดหมาย/สุขภาพเดิมจะยังอยู่ครบ ไม่ใช่การเริ่มโปรไฟล์ใหม่
          </ThemedText>
        </Card>
      ) : null}

      {error ? (
        <ThemedText type="small" style={[styles.status, { color: theme.warningText }]} accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}

      <AppButton
        label={mode === 'create' ? 'สร้างกลุ่มครอบครัว' : mode === 'join' ? 'เข้าร่วมกลุ่มครอบครัว' : 'ผูกบัญชี'}
        onPress={mode === 'create' ? handleCreate : mode === 'join' ? handleJoin : handleClaim}
        loading={isSubmitting}
        disabled={isSubmitting}
      />

      <Pressable
        onPress={() => {
          // Mid-signup, nothing's been created yet — "ออกจากระบบ" would be
          // inaccurate (there's no session to log out of), so this clears
          // the draft and returns to login instead of calling logout().
          if (pendingRegistration) {
            setPendingRegistration(null);
            router.replace('/login');
          } else {
            logout();
          }
        }}
        accessibilityRole="button"
        style={({ pressed }) => [styles.logoutLink, pressed && styles.pressed]}>
        <ThemedText type="small" themeColor="textSecondary">
          {pendingRegistration ? 'ยกเลิกการสมัคร' : 'ออกจากระบบ'}
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  status: { textAlign: 'center' },
  logoutLink: { alignItems: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
});
