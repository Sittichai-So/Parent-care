import { apiDelete, apiGet } from './api-client';

export type ApiMessageSender = { _id: string; role: string; displayName: string; avatar: string | null };

export type ApiMessage = {
  _id: string;
  householdId: string;
  senderMemberId: ApiMessageSender;
  senderUserId: string | null;
  text: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export const getMessages = (householdId: string, options?: { limit?: number; before?: string }) =>
  apiGet<ApiMessage[]>(`/households/${householdId}/messages`, {
    limit: options?.limit,
    before: options?.before,
  });

export const deleteMessage = (householdId: string, messageId: string) =>
  apiDelete<null>(`/households/${householdId}/messages/${messageId}`);