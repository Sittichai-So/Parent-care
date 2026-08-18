import { apiDelete, apiGet, apiPost } from './api-client';

export type ApiHandoffNote = {
  _id: string;
  householdId: string;
  authorMemberId: { _id: string; role: string; displayName: string };
  text: string;
  createdAt: string;
  updatedAt: string;
};

/** Newest-first, per the reference design's "บันทึกส่งต่อเวร" list. */
export const getHandoffNotes = (householdId: string) =>
  apiGet<ApiHandoffNote[]>(`/households/${householdId}/handoff-notes`);

export const createHandoffNote = (householdId: string, text: string) =>
  apiPost<ApiHandoffNote>(`/households/${householdId}/handoff-notes`, { text });

export const deleteHandoffNote = (householdId: string, noteId: string) =>
  apiDelete<null>(`/households/${householdId}/handoff-notes/${noteId}`);