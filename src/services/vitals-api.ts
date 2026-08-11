import { apiGet, apiPost } from './api-client';

export type ApiVital = {
  _id: string;
  householdId: string;
  memberId: string;
  recordedAt: string;
  systolic: number | null;
  diastolic: number | null;
  sugar: number | null;
  weight: number | null;
  note: string | null;
};

export type VitalInput = {
  memberId: string;
  systolic?: number;
  diastolic?: number;
  sugar?: number;
  weight?: number;
  note?: string;
};

export const getVitals = (householdId: string, memberId?: string, limit?: number) =>
  apiGet<ApiVital[]>(`/households/${householdId}/vitals`, { memberId, limit });

export const createVital = (householdId: string, input: VitalInput) =>
  apiPost<ApiVital>(`/households/${householdId}/vitals`, input);
