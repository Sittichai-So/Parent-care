import { apiGet, apiPatch, apiPost } from './api-client';

export type HouseholdRole = 'owner' | 'caregiver' | 'elder' | 'viewer';
export type ApiMemberStatus = 'normal' | 'monitor' | 'urgent';
export type HouseholdKind = 'parents' | 'partner' | 'relatives' | 'other';

export type ApiHousehold = {
  _id: string;
  name: string;
  ownerUserId: string;
  kind: HouseholdKind;
  inviteCode: string;
  inviteCodeRotatedAt: string;
};

export type ApiHouseholdMember = {
  _id: string;
  householdId: string;
  userId: string | null;
  role: HouseholdRole;
  displayName: string;
  relation: string;
  status: ApiMemberStatus;
  detail: string;
  lastCheckInAt: string | null;
  isActive: boolean;
  membershipState: 'active' | 'pending';
  claimCode?: string | null;
  claimCodeExpiresAt?: string | null;
  isDefault: boolean;
};

export type HouseholdWithMembership = { household: ApiHousehold; membership: ApiHouseholdMember };

export type ApiUserLookup = { _id: string; name: string; userCode: string | null };

export type ApiPendingInvite = { household: ApiHousehold; membership: ApiHouseholdMember };

export const createHousehold = (name: string, displayName: string, relation: string, kind?: HouseholdKind) =>
  apiPost<HouseholdWithMembership>('/households', { name, displayName, relation, kind });

export const joinHousehold = (
  inviteCode: string,
  role: Exclude<HouseholdRole, 'owner'>,
  displayName: string,
  relation: string
) => apiPost<HouseholdWithMembership>('/households/join', { inviteCode, role, displayName, relation });

export const listMyHouseholds = () => apiGet<HouseholdWithMembership[]>('/households/mine');

export const getMembers = (householdId: string) => apiGet<ApiHouseholdMember[]>(`/households/${householdId}/members`);

export const updateMember = (
  householdId: string,
  memberId: string,
  patch: Partial<Pick<ApiHouseholdMember, 'displayName' | 'relation' | 'status' | 'detail' | 'role'>>
) => apiPatch<ApiHouseholdMember>(`/households/${householdId}/members/${memberId}`, patch);

export const checkIn = (householdId: string, memberId: string) =>
  apiPost<ApiHouseholdMember>(`/households/${householdId}/members/${memberId}/check-in`);

export const createManagedMember = (
  householdId: string,
  input: {
    displayName: string;
    relation: string;
    role: Extract<HouseholdRole, 'elder' | 'viewer'>;
    birthday?: string | null;
    gender?: string | null;
  }
) => apiPost<ApiHouseholdMember>(`/households/${householdId}/members`, input);

export const lookupUser = (query: { code: string } | { email: string }) =>
  apiGet<ApiUserLookup>('/users/lookup', query);

export const inviteExistingUser = (
  householdId: string,
  input: { userId: string; role: Exclude<HouseholdRole, 'owner'>; displayName: string; relation: string }
) => apiPost<ApiHouseholdMember>(`/households/${householdId}/members/invite`, input);

export const getPendingInvites = () => apiGet<ApiPendingInvite[]>('/users/me/pending-invites');

export const acceptInvite = (householdId: string, memberId: string) =>
  apiPost<ApiHouseholdMember>(`/households/${householdId}/members/${memberId}/accept`);

export const declineInvite = (householdId: string, memberId: string) =>
  apiPost<null>(`/households/${householdId}/members/${memberId}/decline`);

export const generateClaimCode = (householdId: string, memberId: string) =>
  apiPost<ApiHouseholdMember>(`/households/${householdId}/members/${memberId}/generate-claim-code`);

export const claimMembership = (claimCode: string) =>
  apiPost<ApiHouseholdMember>('/households/claim', { claimCode });

export const setDefaultHousehold = (householdId: string) =>
  apiPost<ApiHouseholdMember>(`/households/${householdId}/set-default`);
