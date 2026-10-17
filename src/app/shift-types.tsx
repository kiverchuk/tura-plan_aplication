import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/features/localization/use-language';
import { newId, nowIso } from '@/features/calendar/database';
import { shiftTypeColors } from '@/features/calendar/planning';

type ShiftType = { id: string; name: string; color: string; default_start: string | null; default_end: string | null };
const ink = '#17231F', muted = '#64736C', green = '#16664A', paper = '#F5F7F4', white = '#fff';
const starters = [
  ['type_day', shiftTypeColors.day, '08:00', '16:00'],
  ['type_evening', shiftTypeColors.evening, '16:00', '00:00'],
  ['type_night', shiftTypeColors.night, '22:00', '06:00'],
  ['type_vacation', shiftTypeColors.vacation, '00:00', '23:59'],
  ['type_sick', shiftTypeColors.sick, '00:00', '23:59'],
  ['type_training', shiftTypeColors.training, '09:00', '17:00'],
] as const;

export default function ShiftTypesScreen() {
  const db = useSQLiteContext();
  const { t } = useLanguage();
  const router = useRouter();
  const [rows, setRows] = useState<ShiftType[]>([]);
  const [name, setName] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [color, setColor] = useState<string>(shiftTypeColors.day);
  const load = useCallback(async () => setRows(await db.getAllAsync<ShiftType>('SELECT id,name,color,default_start,default_end FROM shift_types WHERE deleted_at IS NULL AND archived=0 ORDER BY name')), [db]);
  useEffect(() => { void load(); }, [load]);
  async function add(nextName: string, nextColor: string, nextStart: string, nextEnd: string) {
    if (!nextName.trim() || !/^\d{2}:\d{2}$/.test(nextStart) || !/^\d{2}:\d{2}$/.test(nextEnd)) return;
    const id = newId();
    const now = nowIso();
    await db.runAsync('INSERT INTO shift_types(id,name,color,default_start,default_end,updated_at) VALUES(?,?,?,?,?,?)', id, nextName.trim(), nextColor, nextStart, nextEnd, now);
    await db.runAsync('INSERT INTO mutation_outbox(id,entity_type,entity_id,operation,payload,created_at) VALUES(?,?,?,?,?,?)', newId(), 'shift-type', id, 'upsert', JSON.stringify({ id, name: nextName.trim(), color: nextColor, defaultStart: nextStart, defaultEnd: nextEnd }), now);
    setName('');
    await load();
  }
  async function archive(row: ShiftType) {
    const now = nowIso();
    await db.runAsync('UPDATE shift_types SET archived=1,revision=revision+1,updated_at=? WHERE id=?', now, row.id);
    await db.runAsync('INSERT INTO mutation_outbox(id,entity_type,entity_id,operation,payload,created_at) VALUES(?,?,?,?,?,?)', newId(), 'shift-type', row.id, 'upsert', JSON.stringify({ id: row.id, archived: true }), now);
    await load();
  }
  async function removeFuture(row: ShiftType) {
    const now = new Date().toISOString();
    const matches = await db.getAllAsync<{ id: string; revision: number }>('SELECT id,revision FROM shifts WHERE shift_type_id=? AND deleted_at IS NULL AND starts_at>?', row.id, now);
    Alert.alert(row.name, `${t('future_delete_count')}: ${matches.length}. ${t('confirm_future_delete')}`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('future_delete'), style: 'destructive', onPress: () => void (async () => {
        const stamp = nowIso();
        await db.withTransactionAsync(async () => {
          for (const shift of matches) {
            await db.runAsync('UPDATE shifts SET deleted_at=?,revision=revision+1,updated_at=? WHERE id=?', stamp, stamp, shift.id);
            await db.runAsync('INSERT OR REPLACE INTO sync_tombstones(entity_type,entity_id,deleted_at,revision) VALUES(?,?,?,?)', 'shift', shift.id, stamp, shift.revision + 1);
            await db.runAsync('INSERT INTO mutation_outbox(id,entity_type,entity_id,operation,payload,created_at) VALUES(?,?,?,?,?,?)', newId(), 'shift', shift.id, 'delete', JSON.stringify({ id: shift.id, deletedAt: stamp }), stamp);
          }
        });
        Alert.alert('TuraPlan', `${t('removed_shifts')}: ${matches.length}`);
      })() },
    ]);
  }
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <Pressable onPress={() => router.back()}><Text style={s.back}>‹ {t('library')}</Text></Pressable>
    <Text style={s.title}>{t('shift_types')}</Text>
    <TextInput value={name} onChangeText={setName} placeholder={t('shift_type_name')} style={s.input} />
    <View style={s.row}><TextInput value={start} onChangeText={setStart} style={[s.input, s.half]} /><TextInput value={end} onChangeText={setEnd} style={[s.input, s.half]} /></View>
    <View style={s.colors}>{Object.values(shiftTypeColors).map(item => <Pressable key={item} onPress={() => setColor(item)} style={[s.swatch, { backgroundColor: item }, color === item && s.swatchOn]} />)}</View>
    <Pressable style={s.primary} onPress={() => void add(name, color, start, end)}><Text style={s.primaryText}>{t('save')}</Text></Pressable>
    <Text style={s.section}>{t('starter_patterns')}</Text>
    <View style={s.wrap}>{starters.map(([key, itemColor, itemStart, itemEnd]) => <Pressable key={key} onPress={() => void add(t(key), itemColor, itemStart, itemEnd)} style={s.chip}><Text style={s.chipText}>{t(key)}</Text></Pressable>)}</View>
    {rows.map(row => <View key={row.id} style={s.card}><View style={[s.dot, { backgroundColor: row.color }]} /><View style={s.main}><Text style={s.name}>{row.name}</Text><Text style={s.meta}>{row.default_start}–{row.default_end}</Text></View><Pressable onPress={() => void removeFuture(row)}><Text style={s.action}>{t('future_delete')}</Text></Pressable><Pressable onPress={() => void archive(row)}><Text style={s.action}>{t('archive_type')}</Text></Pressable></View>)}
    {!rows.length && <Text style={s.meta}>{t('no_shift_types')}</Text>}
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: paper }, page: { padding: 20, paddingBottom: 40 }, back: { color: green, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '800', color: ink, marginVertical: 10 }, input: { height: 48, borderRadius: 12, backgroundColor: white, borderWidth: 1, borderColor: '#E1E8E3', paddingHorizontal: 12, color: ink, marginTop: 8 },
  row: { flexDirection: 'row', gap: 8 }, half: { flex: 1 }, colors: { flexDirection: 'row', gap: 8, marginTop: 12 }, swatch: { width: 28, height: 28, borderRadius: 14 }, swatchOn: { borderWidth: 2, borderColor: ink },
  primary: { height: 48, borderRadius: 14, backgroundColor: green, alignItems: 'center', justifyContent: 'center', marginTop: 14 }, primaryText: { color: white, fontWeight: '800' },
  section: { fontWeight: '800', color: ink, marginTop: 22, marginBottom: 8 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { backgroundColor: white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }, chipText: { color: ink, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: white, borderRadius: 14, padding: 12, marginTop: 8 }, dot: { width: 12, height: 12, borderRadius: 6 }, main: { flex: 1 }, name: { color: ink, fontWeight: '800' }, meta: { color: muted, fontSize: 12 }, action: { color: green, fontSize: 11, fontWeight: '700', maxWidth: 90 },
});
