import type { BadgeTone } from '@/components/ui/status-badge';
import type { FamilyEvent, FamilyMember, FamilyTask, Medication, VitalLog } from '@/context/family-context';
import { addDays, isToday, toDateKey } from '@/utils/date';

export type DayBucket = { dateKey: string; label: string; count: number };

export function bucketEventsByDay(events: FamilyEvent[], days: number): DayBucket[] {
  const today = new Date();
  const buckets: DayBucket[] = Array.from({ length: days }, (_, i) => {
    const date = addDays(today, -(days - 1 - i));
    return {
      dateKey: toDateKey(date),
      label: date.toLocaleDateString('th-TH', { weekday: 'short' }),
      count: 0,
    };
  });
  const byKey = new Map(buckets.map((bucket) => [bucket.dateKey, bucket]));
  events.forEach((event) => {
    const bucket = byKey.get(toDateKey(new Date(event.occurredAt)));
    if (bucket) bucket.count += 1;
  });
  return buckets;
}

export type AdherenceStat = { due: number; taken: number; pct: number };

export function medicationAdherence(meds: Medication[]): AdherenceStat {
  const active = meds.filter((med) => med.active);
  const taken = active.filter((med) => med.lastTakenAt && isToday(med.lastTakenAt.slice(0, 10))).length;
  return { due: active.length, taken, pct: active.length === 0 ? 100 : Math.round((taken / active.length) * 100) };
}

export type MemberAdherence = { memberId: string; name: string } & AdherenceStat;

export function perMemberAdherence(meds: Medication[], members: FamilyMember[]): MemberAdherence[] {
  return members
    .map((member) => ({ memberId: member.id, name: member.name, ...medicationAdherence(meds.filter((med) => med.memberId === member.id)) }))
    .filter((entry) => entry.due > 0)
    .sort((a, b) => a.pct - b.pct);
}

export function adherenceTone(pct: number): BadgeTone {
  if (pct >= 80) return 'success';
  if (pct >= 50) return 'warning';
  return 'danger';
}

export type MemberAdherenceDetail = MemberAdherence & { note: string };

export function memberAdherenceDetail(meds: Medication[], members: FamilyMember[]): MemberAdherenceDetail[] {
  return perMemberAdherence(meds, members).map((entry) => {
    const med = meds.find((item) => item.memberId === entry.memberId && item.active);
    const note = !med
      ? 'ไม่มีรายการยาที่ใช้งานอยู่'
      : entry.pct >= 100
        ? `ยืนยันครบวันนี้ · ${med.name}`
        : `รอยืนยัน ${med.schedule[0] ?? ''} · ${med.name}`;
    return { ...entry, note };
  });
}

export function statusBreakdown(members: FamilyMember[]) {
  return {
    normal: members.filter((member) => member.status === 'normal').length,
    monitor: members.filter((member) => member.status === 'monitor').length,
    urgent: members.filter((member) => member.status === 'urgent').length,
  };
}

export function taskBreakdown(tasks: FamilyTask[]) {
  return {
    done: tasks.filter((task) => task.status === 'done').length,
    inProgress: tasks.filter((task) => task.status === 'in-progress').length,
    pending: tasks.filter((task) => task.status === 'pending').length,
  };
}

export type ChartPoint = { x: string; y: number };

const dayMonthLabel = (log: VitalLog) => new Date(log.recordedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

export function vitalSeries(logs: VitalLog[], field: 'sugar' | 'weight', limit = 8): ChartPoint[] {
  return logs
    .filter((log) => typeof log[field] === 'number')
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .slice(-limit)
    .map((log) => ({ x: dayMonthLabel(log), y: log[field] as number }));
}

export function bloodPressureSeries(logs: VitalLog[], limit = 8): { systolic: ChartPoint[]; diastolic: ChartPoint[] } {
  const withBoth = logs
    .filter((log) => typeof log.systolic === 'number' && typeof log.diastolic === 'number')
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .slice(-limit);
  return {
    systolic: withBoth.map((log) => ({ x: dayMonthLabel(log), y: log.systolic as number })),
    diastolic: withBoth.map((log) => ({ x: dayMonthLabel(log), y: log.diastolic as number })),
  };
}
