import { HeartIcon, HouseIcon, HouseLineIcon, UsersThreeIcon, type Icon as PhosphorIcon } from 'phosphor-react-native';

import type { HouseholdKind } from '@/services/households-api';

/** Single source of truth for how a household's `kind` is worded and iconed
 *  in the group switcher — mirrors `MemberStatusMeta` in `constants/status.ts`.
 *  `label` is the generic per-kind meta line (e.g. "บ้านพ่อแม่ · 4 คน"), not
 *  the household's own custom `name`, per the reference design's switcher sheet. */
export const HouseholdKindMeta: Record<HouseholdKind, { label: string; icon: PhosphorIcon }> = {
  parents: { label: 'บ้านพ่อแม่', icon: HouseLineIcon },
  partner: { label: 'บ้านแฟน', icon: HeartIcon },
  relatives: { label: 'บ้านญาติ', icon: UsersThreeIcon },
  other: { label: 'กลุ่มบ้าน', icon: HouseIcon },
};