import { apiPost } from './api-client';

export type ApiEmergencyAlert = {
  _id: string;
  householdId: string;
  triggeredByMemberId: string;
  forMemberId: string;
  message: string | null;
  status: 'active' | 'acknowledged' | 'resolved';
};

export const triggerEmergency = (householdId: string, message?: string) =>
  apiPost<ApiEmergencyAlert>(`/households/${householdId}/emergency/trigger`, { message });
