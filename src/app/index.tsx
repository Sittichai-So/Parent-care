/**
 * Legacy alias for the caregiver dashboard.
 *
 * `app/index.tsx` and `app/(tabs)/index.tsx` both resolve to `/`, so Expo Router
 * reports a duplicate route and picks one non-deterministically. Re-exporting the
 * tab screen keeps whichever one wins visually identical instead of rendering a
 * stale, hardcoded copy of the dashboard.
 *
 * Delete this file once you're sure nothing links to the non-tab `/` route.
 */
export { default } from './(tabs)';
