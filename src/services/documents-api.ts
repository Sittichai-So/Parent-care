import { apiDelete, apiGet, apiPost, apiPut } from './api-client';

/** `kind` is stored server-side as the Thai label the design's pill renders
 *  verbatim (`ID` · `สิทธิ์` · `ประกัน` · `PDF`) — not a slug — so it's typed
 *  as `string` and printed straight through, same as `meta`. */
export type ApiDocument = {
  _id: string;
  householdId: string;
  memberId: { _id: string; displayName: string; relation: string };
  name: string;
  kind: string;
  meta: string;
  referenceNumber: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  createdByMemberId: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentInput = {
  memberId: string;
  name: string;
  kind: string;
  meta?: string;
  referenceNumber?: string;
  issuedAt?: string;
  expiresAt?: string;
  fileUrl?: string;
};

export const getDocuments = (householdId: string, options?: { memberId?: string; kind?: string }) =>
  apiGet<ApiDocument[]>(`/households/${householdId}/documents`, {
    memberId: options?.memberId,
    kind: options?.kind,
  });

export const createDocument = (householdId: string, input: DocumentInput) =>
  apiPost<ApiDocument>(`/households/${householdId}/documents`, input);

export const updateDocument = (householdId: string, documentId: string, patch: Partial<DocumentInput>) =>
  apiPut<ApiDocument>(`/households/${householdId}/documents/${documentId}`, patch);

export const deleteDocument = (householdId: string, documentId: string) =>
  apiDelete<null>(`/households/${householdId}/documents/${documentId}`);