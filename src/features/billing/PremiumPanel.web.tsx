import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/features/localization/use-language';

export default function PremiumPanel() {
  const { t } = useLanguage();
  return <View style={styles.box}><Text style={styles.muted}>{t('billing_notice')}</Text><Text style={styles.muted}>{t('billing_web_unavailable')}</Text></View>;
}

const styles = StyleSheet.create({ box: { backgroundColor: '#fff', borderRadius: 16, padding: 15, gap: 10 }, muted: { fontSize: 12, lineHeight: 18, color: '#64736C' } });
