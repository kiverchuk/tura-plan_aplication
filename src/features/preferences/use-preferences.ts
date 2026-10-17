import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { nowIso } from '@/features/calendar/database';

export type TimeFormat = '12' | '24';
export type WeekStart = 0 | 1;

export function usePreferences() {
  const db = useSQLiteContext();
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24');
  const [weekStart, setWeekStart] = useState<WeekStart>(1);
  const [reminderMinutes, setReminderMinutes] = useState(0);
  const reload = useCallback(async () => {
    const rows = await db.getAllAsync<{ key: string; value: string }>("SELECT key, value FROM app_settings WHERE key IN ('time.format','week.start','reminder.minutes')");
    const map = Object.fromEntries(rows.map(row => [row.key, row.value]));
    if (map['time.format'] === '12' || map['time.format'] === '24') setTimeFormat(map['time.format']);
    if (map['week.start'] === '0' || map['week.start'] === '1') setWeekStart(Number(map['week.start']) as WeekStart);
    if (map['reminder.minutes'] === '0' || map['reminder.minutes'] === '30' || map['reminder.minutes'] === '60') setReminderMinutes(Number(map['reminder.minutes']));
  }, [db]);
  useEffect(() => { void reload(); }, [reload]);
  async function save(key: string, value: string) {
    await db.runAsync('INSERT OR REPLACE INTO app_settings(key,value,updated_at) VALUES(?,?,?)', key, value, nowIso());
    await reload();
  }
  return { timeFormat, weekStart, reminderMinutes, save };
}

export function formatClock(local: string | undefined, utc: string, language: string, timeFormat: TimeFormat) {
  const value = local?.slice(11, 16);
  const [hours, minutes] = (value ?? new Date(utc).toISOString().slice(11, 16)).split(':').map(Number);
  return new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit', hourCycle: timeFormat === '24' ? 'h23' : 'h12', timeZone: 'UTC' }).format(new Date(Date.UTC(2020, 0, 1, hours, minutes)));
}
