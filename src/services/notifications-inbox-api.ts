import { apiGet, apiPut } from './api-client';

/**
 * The account's server-side notification inbox (`GET/PUT /notifications`) —
 * distinct from `services/notifications.ts`, which schedules OS-level local
 * push notifications on-device. This inbox is what backs the "การแจ้งเตือน"
 * screen's server-derived items and the message badge, and works
 * regardless of platform/build (including Expo Go on Android, where local
 * push can't be scheduled at all).
 */
export type NotificationType = 'MEDICINE' | 'APPOINTMENT' | 'SYSTEM' | 'EMERGENCY' | 'TASK' | 'VITALS' | 'MESSAGE';

export type ApiNotification = {
  _id: string;
  userId: string;
  householdId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, string>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Account-wide — spans every household this account belongs to, same as pendingInvites. */
export const getNotifications = () => apiGet<ApiNotification[]>('/notifications');

export const markNotificationRead = (id: string) => apiPut<ApiNotification>(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => apiPut<null>('/notifications/read-all');
