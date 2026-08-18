import { apiGet, apiPatch, apiPost } from './api-client';

export type HouseholdRole = 'owner' | 'caregiver' | 'elder' | 'viewer';
export type ApiMemberStatus = 'normal' | 'monitor' | 'urgent';
export type HouseholdKind = 'parents' | 'partner' | 'relatives' | 'other';

export type ApiHousehold = {
  _id: string;
  name: string;
  ownerUserId: string;
  // What kind of group this is (parents' house, partner's, relatives',
  // other) — drives the switcher's icon and meta line. Defaults to 'other'
  // server-side, so always present even on households created before this
  // field existed.
  kind: HouseholdKind;
  inviteCode: string;
  inviteCodeRotatedAt: string;
};

export type ApiHouseholdMember = {
  _id: string;
  householdId: string;
  // Null for a member profile with no linked account of its own (e.g. an
  // elderly relative with no phone) — see createManagedMember below.
  userId: string | null;
  role: HouseholdRole;
  displayName: string;
  relation: string;
  status: ApiMemberStatus;
  detail: string;
  isActive: boolean;
  // 'pending' means an existing account was invited (inviteExistingUser)
  // but hasn't accepted yet — unrelated to `status` above, which is the
  // member's health check-in state. Pending rows are excluded from data
  // access server-side until accepted.
  membershipState: 'active' | 'pending';
  claimCode?: string | null;
  claimCodeExpiresAt?: string | null;
  // True for the one household this account opens on sign-in — a per-user
  // choice on the *membership*, not the household, since two people in the
  // same household can each pick a different default (see setDefaultHousehold).
  isDefault: boolean;
};

export type HouseholdWithMembership = { household: ApiHousehold; membership: ApiHouseholdMember };

/** Result of GET /users/lookup — deliberately minimal (never email/phone),
 *  since this endpoint exists to find *who* to invite, not to browse accounts. */
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

/** Adds a member profile with no linked account of its own — the caller
 *  (owner/caregiver) manages it on that person's behalf. owner/caregiver
 *  roles are rejected server-side: those require someone who can log in
 *  and act for themself. */
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

/** Exact-match only (by userCode or email) — never a name search, so this
 *  can't be used to enumerate other users' accounts. */
export const lookupUser = (query: { code: string } | { email: string }) =>
  apiGet<ApiUserLookup>('/users/lookup', query);

/** Sends a pending invite to an existing account found via lookupUser —
 *  they must accept (acceptInvite) before becoming a real member. */
export const inviteExistingUser = (
  householdId: string,
  input: { userId: string; role: Exclude<HouseholdRole, 'owner'>; displayName: string; relation: string }
) => apiPost<ApiHouseholdMember>(`/households/${householdId}/members/invite`, input);

/** Invites addressed to the current account, across every household —
 *  not scoped to currentHouseholdId since the invitee may not have any
 *  household selected (or even any active household) yet. */
export const getPendingInvites = () => apiGet<ApiPendingInvite[]>('/users/me/pending-invites');

export const acceptInvite = (householdId: string, memberId: string) =>
  apiPost<ApiHouseholdMember>(`/households/${householdId}/members/${memberId}/accept`);

export const declineInvite = (householdId: string, memberId: string) =>
  apiPost<null>(`/households/${householdId}/members/${memberId}/decline`);

/** Generates a one-time code (24h TTL) that lets a userId-less member
 *  profile later be linked to a real account via claimMembership, without
 *  losing its existing medication/appointment/vitals history. */
export const generateClaimCode = (householdId: string, memberId: string) =>
  apiPost<ApiHouseholdMember>(`/households/${householdId}/members/${memberId}/generate-claim-code`);

export const claimMembership = (claimCode: string) =>
  apiPost<ApiHouseholdMember>('/households/claim', { claimCode });

/** Sets the caller's own "กลุ่มเริ่มต้น" (default household) — a per-user,
 *  per-household flag, so this never touches anyone else's default. Returns
 *  the caller's updated membership. */
export const setDefaultHousehold = (householdId: string) =>
  apiPost<ApiHouseholdMember>(`/households/${householdId}/set-default`);
