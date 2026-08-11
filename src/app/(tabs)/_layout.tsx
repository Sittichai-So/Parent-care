import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors } from '@/constants/theme';
import { useFamilyContext } from '@/context/family-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { familyMembers } = useFamilyContext();

  /** Surfaced on the tab bar so attention items are visible from any screen. */
  const attentionCount = familyMembers.filter((member) => member.status !== 'normal').length;

  return (
    <NativeTabs
      backgroundColor={colors.backgroundElement}
      indicatorColor={colors.primarySoft}
      badgeBackgroundColor={colors.danger}
      labelStyle={{
        selected: { color: colors.primary, fontWeight: '800', fontSize: 13 },
        default: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
      }}>
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

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>ผู้สูงอายุ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
