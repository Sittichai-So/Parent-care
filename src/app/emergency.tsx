import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CheckCircleIcon, SirenIcon, UserIcon, WarningCircleIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useRestoreHouseholdOnLeave } from '@/hooks/use-restore-household-on-leave';
import { useTheme } from '@/hooks/use-theme';

type Phase = 'ask' | 'sending' | 'sent';

export default function EmergencyScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { familyMembers, triggerEmergency } = useFamilyContext();
  const params = useLocalSearchParams<{ restoreHouseholdId?: string }>();

  useRestoreHouseholdOnLeave(params.restoreHouseholdId);

  const [phase, setPhase] = useState<Phase>('ask');
  const [error, setError] = useState<string | null>(null);

  const contacts = familyMembers.filter((member) => member.role !== 'Elder');
  const recipients = contacts.length > 0 ? contacts : familyMembers;

  const sendRequest = async () => {
    setError(null);
    setPhase('sending');
    try {
      await triggerEmergency();
      setPhase('sent');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      setError(message);
      setPhase('ask');
    }
  };

  if (phase === 'sent') {
    return (
      <Screen center gap={Spacing.four}>
        <Card tone="success" accented padding={Spacing.five} gap={Spacing.three} style={styles.centerCard}>
          <View style={[styles.glyphWrap, { backgroundColor: theme.success }]}>
            <CheckCircleIcon weight="fill" size={40} color={theme.onPrimary} />
          </View>
          <ThemedText type="display" style={{ color: theme.successText, textAlign: 'center' }}>
            ส่งคำขอแล้ว
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.successText, textAlign: 'center' }}>
            ครอบครัวของคุณได้รับแจ้งเรียบร้อยแล้ว อยู่กับที่และรอสักครู่นะคะ
          </ThemedText>
        </Card>

        <AppButton label="กลับหน้าหลัก" size="xlarge" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen gap={Spacing.four} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.glyphWrap, { backgroundColor: theme.dangerSoft }]}>
          <SirenIcon weight="duotone" size={44} color={theme.danger} />
        </View>
        <ThemedText type="display" style={{ textAlign: 'center' }} accessibilityRole="header">
          ต้องการความช่วยเหลือ?
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
          เมื่อกดยืนยัน ครอบครัวจะได้รับแจ้งเตือนทันที
        </ThemedText>
      </View>

      <Card tone="sunken" elevation="flat" gap={Spacing.three}>
        <ThemedText type="smallBold">คนที่จะได้รับแจ้ง</ThemedText>
        {recipients.map((member) => (
          <View key={member.id} style={styles.contact}>
            <View style={[styles.contactDot, { backgroundColor: theme.primarySoft }]}>
              <UserIcon weight="duotone" size={18} color={theme.primaryText} />
            </View>
            <View style={styles.contactText}>
              <ThemedText type="smallBold">{member.name}</ThemedText>
              <ThemedText type="caption" themeColor="textMuted">
                {member.relation} · {member.role}
              </ThemedText>
            </View>
          </View>
        ))}
      </Card>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: Spacing.two }]}>
          <WarningCircleIcon weight="duotone" size={16} color={theme.dangerText} />
          <ThemedText type="small" style={{ color: theme.dangerText }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          label="ใช่ ต้องการความช่วยเหลือ"
          phosphorIcon={SirenIcon}
          variant="danger"
          size="xlarge"
          loading={phase === 'sending'}
          onPress={sendRequest}
          accessibilityHint="ส่งคำขอความช่วยเหลือไปยังสมาชิกครอบครัวทุกคน"
        />
        <AppButton
          label="ยกเลิก ฉันสบายดี"
          variant="secondary"
          size="large"
          disabled={phase === 'sending'}
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center' },
  header: { alignItems: 'center', gap: Spacing.three },
  centerCard: { alignItems: 'center' },
  glyphWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contact: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  contactDot: { width: 40, height: 40, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  contactText: { flex: 1, gap: 1 },

  errorBox: { borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  actions: { gap: Spacing.two },
});
