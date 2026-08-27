import { ThemedText } from '@/components/themed-text';
import { CaregiverReport } from '@/components/reports/caregiver-report';
import { ElderReport } from '@/components/reports/elder-report';
import { OwnerReport } from '@/components/reports/owner-report';
import { ViewerReport } from '@/components/reports/viewer-report';
import { Screen } from '@/components/ui/screen';
import { useFamilyContext } from '@/context/family-context';

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
