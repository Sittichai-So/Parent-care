import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { PaperPlaneRightIcon } from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { ReadOnlyBanner } from '@/components/ui/read-only-banner';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import * as messagesApi from '@/services/messages-api';
import type { ApiMessage } from '@/services/messages-api';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket-client';

type SendAck = { ok: boolean; message?: ApiMessage; error?: string };
type JoinAck = { ok: boolean; error?: string };
type DeletedAck = { _id: string; householdId: string };

/** ครอบครัว-wide chat — real backend now (`GET /messages` for history,
 *  `send_message`/`receive_message`/`message_deleted` over Socket.IO for
 *  live delivery). The socket connects and joins this household's room only
 *  while this screen is mounted, and leaves/disconnects on unmount — the
 *  reference design's chat is a single conversation per household with no
 *  need to stay connected from any other screen. */
export default function MessagesScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const { currentHouseholdId, currentMembershipId, canEdit } = useFamilyContext();

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  // History — refetched whenever the selected household changes.
  // Same react-hooks/set-state-in-effect situation as family-context.tsx
  // (see its comment there) — batched by React 19 into one render regardless.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!currentHouseholdId) {
      setMessages([]);
      setIsLoadingHistory(false);
      return;
    }
    let cancelled = false;
    setIsLoadingHistory(true);
    setLoadError(null);
    messagesApi
      .getMessages(currentHouseholdId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'โหลดข้อความไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentHouseholdId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Live connection — joins this household's room for as long as the
  // screen is mounted. Every failure mode here (bad/expired token, rejected
  // join, dropped connection) gets its own message instead of failing
  // silently, since a quiet socket looks identical to "no new messages."
  useEffect(() => {
    if (!currentHouseholdId || !token) return;

    const socket = connectSocket(token);
    const join = () => {
      socket.emit('join_family_room', { householdId: currentHouseholdId }, (ack: JoinAck) => {
        setLiveError(ack?.ok ? null : (ack?.error ?? 'เข้าร่วมห้องสนทนาไม่สำเร็จ'));
      });
    };

    const onConnect = () => join();
    const onConnectError = (err: Error) => setLiveError(err.message || 'เชื่อมต่อห้องสนทนาไม่สำเร็จ');
    const onReceive = (message: ApiMessage) => {
      if (message.householdId !== currentHouseholdId) return;
      setMessages((current) => (current.some((m) => m._id === message._id) ? current : [...current, message]));
    };
    const onDeleted = ({ _id, householdId }: DeletedAck) => {
      if (householdId !== currentHouseholdId) return;
      setMessages((current) => current.filter((m) => m._id !== _id));
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('receive_message', onReceive);
    socket.on('message_deleted', onDeleted);
    if (socket.connected) join();

    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('receive_message', onReceive);
      socket.off('message_deleted', onDeleted);
      socket.emit('leave_family_room', { householdId: currentHouseholdId });
      disconnectSocket();
    };
  }, [currentHouseholdId, token]);

  const send = () => {
    const text = draft.trim();
    const socket = getSocket();
    if (!text || !socket || !currentHouseholdId) return;

    setIsSending(true);
    socket.emit('send_message', { householdId: currentHouseholdId, text }, (ack: SendAck) => {
      setIsSending(false);
      if (ack?.ok && ack.message) {
        const sent = ack.message;
        setDraft('');
        // Persists + broadcasts server-side — receive_message may already
        // have added this exact message by the time the ack lands.
        setMessages((current) => (current.some((m) => m._id === sent._id) ? current : [...current, sent]));
      } else {
        Alert.alert('ส่งข้อความไม่สำเร็จ', ack?.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    });
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
            editable={canEdit && !isSending}
            placeholder={canEdit ? 'พิมพ์ข้อความ' : 'ดูได้เท่านั้น — ส่งข้อความไม่ได้'}
            placeholderTextColor={theme.placeholder}
            accessibilityLabel="พิมพ์ข้อความ"
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, shadowColor: theme.shadow }]}
          />
          <Pressable
            onPress={canEdit ? send : undefined}
            disabled={!canEdit || isSending || !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="ส่งข้อความ"
            accessibilityState={{ disabled: !canEdit || isSending || !draft.trim() }}
            style={({ pressed }) => [styles.send, { backgroundColor: theme.primary }, pressed && canEdit && styles.pressed]}>
            <PaperPlaneRightIcon weight="fill" size={19} color={theme.onPrimary} />
          </Pressable>
        </View>
      }>
      <ScreenHeader title="ข้อความครอบครัว" />

      <ReadOnlyBanner />

      {liveError ? (
        <ThemedText type="small" style={{ color: theme.dangerText }}>
          เชื่อมต่อห้องสนทนาไม่สำเร็จ: {liveError}
        </ThemedText>
      ) : null}

      {!currentHouseholdId ? (
        <ThemedText type="small" themeColor="textSecondary">
          ยังไม่ได้เลือกกลุ่มครอบครัว
        </ThemedText>
      ) : isLoadingHistory ? (
        <ThemedText type="small" themeColor="textSecondary">
          กำลังโหลดข้อความ...
        </ThemedText>
      ) : loadError ? (
        <ThemedText type="small" style={{ color: theme.dangerText }}>
          {loadError}
        </ThemedText>
      ) : messages.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          ยังไม่มีข้อความ — เริ่มการสนทนากับครอบครัวได้เลย
        </ThemedText>
      ) : (
        <View style={styles.bubbles}>
          {messages.map((message) => {
            const mine = message.senderMemberId._id === currentMembershipId;
            const time = new Date(message.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            return (
              <View
                key={message._id}
                style={[
                  styles.bubble,
                  Elevation.low,
                  { shadowColor: theme.shadow },
                  mine
                    ? { alignSelf: 'flex-end', backgroundColor: theme.primary }
                    : { alignSelf: 'flex-start', backgroundColor: theme.backgroundElement },
                ]}>
                <View style={styles.bubbleHead}>
                  <ThemedText style={[styles.bubbleName, { color: mine ? theme.heroTextMuted : theme.primaryText }]}>
                    {message.senderMemberId.displayName}
                  </ThemedText>
                  <ThemedText style={[styles.bubbleTime, { color: mine ? theme.heroTextMuted : theme.textMuted }]}>
                    {time}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.bubbleText, { color: mine ? theme.onPrimary : theme.text }]}>
                  {message.text}
                </ThemedText>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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