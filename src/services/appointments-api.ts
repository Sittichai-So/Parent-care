import { apiDelete, apiGet, apiPost, apiPut } from './api-client';

export type ApiAppointment = {
  _id: string;
  householdId: string;
  memberId: string;
  title: string;
  date: string;
  time: string;
  hospital: string;
  doctor: string | null;
  department: string | null;
  notes: string | null;
  medicationNote: string | null;
  linkedMedicationIds: string[];
  reminderEnabled: boolean;
};

export type AppointmentInput = {
  memberId: string;
  title: string;
  date: string;
  time: string;
  hospital: string;
  doctor?: string;
  department?: string;
  notes?: string;
  medicationNote?: string;
  linkedMedicationIds?: string[];
  reminderEnabled?: boolean;
};

export const getAppointments = (householdId: string, memberId?: string) =>
  apiGet<ApiAppointment[]>(`/households/${householdId}/appointments`, { memberId });

export const createAppointment = (householdId: string, input: AppointmentInput) =>
  apiPost<ApiAppointment>(`/households/${householdId}/appointments`, input);

export const updateAppointment = (householdId: string, appointmentId: string, patch: Partial<AppointmentInput>) =>
  apiPut<ApiAppointment>(`/households/${householdId}/appointments/${appointmentId}`, patch);

export const deleteAppointment = (householdId: string, appointmentId: string) =>
  apiDelete<null>(`/households/${householdId}/appointments/${appointmentId}`);
