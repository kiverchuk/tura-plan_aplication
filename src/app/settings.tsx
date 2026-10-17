import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/features/localization/use-language';
import { supportedLanguages, type Language } from '@/features/localization/translations';
import { usePreferences, type TimeFormat, type WeekStart } from '@/features/preferences/use-preferences';

const names: Record<Language, string> = { en: 'English', ro: 'Română', ru: 'Русский', uk: 'Українська', de: 'Deutsch', fr: 'Français', es: 'Español' };
const ink = '#17231F', muted = '#64736C', green = '#16664A', pale = '#E7F2EC', paper = '#F5F7F4', white = '#fff';

export default function SettingsScreen() {
  const { t, language, changeLanguage } = useLanguage();
  const { timeFormat, weekStart, reminderMinutes, save } = usePreferences();
  const router = useRouter();
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <Pressable onPress={() => router.back()}><Text style={s.back}>‹ {t('library')}</Text></Pressable>
    <Text style={s.title}>{t('settings')}</Text>
    <Text style={s.section}>{t('language')}</Text>
    <View style={s.wrap}>{supportedLanguages.map(code => <Pressable key={code} onPress={() => void changeLanguage(code)} style={[s.chip, language === code && s.on]}><Text style={[s.chipText, language === code && s.onText]}>{names[code]}</Text></Pressable>)}</View>
    <Choice label={t('time_format')} value={timeFormat} options={[['24', t('time_24')], ['12', t('time_12')]]} onChange={value => void save('time.format', value)} />
    <Choice label={t('week_start')} value={String(weekStart)} options={[['1', t('week_monday')], ['0', t('week_sunday')]]} onChange={value => void save('week.start', value)} />
    <Choice label={t('reminder_lead')} value={String(reminderMinutes)} options={[['0', t('reminder_off')], ['30', t('reminder_30m')], ['60', t('reminder_60m')]]} onChange={value => void save('reminder.minutes', value)} />
    <Text style={s.section}>{t('privacy')}</Text>
    <Text style={s.body}>{t('analytics_notice')}</Text>
    <Pressable style={s.link} onPress={() => router.push('/help')}><Text style={s.linkText}>{t('open_help')}</Text></Pressable>
    <Text style={s.foot}>TuraPlan 1.0.0</Text>
  </ScrollView></SafeAreaView>;
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: TimeFormat | `${WeekStart}` | string) => void }) {
  return <View><Text style={s.section}>{label}</Text><View style={s.wrap}>{options.map(([id, text]) => <Pressable key={id} onPress={() => onChange(id)} style={[s.chip, value === id && s.on]}><Text style={[s.chipText, value === id && s.onText]}>{text}</Text></Pressable>)}</View></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: paper }, page: { padding: 20, paddingBottom: 36 }, back: { color: green, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: ink }, section: { fontSize: 16, fontWeight: '800', color: ink, marginTop: 22, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: white, borderWidth: 1, borderColor: '#E1E8E3' },
  on: { backgroundColor: pale, borderColor: green }, chipText: { color: muted, fontWeight: '700' }, onText: { color: green },
  body: { color: muted, lineHeight: 20 }, link: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: pale }, linkText: { color: green, fontWeight: '800' },
  foot: { textAlign: 'center', color: muted, marginTop: 28, fontSize: 12 },
});
