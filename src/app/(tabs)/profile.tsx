import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  CalendarHeartIcon,
  CalendarPlusIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CheckIcon,
  FileTextIcon,
  IdentificationCardIcon,
  ListChecksIcon,
  PillIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { MedicalHeader } from '@/components/ui/medical-header';
import { ReadOnlyBanner } from '@/components/ui/read-only-banner';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyContext, type FamilyEvent } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';
import * as documentsApi from '@/services/documents-api';
import type { ApiDocument } from '@/services/documents-api';
import * as handoffNotesApi from '@/services/handoff-notes-api';
import type { ApiHandoffNote } from '@/services/handoff-notes-api';
import { daysFromToday, isToday, relativeDayLabel } from '@/utils/date';

/** Icon per document `kind` — the backend stores `kind` as this exact Thai
 *  label (see documents-api.ts), so this is keyed on the label itself, not
 *  a slug. Unrecognized kinds (a label this app hasn't seen yet) fall back
 *  to a generic file icon rather than failing to render. */
const documentKindIcons: Record<string, PhosphorIcon> = {
  ID: IdentificationCardIcon,
  สิทธิ์: SealCheckIcon,
  ประกัน: ShieldCheckIcon,
  PDF: FileTextIcon,
};

const timelineIcons: Record<FamilyEvent['type'], PhosphorIcon> = {
  'check-in': CheckCircleIcon,
  medication: PillIcon,
  task: ListChecksIcon,
  appointment: CalendarPlusIcon,
  vitals: ListChecksIcon,
  emergency: WarningCircleIcon,
};

/** "โปรไฟล์" tab — per the reference design's screen 10, including
 *  "บันทึกส่งต่อเวร" (handoff notes) and "เอกสารและสิทธิ์" (documents),
 *  both backed by real endpoints (handoff-notes-api.ts / documents-api.ts). */
export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const {
    currentHousehold,
    currentHouseholdId,
    currentRole,
    currentMembershipId,
    canEdit,
    medications,
    appointments,
    timeline,
    checkIn,
  } = useFamilyContext();

  const [handoffNotes, setHandoffNotes] = useState<ApiHandoffNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [draftNote, setDraftNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);

  // react-hooks/set-state-in-effect flags the synchronous setState calls
  // below — same situation as family-context.tsx's identically-suppressed
  // effects: React 19 batches every setState call made during one effect
  // execution into a single re-render, so there's no real cascade here to
  // restructure around.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!currentHouseholdId) {
      setHandoffNotes([]);
      setDocuments([]);
      setIsLoadingNotes(false);
      setIsLoadingDocuments(false);
      return;
    }
    let cancelled = false;

    setIsLoadingNotes(true);
    handoffNotesApi
      .getHandoffNotes(currentHouseholdId)
      .then((notes) => {
        if (!cancelled) setHandoffNotes(notes);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingNotes(false);
      });

    setIsLoadingDocuments(true);
    documentsApi
      .getDocuments(currentHouseholdId)
      .then((docs) => {
        if (!cancelled) setDocuments(docs);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDocuments(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentHouseholdId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const addHandoffNote = async () => {
    const text = draftNote.trim();
    if (!text || !canEdit || !currentHouseholdId) return;
    setIsSavingNote(true);
    try {
      const created = await handoffNotesApi.createHandoffNote(currentHouseholdId, text);
      setHandoffNotes((current) => [created, ...current]);
      setDraftNote('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      Alert.alert('บันทึกไม่สำเร็จ', message);
    } finally {
      setIsSavingNote(false);
    }
  };

  const myMedication = useMemo(
    () => medications.find((med) => med.memberId === currentMembershipId && med.active),
    [medications, currentMembershipId]
  );
  const myMedTakenToday = myMedication?.lastTakenAt ? isToday(myMedication.lastTakenAt.slice(0, 10)) : false;

  const myNextAppointment = useMemo(
    () =>
      appointments
        .filter((apt) => apt.memberId === currentMembershipId && daysFromToday(apt.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0],
    [appointments, currentMembershipId]
  );

  const confirmLogout = () => {
    Alert.alert('ออกจากระบบ', 'ต้องการออกจากระบบใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: () => { logout(); router.replace('/login'); } },
    ]);
  };

  return (
    <Screen
      header={
        <MedicalHeader
          title="โปรไฟล์"
          subtitle={currentHousehold?.name ?? ''}
          onNotificationPress={() => router.push('/notices')}
          onLogoutPress={confirmLogout}
        />
      }>
      <ReadOnlyBanner />

      <Card elevation="floating" padding={Spacing.four} gap={Spacing.two} style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
          <ThemedText style={[styles.avatarInitials, { color: theme.primaryText }]}>
            {(user?.name ?? '?').slice(0, 2)}
          </ThemedText>
        </View>
        <ThemedText type="heading">{user?.name ?? 'คุณ'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {currentRole ?? ''}
          {user?.email ? ` · ${user.email}` : ''}
        </ThemedText>
      </Card>

      <SectionHeader title="ข้อมูลสุขภาพของฉัน" />
      <View style={styles.list}>
        {myMedication ? (
          <Pressable
            onPress={() => router.push({ pathname: '/medication-confirm', params: { id: myMedication.id } })}
            accessibilityRole="button"
            accessibilityLabel={`ยาของฉัน — ${myMedication.name} — ${myMedTakenToday ? 'ยืนยันแล้ว' : 'รอยืนยัน'}`}
            style={({ pressed }) => pressed && styles.pressed}>
            <Card gap={Spacing.three} style={styles.row}>
              <View style={[styles.chip, { backgroundColor: myMedTakenToday ? theme.successSoft : theme.warningSoft }]}>
                {myMedTakenToday ? (
                  <CheckCircleIcon weight="fill" size={22} color={theme.successText} />
                ) : (
                  <PillIcon weight="duotone" size={22} color={theme.warningText} />
                )}
              </View>
              <View style={styles.rowBody}>
                <ThemedText type="smallBold">ยาของฉัน · {myMedication.schedule[0] ?? ''}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {myMedication.name} {myMedication.dosage}
                </ThemedText>
              </View>
              <CaretRightIcon weight="bold" size={18} color={theme.textMuted} />
            </Card>
          </Pressable>
        ) : null}

        {myNextAppointment ? (
          <Pressable
            onPress={() => router.push({ pathname: '/appointment-detail', params: { id: myNextAppointment.id } })}
            accessibilityRole="button"
            accessibilityLabel={`นัดหมายของฉัน — ${myNextAppointment.title}`}
            style={({ pressed }) => pressed && styles.pressed}>
            <Card gap={Spacing.three} style={styles.row}>
              <View style={[styles.chip, { backgroundColor: theme.primarySoft }]}>
                <CalendarHeartIcon weight="duotone" size={22} color={theme.primaryText} />
              </View>
              <View style={styles.rowBody}>
                <ThemedText type="smallBold">นัดหมายของฉัน</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {myNextAppointment.title} · {relativeDayLabel(myNextAppointment.date)} {myNextAppointment.time} น.
                </ThemedText>
              </View>
              <CaretRightIcon weight="bold" size={18} color={theme.textMuted} />
            </Card>
          </Pressable>
        ) : null}

        {!myMedication && !myNextAppointment ? (
          <Card tone="sunken" elevation="flat">
            <ThemedText type="small" themeColor="textSecondary">
              ยังไม่มีรายการยาหรือนัดหมายของคุณเอง
            </ThemedText>
          </Card>
        ) : null}
      </View>

      <SectionHeader title="บันทึกส่งต่อเวร" />
      <View style={styles.list}>
        <TextInput
          value={draftNote}
          onChangeText={setDraftNote}
          editable={canEdit && !isSavingNote}
          multiline
          numberOfLines={3}
          placeholder={canEdit ? 'เพิ่มบันทึกสำหรับผู้ดูแลคนถัดไป' : 'ดูได้เท่านั้น — บันทึกไม่ได้'}
          placeholderTextColor={theme.placeholder}
          accessibilityLabel="เพิ่มบันทึกส่งต่อเวร"
          style={[
            styles.textarea,
            { backgroundColor: theme.backgroundElement, color: theme.text, shadowColor: theme.shadow },
          ]}
        />
        <AppButton
          label="บันทึก"
          disabled={!canEdit || !draftNote.trim() || isSavingNote}
          loading={isSavingNote}
          onPress={addHandoffNote}
        />
        {isLoadingNotes ? (
          <ThemedText type="small" themeColor="textSecondary">
            กำลังโหลดบันทึก...
          </ThemedText>
        ) : handoffNotes.length === 0 ? (
          <Card tone="sunken" elevation="flat">
            <ThemedText type="small" themeColor="textSecondary">
              ยังไม่มีบันทึกส่งต่อเวร
            </ThemedText>
          </Card>
        ) : (
          handoffNotes.map((note) => (
            <Card key={note._id} gap={Spacing.half}>
              <View style={styles.noteHead}>
                <ThemedText type="smallBold">{note.authorMemberId.displayName}</ThemedText>
                <ThemedText type="caption" themeColor="textMuted">
                  {new Date(note.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {note.text}
              </ThemedText>
            </Card>
          ))
        )}
      </View>

      <SectionHeader title="เอกสารและสิทธิ์" />
      <View style={styles.list}>
        {isLoadingDocuments ? (
          <ThemedText type="small" themeColor="textSecondary">
            กำลังโหลดเอกสาร...
          </ThemedText>
        ) : documents.length === 0 ? (
          <Card tone="sunken" elevation="flat">
            <ThemedText type="small" themeColor="textSecondary">
              ยังไม่มีเอกสารในกลุ่มบ้านนี้
            </ThemedText>
          </Card>
        ) : (
          documents.map((doc) => {
            const DocIcon = documentKindIcons[doc.kind] ?? FileTextIcon;
            return (
              <Card key={doc._id} gap={Spacing.three} style={styles.docRow}>
                <DocIcon weight="duotone" size={26} color={theme.primaryText} />
                <View style={styles.docBody}>
                  <ThemedText type="smallBold">{doc.name}</ThemedText>
                  <ThemedText type="caption" themeColor="textMuted">
                    {doc.meta}
                  </ThemedText>
                </View>
                <View style={[styles.kindPill, { backgroundColor: theme.primarySoft }]}>
                  <ThemedText type="caption" style={{ color: theme.primaryText, fontWeight: '700' }}>
                    {doc.kind}
                  </ThemedText>
                </View>
              </Card>
            );
          })
        )}
      </View>

      {/* Not in the reference design's own Profile screen — these are real
       *  app features (self check-in shortcut, household activity feed)
       *  that used to sit at the bottom of Home; moved here so Home ends
       *  exactly where the reference design's Home does. */}
      <SectionHeader title="การดำเนินการด่วน" />
      <View style={styles.list}>
        <AppButton
          label="ตรวจสอบสถานะ"
          phosphorIcon={CheckIcon}
          onPress={() => {
            checkIn()
              .then(() => Alert.alert('บันทึกสำเร็จ', 'บันทึกการตรวจสอบสถานะเรียบร้อยแล้ว'))
              .catch((err) => {
                const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
                Alert.alert('บันทึกไม่สำเร็จ', message);
              });
          }}
        />
        <View style={styles.quickRow}>
          <AppButton
            label="นัดหมาย"
            phosphorIcon={CalendarPlusIcon}
            variant="secondary"
            style={styles.quickHalf}
            onPress={() => router.push('/appointments')}
          />
          <AppButton
            label="รายการยา"
            phosphorIcon={PillIcon}
            variant="secondary"
            style={styles.quickHalf}
            onPress={() => router.push('/medications')}
          />
        </View>
      </View>

      <SectionHeader title="ไทม์ไลน์ครอบครัว" />
      <Card gap={0} padding={Spacing.three}>
        {timeline.map((item, index) => {
          const isLast = index === timeline.length - 1;
          const EventIcon = timelineIcons[item.type];
          return (
            <View key={item.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, { backgroundColor: theme.primarySoft }]}>
                  <EventIcon weight="duotone" size={16} color={theme.primaryText} />
                </View>
                {!isLast ? <View style={[styles.timelineLine, { backgroundColor: theme.border }]} /> : null}
              </View>

              <View style={[styles.timelineBody, isLast && styles.timelineBodyLast]}>
                <View style={styles.timelineHead}>
                  <ThemedText type="smallBold" style={styles.timelineTitle}>
                    {item.title}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textMuted">
                    {item.time}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.detail}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 21, fontWeight: '800' },
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center' },
  chip: { width: 44, height: 44, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  rowBody: { flex: 1, gap: 2 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  textarea: {
    minHeight: 88,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    fontSize: 14.5,
    lineHeight: 22,
    textAlignVertical: 'top',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  noteHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.two },

  docRow: { flexDirection: 'row', alignItems: 'center' },
  docBody: { flex: 1, gap: 2 },
  kindPill: { borderRadius: Radius.full, paddingHorizontal: Spacing.two + 3, paddingVertical: Spacing.one },

  quickRow: { flexDirection: 'row', gap: Spacing.two },
  quickHalf: { flex: 1 },

  timelineRow: { flexDirection: 'row', gap: Spacing.three },
  timelineRail: { alignItems: 'center', width: 32 },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: { width: 2, flex: 1, marginVertical: Spacing.one },
  timelineBody: { flex: 1, gap: Spacing.half, paddingBottom: Spacing.three },
  timelineBodyLast: { paddingBottom: 0 },
  timelineHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  timelineTitle: { flex: 1 },
});
