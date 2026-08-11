import { apiDelete, apiGet, apiPost, apiPut } from './api-client';

export type ApiMedicine = {
  _id: string;
  householdId: string;
  memberId: string;
  name: string;
  dosage: string;
  reason: string | null;
  times: string[];
  notes: string | null;
  isActive: boolean;
  lastTakenAt: string | null;
};

export type MedicineInput = {
  memberId: string;
  name: string;
  dosage: string;
  reason?: string;
  times: string[];
  notes?: string;
  isActive?: boolean;
};

export const getMedicines = (householdId: string, memberId?: string) =>
  apiGet<ApiMedicine[]>(`/households/${householdId}/medicines`, { memberId });

export const createMedicine = (householdId: string, input: MedicineInput) =>
  apiPost<ApiMedicine>(`/households/${householdId}/medicines`, input);

export const updateMedicine = (householdId: string, medicineId: string, patch: Partial<MedicineInput>) =>
  apiPut<ApiMedicine>(`/households/${householdId}/medicines/${medicineId}`, patch);

export const deleteMedicine = (householdId: string, medicineId: string) =>
  apiDelete<null>(`/households/${householdId}/medicines/${medicineId}`);

export const logDose = (householdId: string, medicineId: string, status: 'taken' | 'missed' | 'skipped' = 'taken') =>
  apiPost(`/households/${householdId}/medicines/${medicineId}/logs`, { status });
