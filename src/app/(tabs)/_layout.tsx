import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { familyMembers, currentRole } = useFamilyContext();

  /** Surfaced on the tab bar so attention items are visible from any screen. */
  const attentionCount = familyMembers.filter((member) => member.status !== 'normal').length;

  // Caregivers and elders each get one tailored home screen — showing both would
  // let an elder browse every family member's private status, and a caregiver
  // land on the elder's simplified self-care screen by mistake. Owner/viewer
  // oversee everything, so both stay visible. Role is per-household now (this
  // account's membership in the *current* household), not a global account flag.
  const showCaregiverTab = currentRole !== 'Elder';
  const showElderTab = currentRole !== 'Caregiver';

  return (
    <NativeTabs
      backgroundColor={colors.backgroundElement}
      indicatorColor={colors.primarySoft}
      badgeBackgroundColor={colors.danger}
      labelStyle={{
        selected: { color: colors.primary, fontWeight: '800', fontSize: 13 },
        default: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
      }}>
      {showCaregiverTab ? (
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>ผู้ดูแล</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require('@/assets/images/tabIcons/home.png')}
            renderingMode="template"
          />
          {attentionCount > 0 ? (
            <NativeTabs.Trigger.Badge>{String(attentionCount)}</NativeTabs.Trigger.Badge>
          ) : null}
        </NativeTabs.Trigger>
      ) : null}

      {showElderTab ? (
        <NativeTabs.Trigger name="explore">
          <NativeTabs.Trigger.Label>ผู้สูงอายุ</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require('@/assets/images/tabIcons/explore.png')}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
      ) : null}
    </NativeTabs>
  );
}
