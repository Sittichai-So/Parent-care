import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

type Phase = 'ask' | 'sending' | 'sent';

export default function EmergencyScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { familyMembers } = useFamilyContext();
  const [phase, setPhase] = useState<Phase>('ask');

  const contacts = familyMembers.filter((member) => member.role !== 'Elder');
  const recipients = contacts.length > 0 ? contacts : familyMembers;

  const sendRequest = () => {
    setPhase('sending');
    setTimeout(() => setPhase('sent'), 900);
  };

  if (phase === 'sent') {
    return (
      <Screen center gap={Spacing.four}>
        <Card tone="success" accented padding={Spacing.five} gap={Spacing.three} style={styles.centerCard}>
          <View style={[styles.glyphWrap, { backgroundColor: theme.success }]}>
            <ThemedText style={styles.glyph}>✓</ThemedText>
          </View>
          <ThemedText style={[styles.title, { color: theme.successText }]}>ส่งคำขอแล้ว</ThemedText>
          <ThemedText style={[styles.body, { color: theme.successText }]}>
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
          <ThemedText style={styles.glyph}>🆘</ThemedText>
        </View>
        <ThemedText style={styles.title} accessibilityRole="header">
          ต้องการความช่วยเหลือ?
        </ThemedText>
        <ThemedText style={[styles.body, { color: theme.textSecondary }]}>
          เมื่อกดยืนยัน ครอบครัวจะได้รับแจ้งเตือนทันที พร้อมตำแหน่งล่าสุดของคุณ
        </ThemedText>
      </View>

      <Card tone="sunken" elevation="flat" gap={Spacing.three}>
        <ThemedText type="smallBold">คนที่จะได้รับแจ้ง</ThemedText>
        {recipients.map((member) => (
          <View key={member.id} style={styles.contact}>
            <View style={[styles.contactDot, { backgroundColor: theme.primarySoft }]}>
              <ThemedText style={[styles.contactGlyph, { color: theme.primaryText }]}>👤</ThemedText>
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

      <View style={styles.actions}>
        <AppButton
          label="ใช่ ต้องการความช่วยเหลือ"
          icon="🆘"
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
    width: 84,
    height: 84,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glyph: { fontSize: 38, lineHeight: 48, color: '#FFFFFF' },
  title: { fontSize: 26, lineHeight: 34, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '500', textAlign: 'center' },

  contact: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  contactDot: { width: 40, height: 40, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  contactGlyph: { fontSize: 16, lineHeight: 22 },
  contactText: { flex: 1, gap: 1 },

  actions: { gap: Spacing.two },
});
