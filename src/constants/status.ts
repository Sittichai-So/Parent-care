import type { BadgeTone } from '@/components/ui/status-badge';
import type { FamilyTask, MemberStatus } from '@/context/family-context';

/** Single source of truth for how a member's status is worded and coloured. */
export const MemberStatusMeta: Record<MemberStatus, { label: string; tone: BadgeTone; short: string }> = {
  normal: { label: 'ปกติดี', tone: 'success', short: 'ปกติ' },
  monitor: { label: 'ต้องติดตาม', tone: 'warning', short: 'ติดตาม' },
  urgent: { label: 'ต้องช่วยเหลือ', tone: 'danger', short: 'ด่วน' },
};

export const TaskStatusMeta: Record<FamilyTask['status'], { label: string; tone: BadgeTone }> = {
  done: { label: 'เสร็จแล้ว', tone: 'success' },
  'in-progress': { label: 'กำลังดำเนินการ', tone: 'primary' },
  pending: { label: 'รอดำเนินการ', tone: 'warning' },
};

/** Members needing attention sort to the top of the dashboard. */
export const StatusPriority: Record<MemberStatus, number> = {
  urgent: 0,
  monitor: 1,
  normal: 2,
};
