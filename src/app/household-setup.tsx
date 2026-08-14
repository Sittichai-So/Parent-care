import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

type Mode = 'create' | 'join' | 'claim';

const roleOptions = [
  { value: 'caregiver', label: 'ผู้ดูแล' },
  { value: 'elder', label: 'ผู้สูงอายุ' },
  { value: 'viewer', label: 'ดูอย่างเดียว' },
] as const;

const modeOptions = [
  { value: 'create', label: 'สร้างกลุ่ม' },
  { value: 'join', label: 'เข้าร่วม' },
  { value: 'claim', label: 'ผูกบัญชี' },
] as const;

/**
 * Shown after login/register to any account that doesn't belong to a
 * household yet — the root layout guard (_layout.tsx) routes here instead
 * of the tabs. Create starts a new household as its owner; Join redeems an
 * invite code from someone who already created one.
 */
export default function HouseholdSetupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { logout } = useAuth();
  const { households, createHousehold, joinHousehold, claimMembership } = useFamilyContext();
  // A signed-in account with at least one household lands here on demand
  // (e.g. "มีรหัสผูกบัญชี?" on the dashboard), not as a forced landing
  // screen — so let them back out instead of only offering logout.
  const canGoBack = households.length > 0;

  const [mode, setMode] = useState<Mode>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [householdName, setHouseholdName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [relation, setRelation] = useState('');

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
      const household = await createHousehold(householdName.trim(), displayName.trim(), relation.trim());
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
    <Screen keyboardAvoiding gap={Spacing.four}>
      <ScreenHeader
        title="เริ่มต้นใช้งาน"
        subtitle="สร้างกลุ่มครอบครัวใหม่ เข้าร่วมด้วยรหัสเชิญ หรือผูกบัญชีกับโปรไฟล์ที่มีอยู่แล้ว"
        showBack={canGoBack}
      />

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
            คุณจะเป็นเจ้าของกลุ่มนี้ และได้รหัสเชิญไว้ส่งให้สมาชิกคนอื่น
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
        <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: Spacing.two }]}>
          <Ionicons name="alert-circle-outline" size={16} color={theme.dangerText} />
          <ThemedText type="small" style={{ color: theme.dangerText, flex: 1 }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <AppButton
        label={mode === 'create' ? 'สร้างกลุ่มครอบครัว' : mode === 'join' ? 'เข้าร่วมกลุ่มครอบครัว' : 'ผูกบัญชี'}
        onPress={mode === 'create' ? handleCreate : mode === 'join' ? handleJoin : handleClaim}
        loading={isSubmitting}
        disabled={isSubmitting}
      />

      <Pressable
        onPress={() => logout()}
        accessibilityRole="button"
        style={({ pressed }) => [styles.logoutLink, pressed && styles.pressed]}>
        <ThemedText type="small" themeColor="textSecondary">
          ออกจากระบบ
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  errorBox: { borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  logoutLink: { alignItems: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
});
