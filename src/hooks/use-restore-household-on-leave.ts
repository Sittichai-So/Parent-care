import { useEffect } from 'react';

import { useFamilyContext } from '@/context/family-context';

/**
 * Restores `restoreHouseholdId` as the active household once this screen is
 * left — used by every screen reachable from an account-wide notification
 * (medicine/appointment reminders, chat, emergency) whose target household
 * may not be the one the caller had selected. notices.tsx switches the
 * active household *before* navigating here (so this screen's own data
 * lookup finds the record right away) and passes the household that was
 * active before that switch as a route param; this hook is what undoes it.
 *
 * Without this, tapping such a notification would leave the household
 * switcher — and every other screen's data — silently pointed at whichever
 * household the notification happened to belong to, even after the caller
 * backs out without touching anything. Fires on *any* exit path (the
 * "ยกเลิก"/back button, a hardware/gesture back, or navigating on to
 * somewhere else from here), since opening a notification is meant to be a
 * momentary peek into another household, never a lasting switch.
 *
 * No-op when `restoreHouseholdId` is absent — i.e. every normal navigation
 * that didn't come from a cross-household notification in the first place.
 */
export function useRestoreHouseholdOnLeave(restoreHouseholdId?: string | null) {
  const { setCurrentHouseholdId } = useFamilyContext();

  useEffect(() => {
    if (!restoreHouseholdId) return undefined;
    return () => setCurrentHouseholdId(restoreHouseholdId);
    // Deliberately keyed only on the id itself, not `setCurrentHouseholdId`
    // (a stable setter) — including it would change nothing since it never
    // itself changes across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreHouseholdId]);
}
