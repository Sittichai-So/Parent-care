/**
 * Pure data-shaping helpers for the per-role report tab (`(tabs)/report.tsx`
 * and `components/reports/*`). Kept separate from the screens so the
 * aggregation logic (adherence math, day-bucketing, chart series) can be
 * reasoned about — and eventually tested — without React involved.
 */

import type { BadgeTone } from '@/components/ui/status-badge';
import type { FamilyEvent, FamilyMember, FamilyTask, Medication, VitalLog } from '@/context/family-context';
import { addDays, isToday, toDateKey } from '@/utils/date';

export type DayBucket = { dateKey: string; label: string; count: number };

/** Builds `days` consecutive calendar-day buckets ending today (oldest
 *  first), each labelled with a short Thai weekday, and tallies how many
 *  `events` land on each day — the "activity over the last N days" chart. */
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

/** Whole-day medication adherence: "due" counts each *active* medication
 *  once — matching what `lastTakenAt` actually tracks, a single daily
 *  confirmation rather than one per scheduled time — and "taken" counts
 *  those confirmed today. */
export function medicationAdherence(meds: Medication[]): AdherenceStat {
  const active = meds.filter((med) => med.active);
  const taken = active.filter((med) => med.lastTakenAt && isToday(med.lastTakenAt.slice(0, 10))).length;
  return { due: active.length, taken, pct: active.length === 0 ? 100 : Math.round((taken / active.length) * 100) };
}

export type MemberAdherence = { memberId: string; name: string } & AdherenceStat;

/** Per-member breakdown of `medicationAdherence`, limited to members who
 *  actually have an active medication — sorted worst-first so the report
 *  reader's eye lands on whoever needs attention. */
export function perMemberAdherence(meds: Medication[], members: FamilyMember[]): MemberAdherence[] {
  return members
    .map((member) => ({ memberId: member.id, name: member.name, ...medicationAdherence(meds.filter((med) => med.memberId === member.id)) }))
    .filter((entry) => entry.due > 0)
    .sort((a, b) => a.pct - b.pct);
}

/** Colour a percentage the same way the rest of the app colours status —
 *  brought here rather than duplicated in every chart-consuming report. */
export function adherenceTone(pct: number): BadgeTone {
  if (pct >= 80) return 'success';
  if (pct >= 50) return 'warning';
  return 'danger';
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

/** Chronological (oldest→newest) reading points for one vital field, capped
 *  to the most recent `limit` so a small report chart doesn't get crowded. */
export function vitalSeries(logs: VitalLog[], field: 'sugar' | 'weight', limit = 8): ChartPoint[] {
  return logs
    .filter((log) => typeof log[field] === 'number')
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .slice(-limit)
    .map((log) => ({ x: dayMonthLabel(log), y: log[field] as number }));
}

/** Paired systolic/diastolic points, from logs that have *both* values —
 *  filtering each field independently (like `vitalSeries`) could pair a
 *  systolic reading from one day with a diastolic reading from another. */
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
