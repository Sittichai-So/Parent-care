import { useCallback, useEffect, useState } from 'react';

import {
  canScheduleLocalNotifications,
  ensureNotificationPermission,
  getNotificationPermissionGranted,
} from '@/services/notifications';

/** Tracks whether reminder notifications are actually able to fire on this device,
 *  so screens can nudge the user instead of scheduling reminders that silently
 *  never show up. `granted` is `null` while the initial check is in flight.
 *
 *  Goes through `services/notifications` rather than importing `expo-notifications`
 *  directly — a direct import crashes on Expo Go/Android, see that file's header. */
export function useNotificationPermission() {
  // Unsupported platforms (web, Expo Go on Android) are known synchronously — no
  // need to wait on an effect for them, which keeps the effect below free of a
  // same-tick setState.
  const [granted, setGranted] = useState<boolean | null>(canScheduleLocalNotifications ? null : false);

  const refresh = useCallback(async () => {
    if (!canScheduleLocalNotifications) return;
    setGranted(await getNotificationPermissionGranted());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const request = useCallback(async () => {
    const result = await ensureNotificationPermission();
    setGranted(result);
    return result;
  }, []);

  return { supported: canScheduleLocalNotifications, granted, request };
}
