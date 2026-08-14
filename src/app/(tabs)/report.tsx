import { ThemedText } from '@/components/themed-text';
import { CaregiverReport } from '@/components/reports/caregiver-report';
import { ElderReport } from '@/components/reports/elder-report';
import { OwnerReport } from '@/components/reports/owner-report';
import { ViewerReport } from '@/components/reports/viewer-report';
import { Screen } from '@/components/ui/screen';
import { useFamilyContext } from '@/context/family-context';

/** The "รายงาน" tab — a single route that renders a different report per
 *  the caller's role in the current household, since Owner, Caregiver,
 *  Elder and Viewer each need to see different things (see
 *  `components/reports/*-report.tsx`). All four are always reachable from
 *  this one tab, unlike `index`/`explore` which hide themselves per role. */
export default function ReportScreen() {
  const { currentRole, isLoadingHouseholds, isLoadingData } = useFamilyContext();

  if (isLoadingHouseholds || isLoadingData) {
    return (
      <Screen center>
        <ThemedText type="small" themeColor="textSecondary">
          กำลังโหลดรายงาน...
        </ThemedText>
      </Screen>
    );
  }

  switch (currentRole) {
    case 'Owner':
      return <OwnerReport />;
    case 'Caregiver':
      return <CaregiverReport />;
    case 'Elder':
      return <ElderReport />;
    case 'Viewer':
      return <ViewerReport />;
    default:
      return (
        <Screen center>
          <ThemedText type="small" themeColor="textSecondary">
            ยังไม่ได้เลือกกลุ่มครอบครัว
          </ThemedText>
        </Screen>
      );
  }
}
