import { apiGet } from './api-client';

export type ApiTimelineEvent = {
  _id: string;
  householdId: string;
  actorMemberId: { _id: string; displayName: string } | null;
  relatedMemberId: { _id: string; displayName: string } | null;
  type: 'check-in' | 'medication' | 'task' | 'appointment' | 'vitals' | 'emergency';
  title: string;
  detail: string;
  occurredAt: string;
};

export const getTimeline = (householdId: string, limit = 30) =>
  apiGet<ApiTimelineEvent[]>(`/households/${householdId}/timeline`, { limit });
