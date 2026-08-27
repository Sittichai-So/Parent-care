import type { FamilyMember, Medication } from '@/context/family-context';
import { isToday, toDateKey, todayKey } from '@/utils/date';

export type MemberDisplayStatus = 'urgent' | 'monitor' | 'awaiting-checkin' | 'meds-pending' | 'ok';

export type MemberStatusBucket = 'attention' | 'pending' | 'good';

// These two are the ONLY sanctioned way to read a member's check-in state.
// `lastCheckInAt` on its own is just "the last time this member ever checked
// in" — the backend deliberately never resets it daily (see
// household-member.model.js). Comparing it to `todayKey()` here is what
// turns that raw timestamp into "did they check in *today*". Any screen that
// formats `member.lastCheckInAt` directly instead of calling these bypasses
// that gate and can show a stale (e.g. yesterday's) time as if it were
// today's, right next to an "awaiting check-in" badge that correctly says
// otherwise.
export const isCheckedInToday = (member: Pick<FamilyMember, 'lastCheckInAt'>) =>
  !!member.lastCheckInAt && toDateKey(new Date(member.lastCheckInAt)) === todayKey();

// Returns the display time only when the check-in was today; null otherwise
// — callers must treat null as "don't show a time", not "show nothing but
// still imply checked-in".
export const checkInTime = (member: Pick<FamilyMember, 'lastCheckInAt'>) =>
  isCheckedInToday(member) && member.lastCheckInAt
    ? new Date(member.lastCheckInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    : null;

export function memberDisplayStatus(member: FamilyMember, medications: Medication[]): MemberDisplayStatus {
  if (member.status === 'urgent') return 'urgent';
  if (member.status === 'monitor') return 'monitor';
  if (!isCheckedInToday(member)) return 'awaiting-checkin';

  const medsPending = medications.some(
    (med) =>
      med.memberId === member.id &&
      med.active &&
      !(med.lastTakenAt && isToday(med.lastTakenAt.slice(0, 10)))
  );
  return medsPending ? 'meds-pending' : 'ok';
}

export const statusBucket = (status: MemberDisplayStatus): MemberStatusBucket =>
  status === 'urgent' || status === 'monitor' ? 'attention' : status === 'ok' ? 'good' : 'pending';

export const isAttention = (member: FamilyMember, medications: Medication[]) =>
  statusBucket(memberDisplayStatus(member, medications)) === 'attention';
