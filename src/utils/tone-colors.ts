import type { BadgeTone } from '@/components/ui/status-badge';
import type { useTheme } from '@/hooks/use-theme';

export function chipToneColors(theme: ReturnType<typeof useTheme>): Record<BadgeTone, { chipBg: string; ink: string }> {
  return {
    neutral: { chipBg: theme.surfaceSunken, ink: theme.textSecondary },
    primary: { chipBg: theme.primarySoft, ink: theme.primaryText },
    success: { chipBg: theme.successSoft, ink: theme.successText },
    warning: { chipBg: theme.warningSoft, ink: theme.warningText },
    danger: { chipBg: theme.dangerSoft, ink: theme.dangerText },
  };
}
