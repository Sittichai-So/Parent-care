/**
 * Legacy alias for the elder home screen.
 *
 * Duplicates `app/(tabs)/explore.tsx` at the `/explore` path. See `app/index.tsx`
 * for the same situation — re-export rather than keep a diverging stale copy, and
 * delete this file once nothing links to the non-tab `/explore` route.
 */
export { default } from './(tabs)/explore';
