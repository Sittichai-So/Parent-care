import { View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useNotificationPermission } from '@/hooks/use-notification-permission';
import { useTheme } from '@/hooks/use-theme';

/** Nudges the user to grant notification permission on screens where medication
 *  or appointment reminders matter — without this, reminders are scheduled but
 *  silently never show, which reads as "the feature is broken". Renders nothing
 *  once permission is granted, or on platforms that don't support it (web). */
export function NotificationBanner() {
  const theme = useTheme();
  const { supported, granted, request } = useNotificationPermission();

  if (!supported || granted !== false) return null;

  return (
    <Card tone="warning" elevation="flat" gap={Spacing.two}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <Ionicons name="notifications-off-outline" size={18} color={theme.warningText} />
        <ThemedText type="smallBold" style={{ color: theme.warningText }}>
          ยังไม่ได้เปิดการแจ้งเตือน
        </ThemedText>
      </View>
      <ThemedText type="small" style={{ color: theme.warningText }}>
        เปิดการแจ้งเตือนเพื่อไม่พลาดเวลาทานยาและนัดหมาย
      </ThemedText>
      <AppButton label="เปิดการแจ้งเตือน" size="medium" onPress={request} />
    </Card>
  );
}
