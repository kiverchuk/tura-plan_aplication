export type Currency = 'RON' | 'MDL' | 'EUR' | 'USD' | 'GBP' | 'UAH' | 'BGN' | 'HUF' | 'PLN' | 'TRY';
export type Shift = { id: string; title: string; startsAt: string; endsAt: string; startsLocal?: string; endsLocal?: string; timezone: string; breakMinutes: number; hourlyRateMinor: number; currency: Currency; note?: string; employerId?: string; rotationId?: string; revision: number };
export type CalendarEvent = { id: string; title: string; startsAt: string; endsAt: string; allDay: boolean; note?: string; revision: number };

export function paidMinutes(shift: Pick<Shift, 'startsAt' | 'endsAt' | 'breakMinutes'>): number {
  const start = Date.parse(shift.startsAt), end = Date.parse(shift.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error('shift.end_after_start');
  if (!Number.isInteger(shift.breakMinutes) || shift.breakMinutes < 0) throw new Error('shift.invalid_break');
  const minutes = Math.floor((end - start) / 60_000) - shift.breakMinutes;
  if (minutes < 0 || minutes > 1_440) throw new Error('shift.invalid_duration');
  return minutes;
}

export function estimatedPayMinor(shift: Pick<Shift, 'startsAt' | 'endsAt' | 'breakMinutes' | 'hourlyRateMinor'>): number {
  if (!Number.isSafeInteger(shift.hourlyRateMinor) || shift.hourlyRateMinor < 0) throw new Error('pay.invalid_rate');
  const product = shift.hourlyRateMinor * paidMinutes(shift);
  if (!Number.isSafeInteger(product)) throw new Error('pay.out_of_range');
  return Math.floor(product / 60 + 0.5);
}

export function overlaps(a: Pick<Shift, 'startsAt' | 'endsAt'>, b: Pick<Shift, 'startsAt' | 'endsAt'>): boolean {
  return Date.parse(a.startsAt) < Date.parse(b.endsAt) && Date.parse(b.startsAt) < Date.parse(a.endsAt);
}

const zonedFormatterCache = new Map<string, Intl.DateTimeFormat>();
export function localDateTimeToInstant(date: string, time: string, timezone: string): { instant: Date; ambiguous: boolean } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('date.invalid_local_datetime');
  const [year, month, day] = date.split('-').map(Number), [hour, minute] = time.split(':').map(Number);
  if (hour > 23 || minute > 59) throw new Error('date.invalid_local_datetime');
  const target = Date.UTC(year, month - 1, day, hour, minute);
  if (new Date(target).toISOString().slice(0, 10) !== date) throw new Error('date.invalid_local_datetime');
  let formatter = zonedFormatterCache.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    zonedFormatterCache.set(timezone, formatter);
  }
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = target + hours * 3_600_000;
    const parts = Object.fromEntries(formatter.formatToParts(sample).map(part => [part.type, part.value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    offsets.add(represented - sample);
  }
  const matches = [...offsets].map(offset => target - offset).filter(candidate => {
    const parts = Object.fromEntries(formatter.formatToParts(candidate).map(part => [part.type, part.value]));
    return Number(parts.year) === year && Number(parts.month) === month && Number(parts.day) === day && Number(parts.hour) === hour && Number(parts.minute) === minute;
  }).sort((a, b) => a - b);
  if (!matches.length) throw new Error('date.nonexistent_local_time');
  return { instant: new Date(matches[0]), ambiguous: matches.length > 1 };
}

export type RotationDay = { kind: 'work' | 'off'; startLocal?: string; endLocal?: string; breakMinutes?: number; shiftTypeId?: string };
export function previewRotation(days: RotationDay[], anchorDate: string, fromDate: string, toDate: string) {
  if (!days.length || days.length > 366) throw new Error('rotation.invalid_length');
  const anchor = dayNumber(anchorDate), from = dayNumber(fromDate), to = dayNumber(toDate);
  if (to < from || to - from > 3_660) throw new Error('rotation.invalid_range');
  const proposed: Array<{ date: string; day: RotationDay }> = [];
  for (let n = from; n <= to; n++) {
    const offset = ((n - anchor) % days.length + days.length) % days.length;
    const day = days[offset];
    if (day.kind === 'work') proposed.push({ date: new Date(n * 86_400_000).toISOString().slice(0, 10), day });
  }
  return proposed;
}
function dayNumber(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('date.invalid');
  const result = Date.parse(`${value}T00:00:00Z`) / 86_400_000;
  if (new Date(result * 86_400_000).toISOString().slice(0, 10) !== value) throw new Error('date.invalid');
  return result;
}
