import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import type { ApiUserLookup } from '@/services/households-api';

type Mode = 'invite-code' | 'managed' | 'search';

const modeOptions = [
  { value: 'invite-code', label: 'แชร์รหัสเชิญ' },
  { value: 'managed', label: 'เพิ่มแทน' },
  { value: 'search', label: 'ค้นหาบัญชี' },
] as const;

const managedRoleOptions = [
  { value: 'elder', label: 'ผู้สูงอายุ' },
  { value: 'viewer', label: 'ดูอย่างเดียว' },
] as const;

const inviteRoleOptions = [
  { value: 'caregiver', label: 'ผู้ดูแล' },
  { value: 'elder', label: 'ผู้สูงอายุ' },
  { value: 'viewer', label: 'ดูอย่างเดียว' },
] as const;

/**
 * Three ways to grow a household, picked based on who's joining:
 * - invite-code: the existing flow — someone who'll self-register.
 * - managed: a profile with no linked account, for relatives who can't
 *   self-register (no phone, not tech-comfortable). Added directly.
 * - search: someone who already has an account elsewhere in the system —
 *   found by exact email/userCode match, then sent a pending invite they
 *   must accept (never added without their consent).
 */
export default function AddMemberScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { currentHousehold, addManagedMember, lookupUser, inviteExistingUser } = useFamilyContext();

  const [mode, setMode] = useState<Mode>('invite-code');

  const [managedName, setManagedName] = useState('');
  const [managedRelation, setManagedRelation] = useState('');
  const [managedRole, setManagedRole] = useState<(typeof managedRoleOptions)[number]['value']>('elder');
  const [isSavingManaged, setIsSavingManaged] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<ApiUserLookup | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [inviteRelation, setInviteRelation] = useState('');
  const [inviteRole, setInviteRole] = useState<(typeof inviteRoleOptions)[number]['value']>('caregiver');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const handleShareInviteCode = async () => {
    if (!currentHousehold) return;
    try {
      await Share.share({
        message: `เข้าร่วมกลุ่มครอบครัว "${currentHousehold.name}" ในแอป Parent Care ด้วยรหัสเชิญ: ${currentHousehold.inviteCode}`,
      });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  };

  const handleAddManaged = async () => {
    if (!managedName.trim() || !managedRelation.trim()) {
      Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณากรอกชื่อและความสัมพันธ์');
      return;
    }
    setIsSavingManaged(true);
    try {
      await addManagedMember({
        displayName: managedName.trim(),
        relation: managedRelation.trim(),
        role: managedRole,
      });
      Alert.alert('เพิ่มสมาชิกสำเร็จ', `เพิ่ม "${managedName.trim()}" เข้ากลุ่มแล้ว`, [
        { text: 'ตกลง', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      Alert.alert('เพิ่มสมาชิกไม่สำเร็จ', message);
    } finally {
      setIsSavingManaged(false);
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    setIsSearching(true);
    setSearchError(null);
    setFoundUser(null);
    try {
      const result = await lookupUser(query.includes('@') ? { email: query.toLowerCase() } : { code: query.toUpperCase() });
      setFoundUser(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ไม่พบบัญชีนี้';
      setSearchError(message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendInvite = async () => {
    if (!foundUser || !inviteRelation.trim()) {
      Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณากรอกความสัมพันธ์');
      return;
    }
    setIsSendingInvite(true);
    try {
      await inviteExistingUser(foundUser._id, inviteRole, foundUser.name, inviteRelation.trim());
      Alert.alert('ส่งคำขอแล้ว', `ส่งคำขอเชิญ "${foundUser.name}" แล้ว รอเขายืนยันการเข้าร่วมในแอปของเขา`, [
        { text: 'ตกลง', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      Alert.alert('ส่งคำขอไม่สำเร็จ', message);
    } finally {
      setIsSendingInvite(false);
    }
  };

  return (
    <Screen keyboardAvoiding gap={Spacing.four}>
      <ScreenHeader title="เพิ่มสมาชิก" subtitle="เลือกวิธีที่เหมาะกับสมาชิกแต่ละคน" />

      <View style={[styles.toggle, { backgroundColor: theme.surfaceSunken, borderColor: theme.border }]}>
        {modeOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setMode(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === option.value }}
            style={[styles.toggleOption, mode === option.value && { backgroundColor: theme.primary }]}>
            <ThemedText
              type="caption"
              style={{ color: mode === option.value ? theme.onPrimary : theme.text, fontWeight: '700' }}
              numberOfLines={1}>
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {mode === 'invite-code' ? (
        <Card gap={Spacing.three}>
          <ThemedText type="small" themeColor="textSecondary">
            เหมาะกับสมาชิกที่สมัครบัญชีเองได้ — ส่งรหัสนี้ให้เขากรอกตอนสมัคร/เข้าร่วมกลุ่ม
          </ThemedText>
          <View style={[styles.codeBox, { backgroundColor: theme.surfaceSunken, borderColor: theme.border }]}>
            <ThemedText type="display">{currentHousehold?.inviteCode ?? '—'}</ThemedText>
          </View>
          <AppButton label="แชร์รหัสเชิญ" icon="📤" onPress={handleShareInviteCode} />
        </Card>
      ) : null}

      {mode === 'managed' ? (
        <Card gap={Spacing.three}>
          <ThemedText type="small" themeColor="textSecondary">
            เหมาะกับสมาชิกที่ไม่มีสมาร์ตโฟนหรือไม่สะดวกสมัครบัญชีเอง เช่น คุณตาคุณยาย — คุณจัดการข้อมูลแทนได้เลย
            และภายหลังสร้างรหัสให้เขาผูกบัญชีของตัวเองทีหลังได้ (ประวัติเดิมไม่หาย)
          </ThemedText>
          <TextField label="ชื่อ" value={managedName} onChangeText={setManagedName} placeholder="เช่น คุณยายสมศรี" required />
          <TextField label="ความสัมพันธ์" value={managedRelation} onChangeText={setManagedRelation} placeholder="เช่น แม่" required />
          <View style={styles.field}>
            <ThemedText type="smallBold">บทบาทในกลุ่ม *</ThemedText>
            <ChipSelect
              options={managedRoleOptions}
              selected={[managedRole]}
              onToggle={(value) => setManagedRole(value as typeof managedRole)}
            />
          </View>
          <AppButton label="เพิ่มสมาชิก" onPress={handleAddManaged} loading={isSavingManaged} disabled={isSavingManaged} />
        </Card>
      ) : null}

      {mode === 'search' ? (
        <Card gap={Spacing.three}>
          <ThemedText type="small" themeColor="textSecondary">
            เหมาะกับสมาชิกที่มีบัญชีอยู่แล้ว — ค้นหาด้วยอีเมลหรือรหัสประจำตัวของเขา แล้วส่งคำขอ
            ระบบจะเพิ่มเข้ากลุ่มก็ต่อเมื่อเขากดยอมรับคำขอเท่านั้น
          </ThemedText>
          <TextField
            label="อีเมล หรือ รหัสประจำตัว"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="เช่น somchai@email.com หรือ BBGB4SL4"
            required
          />
          <AppButton
            label="ค้นหา"
            variant="secondary"
            onPress={handleSearch}
            loading={isSearching}
            disabled={isSearching || !searchQuery.trim()}
          />

          {searchError ? (
            <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
              <ThemedText type="small" style={{ color: theme.dangerText }}>
                ⚠️ {searchError}
              </ThemedText>
            </View>
          ) : null}

          {foundUser ? (
            <>
              <View style={[styles.foundBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
                <ThemedText type="smallBold">{foundUser.name}</ThemedText>
                <ThemedText type="caption" themeColor="textMuted">
                  รหัสประจำตัว {foundUser.userCode ?? '—'}
                </ThemedText>
              </View>
              <View style={styles.field}>
                <ThemedText type="smallBold">บทบาทในกลุ่ม *</ThemedText>
                <ChipSelect
                  options={inviteRoleOptions}
                  selected={[inviteRole]}
                  onToggle={(value) => setInviteRole(value as typeof inviteRole)}
                />
              </View>
              <TextField label="ความสัมพันธ์" value={inviteRelation} onChangeText={setInviteRelation} placeholder="เช่น พี่สาว" required />
              <AppButton label="ส่งคำขอเชิญ" onPress={handleSendInvite} loading={isSendingInvite} disabled={isSendingInvite} />
            </>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', borderRadius: Radius.md, borderWidth: 1, padding: 4, gap: 4 },
  toggleOption: { flex: 1, borderRadius: Radius.sm, paddingVertical: Spacing.two, alignItems: 'center' },
  field: { gap: Spacing.two },
  codeBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  errorBox: { borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  foundBox: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.three, gap: Spacing.half },
});
