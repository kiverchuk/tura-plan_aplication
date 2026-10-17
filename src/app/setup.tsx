import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/features/localization/use-language';
import { supportedLanguages, type Language } from '@/features/localization/translations';
import { nowIso } from '@/features/calendar/database';
import { useOnboarding } from '@/features/onboarding/context';

const languageNames: Record<Language, string> = { en: 'English', ro: 'Română', ru: 'Русский', uk: 'Українська', de: 'Deutsch', fr: 'Français', es: 'Español' };
const regions = ['RO', 'MD', 'OTHER', 'UNSET'] as const;
const ink = '#17231F', muted = '#64736C', green = '#16664A', pale = '#E7F2EC', paper = '#F5F7F4', white = '#fff';

export default function SetupScreen() {
  const db = useSQLiteContext();
  const { t, language, changeLanguage } = useLanguage();
  const { complete } = useOnboarding();
  const [step, setStep] = useState(0);
  const [region, setRegion] = useState('RO');
  const preview = new Date(2026, 9, 17, 14, 30);
  async function finish() {
    const now = nowIso();
    await db.runAsync('INSERT OR REPLACE INTO app_settings(key,value,updated_at) VALUES(?,?,?)', 'region', region, now);
    await db.runAsync('INSERT OR REPLACE INTO app_settings(key,value,updated_at) VALUES(?,?,?)', 'onboarding.done', '1', now);
    complete();
  }
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    {step === 0 ? <>
      <Text style={s.kicker}>TuraPlan</Text>
      <Text style={s.title}>{t('setup_title')}</Text>
      <Text style={s.body}>{t('setup_body')}</Text>
      <Text style={s.section}>{t('language')}</Text>
      <View style={s.wrap}>{supportedLanguages.map(code => <Pressable key={code} onPress={() => void changeLanguage(code)} style={[s.chip, language === code && s.chipOn]}><Text style={[s.chipText, language === code && s.chipTextOn]}>{languageNames[code]}</Text></Pressable>)}</View>
      <Text style={s.section}>{t('region')}</Text>
      <View style={s.wrap}>{regions.map(code => <Pressable key={code} onPress={() => setRegion(code)} style={[s.chip, region === code && s.chipOn]}><Text style={[s.chipText, region === code && s.chipTextOn]}>{t(code === 'RO' ? 'region_ro' : code === 'MD' ? 'region_md' : code === 'OTHER' ? 'region_other' : 'region_unset')}</Text></Pressable>)}</View>
      <Text style={s.previewLabel}>{t('date_preview')}</Text>
      <Text style={s.preview}>{preview.toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {preview.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}</Text>
      <Pressable style={s.primary} onPress={() => setStep(1)}><Text style={s.primaryText}>{t('setup_continue')}</Text></Pressable>
    </> : <>
      <Text style={s.step}>{step} / 3</Text>
      <Text style={s.title}>{t(step === 1 ? 'onboard_calendar_title' : step === 2 ? 'onboard_cycle_title' : 'onboard_pay_title')}</Text>
      <Text style={s.body}>{t(step === 1 ? 'onboard_calendar_body' : step === 2 ? 'onboard_cycle_body' : 'onboard_pay_body')}</Text>
      <Pressable style={s.primary} onPress={() => { if (step < 3) setStep(step + 1); else void finish(); }}><Text style={s.primaryText}>{step < 3 ? t('setup_continue') : t('setup_continue')}</Text></Pressable>
      <Pressable style={s.secondary} onPress={() => void finish()}><Text style={s.secondaryText}>{t('setup_skip')}</Text></Pressable>
    </>}
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: paper }, page: { padding: 22, paddingBottom: 40 }, kicker: { color: green, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: ink, fontSize: 28, fontWeight: '800', marginTop: 10 }, body: { color: muted, fontSize: 16, lineHeight: 23, marginTop: 12 },
  section: { color: ink, fontSize: 16, fontWeight: '800', marginTop: 22, marginBottom: 10 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: white, borderWidth: 1, borderColor: '#E1E8E3' },
  chipOn: { backgroundColor: pale, borderColor: green }, chipText: { color: muted, fontWeight: '700' }, chipTextOn: { color: green },
  previewLabel: { color: muted, marginTop: 22, fontSize: 12, fontWeight: '700' }, preview: { color: ink, fontSize: 16, fontWeight: '700', marginTop: 6 },
  primary: { height: 52, borderRadius: 16, backgroundColor: green, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  primaryText: { color: white, fontWeight: '800', fontSize: 16 }, secondary: { height: 48, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: green, fontWeight: '700' }, step: { color: muted, fontWeight: '700' },
});
