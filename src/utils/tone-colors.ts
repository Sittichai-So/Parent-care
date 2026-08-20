import type { BadgeTone } from '@/components/ui/status-badge';
import type { useTheme } from '@/hooks/use-theme';

/** Icon-chip background + icon color per `BadgeTone`, for screens that pair
 *  an icon chip with a same-toned label (audit-log.tsx, notices.tsx) — call
 *  with the current `useTheme()` result. Distinct from status-badge.tsx's
 *  own internal tone mapping (a different shape, for the badge pill itself)
 *  and from the flat single-color tone mappings in the chart components
 *  (bar-chart.tsx/donut-chart.tsx/member-adherence-row.tsx), which draw
 *  directly on the page background rather than a tinted chip and so need
 *  the stronger, non-"soft" theme tokens instead. */
export function chipToneColors(theme: ReturnType<typeof useTheme>): Record<BadgeTone, { chipBg: string; ink: string }> {
  return {
    neutral: { chipBg: theme.surfaceSunken, ink: theme.textSecondary },
    primary: { chipBg: theme.primarySoft, ink: theme.primaryText },
    success: { chipBg: theme.successSoft, ink: theme.successText },
    warning: { chipBg: theme.warningSoft, ink: theme.warningText },
    danger: { chipBg: theme.dangerSoft, ink: theme.dangerText },
  };
}
