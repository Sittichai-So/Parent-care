/**
 * Local-calendar-day date helpers.
 *
 * Every date in this app is keyed as `YYYY-MM-DD` derived from the device's local
 * time, not `Date#toISOString()` (which is UTC and can roll over to the wrong day
 * near midnight in Thailand's UTC+7). Use `toDateKey`/`todayKey` everywhere a date
 * needs to be compared or stored as a key.
 */

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function isToday(dateKey: string): boolean {
  return dateKey === todayKey();
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** `dateKey` in `YYYY-MM-DD` → a Thai-locale display string, e.g. "12 สิงหาคม". */
export function formatDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;
  return new Date(year, month - 1, day).toLocaleDateString('th-TH', options);
}

/** Days between `dateKey` and today. Negative when `dateKey` is in the past. */
export function daysFromToday(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return 0;
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** "อีก 2 วัน" / "วันนี้" / "ผ่านมาแล้ว 3 วัน" — used on appointment cards. */
export function relativeDayLabel(dateKey: string): string {
  const diff = daysFromToday(dateKey);
  if (diff === 0) return 'วันนี้';
  if (diff === 1) return 'พรุ่งนี้';
  if (diff > 1) return `อีก ${diff} วัน`;
  return `ผ่านมาแล้ว ${Math.abs(diff)} วัน`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}
