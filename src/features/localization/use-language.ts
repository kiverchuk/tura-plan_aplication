import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getLocales } from 'expo-localization';
import { messages, supportedLanguages, type Language } from './translations';

export function useLanguage() {
  const db = useSQLiteContext();
  const device = (getLocales()[0]?.languageCode ?? 'en').toLowerCase().split('-')[0] as Language;
  const [language, setLanguage] = useState<Language>(supportedLanguages.includes(device) ? device : 'en');
  useEffect(() => { void db.getFirstAsync<{value:string}>("SELECT value FROM app_settings WHERE key='language'").then(v => { if(v && supportedLanguages.includes(v.value as Language)) setLanguage(v.value as Language); }); }, [db]);
  async function changeLanguage(value: Language) { setLanguage(value); await db.runAsync('INSERT OR REPLACE INTO app_settings(key,value,updated_at) VALUES(?,?,?)', 'language', value, new Date().toISOString()); }
  return { language, t: (key: string) => messages[language][key] ?? messages.en[key] ?? key, changeLanguage };
}
