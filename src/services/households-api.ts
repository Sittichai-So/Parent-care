import { apiGet, apiPatch, apiPost } from './api-client';

export type HouseholdRole = 'owner' | 'caregiver' | 'elder' | 'viewer';
export type ApiMemberStatus = 'normal' | 'monitor' | 'urgent';

export type ApiHousehold = {
  _id: string;
  name: string;
  ownerUserId: string;
  inviteCode: string;
  inviteCodeRotatedAt: string;
};

export type ApiHouseholdMember = {
  _id: string;
  householdId: string;
  userId: string;
  role: HouseholdRole;
  displayName: string;
  relation: string;
  status: ApiMemberStatus;
  detail: string;
  isActive: boolean;
};

export type HouseholdWithMembership = { household: ApiHousehold; membership: ApiHouseholdMember };

export const createHousehold = (name: string, displayName: string, relation: string) =>
  apiPost<HouseholdWithMembership>('/households', { name, displayName, relation });

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
