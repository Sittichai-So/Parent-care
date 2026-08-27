import { apiGet, apiPut } from './api-client';

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

export const getNotifications = () => apiGet<ApiNotification[]>('/notifications');

export const markNotificationRead = (id: string) => apiPut<ApiNotification>(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => apiPut<null>('/notifications/read-all');
