import { apiDelete, apiGet } from './api-client';

/** The attributed sender — a `HouseholdMember`, not a `User`, since a
 *  message can be recorded on behalf of an account-less member profile (an
 *  elderly relative with no phone). Confirmed against the live API: this is
 *  the field the backend actually populates, distinct from `senderUserId`
 *  (a plain, sometimes-null reference to the authenticated account). */
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

/** Oldest-first, so bubbles stack top-to-bottom. `before` pages backward
 *  (older messages) using a message's `createdAt`. */
export const getMessages = (householdId: string, options?: { limit?: number; before?: string }) =>
  apiGet<ApiMessage[]>(`/households/${householdId}/messages`, {
    limit: options?.limit,
    before: options?.before,
  });

export const deleteMessage = (householdId: string, messageId: string) =>
  apiDelete<null>(`/households/${householdId}/messages/${messageId}`);