import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  CalendarPlusIcon,
  CameraIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  ListChecksIcon,
  WarningCircleIcon,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import type { BadgeTone } from '@/components/ui/status-badge';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Radius, Spacing } from '@/constants/theme';
import { useFamilyContext, type FamilyEvent } from '@/context/family-context';
import { useTheme } from '@/hooks/use-theme';

/** Icon + tone per real event type — mirrors the mapping used for the family
 *  timeline on the home screen, so "audit log" and "timeline" read as the
 *  same underlying data (they are: both come from `timeline-api.ts`), just
 *  presented for the household owner rather than folded into the dashboard. */
const EVENT_META: Record<FamilyEvent['type'], { icon: PhosphorIcon; tone: BadgeTone }> = {
  'check-in': { icon: CheckCircleIcon, tone: 'success' },
  // `Camera`, not `Pill` — per the reference design's own audit-log entry for
  // this exact action ("ยืนยันการทานยาพร้อมรูป"), which is about the photo
  // confirmation act, not the medication itself.
  medication: { icon: CameraIcon, tone: 'success' },
  task: { icon: ListChecksIcon, tone: 'primary' },
  appointment: { icon: CalendarPlusIcon, tone: 'primary' },
  vitals: { icon: ClipboardTextIcon, tone: 'neutral' },
  emergency: { icon: WarningCircleIcon, tone: 'danger' },
};

export default function AuditLogScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { currentRole, currentHousehold, timeline } = useFamilyContext();

  const toneColor: Record<BadgeTone, { chipBg: string; ink: string }> = {
    neutral: { chipBg: theme.surfaceSunken, ink: theme.textSecondary },
    primary: { chipBg: theme.primarySoft, ink: theme.primaryText },
    success: { chipBg: theme.successSoft, ink: theme.successText },
    warning: { chipBg: theme.warningSoft, ink: theme.warningText },
    danger: { chipBg: theme.dangerSoft, ink: theme.dangerText },
  };

  if (currentRole !== 'Owner') {
    return (
      <Screen center gap={Spacing.three}>
        <ScreenHeader title="บันทึกการใช้งานระบบ" />
        <Card tone="sunken" elevation="flat" gap={Spacing.two}>
          <ThemedText type="smallBold">เฉพาะเจ้าของบ้านเท่านั้น</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            บันทึกกิจกรรมของทั้งบ้านมีเฉพาะบัญชี Owner ของกลุ่มครอบครัวที่เข้าถึงได้
          </ThemedText>
        </Card>
        <AppButton label="กลับ" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen gap={Spacing.three}>
      <ScreenHeader
        title="บันทึกการใช้งานระบบ"
        eyebrow={currentHousehold?.name ?? 'ครอบครัว'}
        subtitle="กิจกรรมล่าสุดของทุกคนในบ้าน"
      />

      {timeline.length === 0 ? (
        <Card tone="sunken" elevation="flat">
          <ThemedText type="small" themeColor="textSecondary">
            ยังไม่มีกิจกรรมที่บันทึกไว้
          </ThemedText>
        </Card>
      ) : (
        <View style={styles.list}>
          {timeline.map((event) => {
            const meta = EVENT_META[event.type];
            const colors = toneColor[meta.tone];
            const EventIcon = meta.icon;
            return (
              <Card key={event.id} gap={Spacing.three} style={styles.row}>
                <View style={[styles.chip, { backgroundColor: colors.chipBg }]}>
                  <EventIcon weight="duotone" size={20} color={colors.ink} />
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.rowHead}>
                    <ThemedText type="smallBold" style={styles.rowTitle} numberOfLines={1}>
                      {event.title}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textMuted">
                      {event.time}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {event.detail}
                  </ThemedText>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  chip: { width: 40, height: 40, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  rowBody: { flex: 1, gap: Spacing.half },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.two },
  rowTitle: { flex: 1 },
});
