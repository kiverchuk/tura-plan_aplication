import { NativeTabs } from 'expo-router/native-tabs';
import { useLanguage } from '@/features/localization/use-language';

export default function AppTabs() {
  const { t } = useLanguage();
  return <NativeTabs>
    <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Label>{t('today')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="sun.max" /></NativeTabs.Trigger>
    <NativeTabs.Trigger name="calendar"><NativeTabs.Trigger.Label>{t('calendar')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="calendar" /></NativeTabs.Trigger>
    <NativeTabs.Trigger name="analytics"><NativeTabs.Trigger.Label>{t('analytics')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="chart.bar" /></NativeTabs.Trigger>
    <NativeTabs.Trigger name="library"><NativeTabs.Trigger.Label>{t('library')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="books.vertical" /></NativeTabs.Trigger>
  </NativeTabs>;
}
