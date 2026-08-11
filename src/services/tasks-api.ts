import { apiDelete, apiGet, apiPatch, apiPost } from './api-client';

export type ApiTaskStatus = 'pending' | 'in-progress' | 'done';

export type ApiTask = {
  _id: string;
  householdId: string;
  title: string;
  detail: string;
  status: ApiTaskStatus;
  assignedToMemberId: { _id: string; displayName: string } | null;
  relatedType: 'checkin' | 'medication' | 'appointment' | 'vitals' | 'custom';
  owner: string | null;
};

export type TaskInput = {
  title: string;
  detail?: string;
  assignedToMemberId?: string | null;
  relatedType?: ApiTask['relatedType'];
};

export const getTasks = (householdId: string) => apiGet<ApiTask[]>(`/households/${householdId}/tasks`);

export const createTask = (householdId: string, input: TaskInput) =>
  apiPost<ApiTask>(`/households/${householdId}/tasks`, input);

export const updateTaskStatus = (householdId: string, taskId: string, status: ApiTaskStatus) =>
  apiPatch<ApiTask>(`/households/${householdId}/tasks/${taskId}/status`, { status });

export const deleteTask = (householdId: string, taskId: string) =>
  apiDelete<null>(`/households/${householdId}/tasks/${taskId}`);
