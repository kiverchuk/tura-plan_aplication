import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/features/localization/use-language';

const items = ['cycle', 'one', 'future', 'break', 'hours', 'restore', 'export', 'cancel', 'backup', 'delete'] as const;
const ink = '#17231F', muted = '#64736C', green = '#16664A', paper = '#F5F7F4', white = '#fff';

export default function HelpScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <Pressable onPress={() => router.back()}><Text style={s.back}>‹ {t('settings')}</Text></Pressable>
    <Text style={s.title}>{t('help_title')}</Text>
    {items.map(item => <Text key={item} style={s.card}><Text style={s.q}>{t(`faq_${item}_q`)}</Text>{'\n'}<Text style={s.a}>{t(`faq_${item}`)}</Text></Text>)}
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: paper }, page: { padding: 20, paddingBottom: 36 }, back: { color: green, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '800', color: ink, marginVertical: 12 }, card: { backgroundColor: white, borderRadius: 16, padding: 14, marginBottom: 10, lineHeight: 20 },
  q: { color: ink, fontWeight: '800', fontSize: 15 }, a: { color: muted, fontSize: 14 },
});
