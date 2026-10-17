import type { RotationDay } from './domain.ts';

export type RotationPreset = { id: '5-2' | '2-2' | '3-3' | '4-4' | '2-2-3' | 'day-night-off'; labelKey: string };

export const rotationPresets: RotationPreset[] = [
  { id: '5-2', labelKey: 'preset_5_2' },
  { id: '2-2', labelKey: 'preset_2_2' },
  { id: '3-3', labelKey: 'preset_3_3' },
  { id: '4-4', labelKey: 'preset_4_4' },
  { id: '2-2-3', labelKey: 'preset_2_2_3' },
  { id: 'day-night-off', labelKey: 'preset_day_night' },
];

export function presetPattern(id: RotationPreset['id']): Array<'work' | 'off' | 'night'> {
  if (id === '5-2') return ['work', 'work', 'work', 'work', 'work', 'off', 'off'];
  if (id === '2-2') return ['work', 'work', 'off', 'off'];
  if (id === '3-3') return ['work', 'work', 'work', 'off', 'off', 'off'];
  if (id === '4-4') return ['work', 'work', 'work', 'work', 'off', 'off', 'off', 'off'];
  if (id === '2-2-3') return ['work', 'work', 'off', 'off', 'work', 'work', 'work', 'off', 'off'];
  return ['work', 'night', 'off', 'off'];
}

export function presetDays(id: RotationPreset['id'], dayStart: string, dayEnd: string, nightStart = '22:00', nightEnd = '06:00'): RotationDay[] {
  return presetPattern(id).map(kind => {
    if (kind === 'off') return { kind: 'off' };
    if (kind === 'night') return { kind: 'work', startLocal: nightStart, endLocal: nightEnd, breakMinutes: 30 };
    return { kind: 'work', startLocal: dayStart, endLocal: dayEnd, breakMinutes: 30 };
  });
}

export function overtimeMinutes(paidMinutes: number, dailyThresholdMinutes: number): number {
  if (!Number.isInteger(paidMinutes) || paidMinutes < 0) throw new Error('shift.invalid_duration');
  if (!Number.isInteger(dailyThresholdMinutes) || dailyThresholdMinutes < 0) throw new Error('pay.invalid_threshold');
  return Math.max(0, paidMinutes - dailyThresholdMinutes);
}

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function weekRange(anchor: Date, weekStartsOn: 0 | 1): { from: string; to: string } {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const delta = weekStartsOn === 1 ? (start.getDay() + 6) % 7 : start.getDay();
  start.setDate(start.getDate() - delta);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return { from: localDateKey(start), to: localDateKey(end) };
}

export function monthRange(anchor: Date): { from: string; to: string } {
  const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  return { from: localDateKey(from), to: localDateKey(to) };
}

export function yearRange(anchor: Date): { from: string; to: string } {
  return { from: `${anchor.getFullYear()}-01-01`, to: `${anchor.getFullYear() + 1}-01-01` };
}

export const shiftTypeColors = {
  day: '#2F7D72',
  evening: '#B56A21',
  night: '#6357B5',
  off: '#6D7A78',
  vacation: '#2E78B7',
  sick: '#B04D65',
  training: '#8B6A36',
} as const;
