// Do NOT statically `import ... from 'expo-notifications'` here or in anything
// that imports this file — it crashes on import in Expo Go/Android. Access is
// lazy via require() inside getNotifications(), gated on canScheduleLocalNotifications.
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import type { Appointment, Medication } from '@/context/family-context';

const isExpoGoAndroid = Platform.OS === 'android' && isRunningInExpoGo();

export const canScheduleLocalNotifications =
  (Platform.OS === 'android' || Platform.OS === 'ios') && !isExpoGoAndroid;

const REMINDER_CHANNEL_ID = 'reminders';

type NotificationsModule = typeof import('expo-notifications');

let cachedModule: NotificationsModule | null = null;
let handlerConfigured = false;

function getNotifications(): NotificationsModule | null {
  if (!canScheduleLocalNotifications) return null;

  if (!cachedModule) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- must stay lazy, see file header
      cachedModule = require('expo-notifications') as NotificationsModule;
    } catch {
      return null;
    }
  }

  if (!handlerConfigured) {
    handlerConfigured = true;
    cachedModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  return cachedModule;
}

let hasRequestedThisSession = false;

async function ensureAndroidChannel(notifications: NotificationsModule) {
  if (Platform.OS !== 'android') return;
  await notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'ยาและนัดหมาย',
    importance: notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2563EB',
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const notifications = getNotifications();
  if (!notifications) return false;

  const current = await notifications.getPermissionsAsync();
  if (current.granted) {
    await ensureAndroidChannel(notifications);
    return true;
  }
  if (!current.canAskAgain && hasRequestedThisSession) return false;

  hasRequestedThisSession = true;
  const requested = await notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: true },
  });
  if (requested.granted) await ensureAndroidChannel(notifications);
  return requested.granted;
}

export async function getNotificationPermissionGranted(): Promise<boolean> {
  const notifications = getNotifications();
  if (!notifications) return false;
  const current = await notifications.getPermissionsAsync();
  return current.granted;
}

async function cancelAllWithPrefix(prefix: string) {
  const notifications = getNotifications();
  if (!notifications) return;
  const scheduled = await notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => notification.identifier.startsWith(prefix))
      .map((notification) => notifications.cancelScheduledNotificationAsync(notification.identifier))
  );
}

const medicationPrefix = (medicationId: string) => `medication-${medicationId}-`;
const appointmentPrefix = (appointmentId: string) => `appointment-${appointmentId}-`;

export async function syncMedicationReminders(medication: Medication): Promise<void> {
  const notifications = getNotifications();
  if (!notifications) return;

  await cancelAllWithPrefix(medicationPrefix(medication.id));
  if (!medication.active || medication.schedule.length === 0) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await Promise.all(
    medication.schedule.map((time) => {
      const [hour, minute] = time.split(':').map(Number);
      if (Number.isNaN(hour) || Number.isNaN(minute)) return Promise.resolve();

      return notifications.scheduleNotificationAsync({
        identifier: `${medicationPrefix(medication.id)}${time}`,
        content: {
          title: `ถึงเวลาทานยา: ${medication.name}`,
          body: [medication.dosage, medication.notes].filter(Boolean).join(' · '),
          sound: true,
          data: { kind: 'medication', medicationId: medication.id },
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
    })
  );
}

export async function cancelMedicationReminders(medicationId: string): Promise<void> {
  await cancelAllWithPrefix(medicationPrefix(medicationId));
}

export async function syncAppointmentReminder(appointment: Appointment): Promise<void> {
  const notifications = getNotifications();
  if (!notifications) return;

  await cancelAllWithPrefix(appointmentPrefix(appointment.id));
  if (!appointment.reminderEnabled) return;

  const [year, month, day] = appointment.date.split('-').map(Number);
  const [hour, minute] = appointment.time.split(':').map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const appointmentAt = new Date(year, month - 1, day, hour, minute);
  const dayBefore = new Date(appointmentAt);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(9, 0, 0, 0);
  const hourBefore = new Date(appointmentAt.getTime() - 60 * 60 * 1000);

  const jobs: Promise<string>[] = [];
  const now = Date.now();

  if (dayBefore.getTime() > now) {
    jobs.push(
      notifications.scheduleNotificationAsync({
        identifier: `${appointmentPrefix(appointment.id)}day-before`,
        content: {
          title: `พรุ่งนี้มีนัดหมาย: ${appointment.title}`,
          body: `${appointment.time} น. ที่ ${appointment.hospital}`,
          sound: true,
          data: { kind: 'appointment', appointmentId: appointment.id },
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DATE,
          date: dayBefore,
          channelId: REMINDER_CHANNEL_ID,
        },
      })
    );
  }

  if (hourBefore.getTime() > now) {
    jobs.push(
      notifications.scheduleNotificationAsync({
        identifier: `${appointmentPrefix(appointment.id)}hour-before`,
        content: {
          title: `ใกล้ถึงเวลานัดหมาย: ${appointment.title}`,
          body: `อีก 1 ชั่วโมง ที่ ${appointment.hospital}`,
          sound: true,
          data: { kind: 'appointment', appointmentId: appointment.id },
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DATE,
          date: hourBefore,
          channelId: REMINDER_CHANNEL_ID,
        },
      })
    );
  }

  await Promise.all(jobs);
}

export async function cancelAppointmentReminder(appointmentId: string): Promise<void> {
  await cancelAllWithPrefix(appointmentPrefix(appointmentId));
}

export type ReminderTapData =
  | { kind: 'medication'; medicationId: string }
  | { kind: 'appointment'; appointmentId: string };

export function addReminderResponseListener(handler: (data: ReminderTapData) => void): { remove: () => void } {
  const notifications = getNotifications();
  if (!notifications) return { remove: () => {} };

  return notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Partial<ReminderTapData> | undefined;
    if (data?.kind === 'medication' && data.medicationId) {
      handler({ kind: 'medication', medicationId: data.medicationId });
    } else if (data?.kind === 'appointment' && data.appointmentId) {
      handler({ kind: 'appointment', appointmentId: data.appointmentId });
    }
  });
}
