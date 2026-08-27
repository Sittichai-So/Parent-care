import {
  CheckCircleIcon,
  ClockCountdownIcon,
  ClockIcon,
  PillIcon,
  WarningCircleIcon,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';

import type { BadgeTone } from '@/components/ui/status-badge';
import type { FamilyTask, MemberStatus } from '@/context/family-context';
import type { MemberDisplayStatus } from '@/utils/member-status';

export const MemberStatusMeta: Record<MemberStatus, { label: string; tone: BadgeTone; short: string; icon: PhosphorIcon }> = {
  normal: { label: 'ปกติดี', tone: 'success', short: 'ปกติ', icon: CheckCircleIcon },
  monitor: { label: 'ต้องติดตาม', tone: 'warning', short: 'ติดตาม', icon: ClockCountdownIcon },
  urgent: { label: 'ต้องช่วยเหลือ', tone: 'danger', short: 'ด่วน', icon: WarningCircleIcon },
};

export const MemberDisplayStatusMeta: Record<
  MemberDisplayStatus,
  { label: string; tone: BadgeTone; short: string; icon: PhosphorIcon }
> = {
  urgent: { label: 'ต้องช่วยเหลือ', tone: 'danger', short: 'ด่วน', icon: WarningCircleIcon },
  monitor: { label: 'ต้องติดตาม', tone: 'warning', short: 'ติดตาม', icon: ClockCountdownIcon },
  'awaiting-checkin': { label: 'รอเช็กอิน', tone: 'neutral', short: 'รอ', icon: ClockIcon },
  'meds-pending': { label: 'สบายดี · ยังไม่ทานยา', tone: 'warning', short: 'ค้างยา', icon: PillIcon },
  ok: { label: 'ปกติดี', tone: 'success', short: 'ปกติ', icon: CheckCircleIcon },
};

export const TaskStatusMeta: Record<FamilyTask['status'], { label: string; tone: BadgeTone }> = {
  done: { label: 'เสร็จแล้ว', tone: 'success' },
  'in-progress': { label: 'กำลังดำเนินการ', tone: 'primary' },
  pending: { label: 'รอดำเนินการ', tone: 'warning' },
};

export const DisplayStatusPriority: Record<MemberDisplayStatus, number> = {
  urgent: 0,
  monitor: 1,
  'meds-pending': 2,
  'awaiting-checkin': 3,
  ok: 4,
};
