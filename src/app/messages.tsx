import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { InfoIcon, PaperPlaneRightIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { ReadOnlyBanner } from '@/components/ui/read-only-banner';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

type DemoMessage = { id: string; who: string; time: string; text: string; mine: boolean };

function nowLabel() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** A design preview, not a feature — there is no messaging backend in this
 *  app yet (no endpoint, no delivery, nothing persisted). Everything here is
 *  local `useState`, seeded with one placeholder line, and reset the moment
 *  this screen unmounts. The banner below says so up front so it never reads
 *  as a real family conversation. */
export default function MessagesScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { familyMembers, canEdit } = useFamilyContext();
  const otherMember = familyMembers.find((member) => member.name !== user?.name)?.name ?? 'สมาชิกในบ้าน';

  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: 'seed-1',
      who: otherMember,
      time: '09:12',
      text: 'ตัวอย่างข้อความ — พิมพ์ด้านล่างเพื่อลองส่งดูได้ (จะหายเมื่อออกจากหน้านี้)',
      mine: false,
    },
  ]);
  const [draft, setDraft] = useState('');

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { id: `local-${Date.now()}`, who: user?.name ?? 'ฉัน', time: nowLabel(), text, mine: true },
    ]);
    setDraft('');
  };

  return (
    <Screen
      keyboardAvoiding
      gap={Spacing.three}
      footer={
        <View style={[styles.composer, !canEdit && styles.readOnly]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={canEdit}
            placeholder={canEdit ? 'พิมพ์ข้อความ (ตัวอย่างเท่านั้น)' : 'ดูได้เท่านั้น — ส่งข้อความไม่ได้'}
            placeholderTextColor={theme.placeholder}
            accessibilityLabel="พิมพ์ข้อความตัวอย่าง"
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, shadowColor: theme.shadow }]}
          />
          <Pressable
            onPress={canEdit ? send : undefined}
            disabled={!canEdit}
            accessibilityRole="button"
            accessibilityLabel="ส่งข้อความตัวอย่าง"
            accessibilityState={{ disabled: !canEdit }}
            style={({ pressed }) => [styles.send, { backgroundColor: theme.primary }, pressed && canEdit && styles.pressed]}>
            <PaperPlaneRightIcon weight="fill" size={19} color={theme.onPrimary} />
          </Pressable>
        </View>
      }>
      <ScreenHeader title="ข้อความครอบครัว" eyebrow="ตัวอย่างดีไซน์" />

      <ReadOnlyBanner />

      <View style={[styles.banner, { backgroundColor: theme.warningSoft }]}>
        <InfoIcon weight="duotone" size={18} color={theme.warningText} />
        <ThemedText type="small" style={{ color: theme.warningText, flex: 1 }}>
          หน้านี้เป็นตัวอย่างการออกแบบเท่านั้น — แอปยังไม่มีระบบส่งข้อความจริง ข้อความที่พิมพ์จะไม่ถูกส่งหรือบันทึกไว้ที่ไหน
        </ThemedText>
      </View>

      <View style={styles.bubbles}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.bubble,
              Elevation.low,
              { shadowColor: theme.shadow },
              message.mine
                ? { alignSelf: 'flex-end', backgroundColor: theme.primary }
                : { alignSelf: 'flex-start', backgroundColor: theme.backgroundElement },
            ]}>
            <View style={styles.bubbleHead}>
              <ThemedText style={[styles.bubbleName, { color: message.mine ? theme.heroTextMuted : theme.primaryText }]}>
                {message.who}
              </ThemedText>
              <ThemedText style={[styles.bubbleTime, { color: message.mine ? theme.heroTextMuted : theme.textMuted }]}>
                {message.time}
              </ThemedText>
            </View>
            <ThemedText style={[styles.bubbleText, { color: message.mine ? theme.onPrimary : theme.text }]}>
              {message.text}
            </ThemedText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  bubbles: { gap: Spacing.two },
  bubble: { maxWidth: '86%', borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.half },
  bubbleHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.two },
  bubbleName: { fontSize: 12.5, fontWeight: '700' },
  bubbleTime: { fontSize: 11.5 },
  bubbleText: { fontSize: 14.5, lineHeight: 22 },

  composer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  input: {
    flex: 1,
    minHeight: 52,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.four,
    fontSize: 14.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  send: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  readOnly: { opacity: 0.45 },
});
