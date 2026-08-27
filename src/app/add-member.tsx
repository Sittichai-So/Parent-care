import { useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';
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
import { useFamilyContext, type HouseholdSummary } from '@/context/family-context';
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

function InviteCodeCard({ household, onShare }: { household: HouseholdSummary | null; onShare: () => void }) {
  const theme = useTheme();
  return (
    <Card gap={Spacing.three}>
      <ThemedText type="small" themeColor="textSecondary">
        เหมาะกับสมาชิกที่สมัครบัญชีเองได้ — ส่งรหัสนี้ให้เขากรอกตอนสมัคร/เข้าร่วมกลุ่ม
      </ThemedText>
      <View style={[styles.codeBox, { backgroundColor: theme.surfaceSunken, borderColor: theme.border }]}>
        <ThemedText type="display">{household?.inviteCode ?? '—'}</ThemedText>
      </View>
      <AppButton label="แชร์รหัสเชิญ" icon="share-social-outline" onPress={onShare} />
    </Card>
  );
}

type ManagedMemberCardProps = {
  name: string;
  onNameChange: (value: string) => void;
  relation: string;
  onRelationChange: (value: string) => void;
  role: (typeof managedRoleOptions)[number]['value'];
  onRoleChange: (value: (typeof managedRoleOptions)[number]['value']) => void;
  isSaving: boolean;
  onSubmit: () => void;
};

function ManagedMemberCard({
  name,
  onNameChange,
  relation,
  onRelationChange,
  role,
  onRoleChange,
  isSaving,
  onSubmit,
}: ManagedMemberCardProps) {
  return (
    <Card gap={Spacing.three}>
      <ThemedText type="small" themeColor="textSecondary">
        เหมาะกับสมาชิกที่ไม่มีสมาร์ตโฟนหรือไม่สะดวกสมัครบัญชีเอง เช่น คุณตาคุณยาย — คุณจัดการข้อมูลแทนได้เลย
        และภายหลังสร้างรหัสให้เขาผูกบัญชีของตัวเองทีหลังได้ (ประวัติเดิมไม่หาย)
      </ThemedText>
      <TextField label="ชื่อ" value={name} onChangeText={onNameChange} placeholder="เช่น คุณยายสมศรี" required />
      <TextField label="ความสัมพันธ์" value={relation} onChangeText={onRelationChange} placeholder="เช่น แม่" required />
      <View style={styles.field}>
        <ThemedText type="smallBold">บทบาทในกลุ่ม *</ThemedText>
        <ChipSelect options={managedRoleOptions} selected={[role]} onToggle={(value) => onRoleChange(value as typeof role)} />
      </View>
      <AppButton label="เพิ่มสมาชิก" onPress={onSubmit} loading={isSaving} disabled={isSaving} />
    </Card>
  );
}

type SearchAccountCardProps = {
  query: string;
  onQueryChange: (value: string) => void;
  isSearching: boolean;
  onSearch: () => void;
  searchError: string | null;
  foundUser: ApiUserLookup | null;
  relation: string;
  onRelationChange: (value: string) => void;
  role: (typeof inviteRoleOptions)[number]['value'];
  onRoleChange: (value: (typeof inviteRoleOptions)[number]['value']) => void;
  isSendingInvite: boolean;
  onSendInvite: () => void;
};

function SearchAccountCard({
  query,
  onQueryChange,
  isSearching,
  onSearch,
  searchError,
  foundUser,
  relation,
  onRelationChange,
  role,
  onRoleChange,
  isSendingInvite,
  onSendInvite,
}: SearchAccountCardProps) {
  const theme = useTheme();
  return (
    <Card gap={Spacing.three}>
      <ThemedText type="small" themeColor="textSecondary">
        เหมาะกับสมาชิกที่มีบัญชีอยู่แล้ว — ค้นหาด้วยอีเมลหรือรหัสประจำตัวของเขา แล้วส่งคำขอ
        ระบบจะเพิ่มเข้ากลุ่มก็ต่อเมื่อเขากดยอมรับคำขอเท่านั้น
      </ThemedText>
      <TextField
        label="อีเมล หรือ รหัสประจำตัว"
        value={query}
        onChangeText={onQueryChange}
        placeholder="เช่น somchai@email.com หรือ BBGB4SL4"
        required
      />
      <AppButton label="ค้นหา" variant="secondary" onPress={onSearch} loading={isSearching} disabled={isSearching || !query.trim()} />

      {searchError ? (
        <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: Spacing.two }]}>
          <Ionicons name="alert-circle-outline" size={16} color={theme.dangerText} />
          <ThemedText type="small" style={{ color: theme.dangerText, flex: 1 }}>
            {searchError}
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
            <ChipSelect options={inviteRoleOptions} selected={[role]} onToggle={(value) => onRoleChange(value as typeof role)} />
          </View>
          <TextField label="ความสัมพันธ์" value={relation} onChangeText={onRelationChange} placeholder="เช่น พี่สาว" required />
          <AppButton label="ส่งคำขอเชิญ" onPress={onSendInvite} loading={isSendingInvite} disabled={isSendingInvite} />
        </>
      ) : null}
    </Card>
  );
}

export default function AddMemberScreen() {
  const router = useRouter();
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
    } catch {}
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

      <SegmentedToggle options={modeOptions} value={mode} onChange={setMode} />

      {mode === 'invite-code' ? <InviteCodeCard household={currentHousehold} onShare={handleShareInviteCode} /> : null}

      {mode === 'managed' ? (
        <ManagedMemberCard
          name={managedName}
          onNameChange={setManagedName}
          relation={managedRelation}
          onRelationChange={setManagedRelation}
          role={managedRole}
          onRoleChange={setManagedRole}
          isSaving={isSavingManaged}
          onSubmit={handleAddManaged}
        />
      ) : null}

      {mode === 'search' ? (
        <SearchAccountCard
          query={searchQuery}
          onQueryChange={setSearchQuery}
          isSearching={isSearching}
          onSearch={handleSearch}
          searchError={searchError}
          foundUser={foundUser}
          relation={inviteRelation}
          onRelationChange={setInviteRelation}
          role={inviteRole}
          onRoleChange={setInviteRole}
          isSendingInvite={isSendingInvite}
          onSendInvite={handleSendInvite}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
