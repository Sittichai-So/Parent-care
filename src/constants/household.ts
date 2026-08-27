import { HeartIcon, HouseIcon, HouseLineIcon, UsersThreeIcon, type Icon as PhosphorIcon } from 'phosphor-react-native';

import type { HouseholdKind } from '@/services/households-api';

export const HouseholdKindMeta: Record<HouseholdKind, { label: string; icon: PhosphorIcon }> = {
  parents: { label: 'บ้านพ่อแม่', icon: HouseLineIcon },
  partner: { label: 'บ้านแฟน', icon: HeartIcon },
  relatives: { label: 'บ้านญาติ', icon: UsersThreeIcon },
  other: { label: 'กลุ่มบ้าน', icon: HouseIcon },
};