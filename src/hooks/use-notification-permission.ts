import { useCallback, useEffect, useState } from 'react';

import {
  canScheduleLocalNotifications,
  ensureNotificationPermission,
  getNotificationPermissionGranted,
} from '@/services/notifications';

export function useNotificationPermission() {
  const [granted, setGranted] = useState<boolean | null>(canScheduleLocalNotifications ? null : false);

  const refresh = useCallback(async () => {
    if (!canScheduleLocalNotifications) return;
    setGranted(await getNotificationPermissionGranted());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const request = useCallback(async () => {
    const result = await ensureNotificationPermission();
    setGranted(result);
    return result;
  }, []);

  return { supported: canScheduleLocalNotifications, granted, request };
}
