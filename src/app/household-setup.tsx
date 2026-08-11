import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

type Mode = 'create' | 'join';

const roleOptions = [
  { value: 'caregiver', label: 'ผู้ดูแล' },
  { value: 'elder', label: 'ผู้สูงอายุ' },
  { value: 'viewer', label: 'ดูอย่างเดียว' },
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
  const { createHousehold, joinHousehold } = useFamilyContext();

  const [mode, setMode] = useState<Mode>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [householdName, setHouseholdName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [relation, setRelation] = useState('');

  const [inviteCode, setInviteCode] = useState('');
  const [role, setRole] = useState<(typeof roleOptions)[number]['value']>('caregiver');

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

  return (
    <Screen keyboardAvoiding gap={Spacing.four}>
      <ScreenHeader
        title="เริ่มต้นใช้งาน"
        subtitle="สร้างกลุ่มครอบครัวใหม่ หรือเข้าร่วมกลุ่มที่มีอยู่แล้วด้วยรหัสเชิญ"
        showBack={false}
      />

      <View style={[styles.toggle, { backgroundColor: theme.surfaceSunken, borderColor: theme.border }]}>
        <Pressable
          onPress={() => {
            setMode('create');
            setError(null);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'create' }}
          style={[styles.toggleOption, mode === 'create' && { backgroundColor: theme.primary }]}>
          <ThemedText type="smallBold" style={{ color: mode === 'create' ? theme.onPrimary : theme.text }}>
            สร้างกลุ่มใหม่
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => {
            setMode('join');
            setError(null);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'join' }}
          style={[styles.toggleOption, mode === 'join' && { backgroundColor: theme.primary }]}>
          <ThemedText type="smallBold" style={{ color: mode === 'join' ? theme.onPrimary : theme.text }}>
            เข้าร่วมด้วยรหัส
          </ThemedText>
        </Pressable>
      </View>

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
      ) : (
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
      )}

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
          <ThemedText type="small" style={{ color: theme.dangerText }}>
            ⚠️ {error}
          </ThemedText>
        </View>
      ) : null}

      <AppButton
        label={mode === 'create' ? 'สร้างกลุ่มครอบครัว' : 'เข้าร่วมกลุ่มครอบครัว'}
        onPress={mode === 'create' ? handleCreate : handleJoin}
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
  toggle: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  toggleOption: {
    flex: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  field: { gap: Spacing.two },
  errorBox: { borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  logoutLink: { alignItems: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
});
