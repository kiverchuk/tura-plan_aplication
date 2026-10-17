import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Redirect, Stack, usePathname } from 'expo-router';
import { initializeDatabase } from '@/features/calendar/database';
import { initializeAnalytics } from '@/features/analytics/bootstrap';
import { OnboardingContext } from '@/features/onboarding/context';

export default function RootLayout() {
  return <SQLiteProvider databaseName="turaplan.db" onInit={initializeDatabase}><AppNavigation/></SQLiteProvider>;
}
function AppNavigation(){
  const db=useSQLiteContext();
  const pathname=usePathname();
  const [ready,setReady]=useState<'loading'|'setup'|'app'>('loading');
  useEffect(()=>{void initializeAnalytics(db);},[db]);
  useEffect(()=>{void db.getFirstAsync<{value:string}>("SELECT value FROM app_settings WHERE key='onboarding.done'").then(row=>setReady(row?.value==='1'?'app':'setup'));},[db]);
  if(ready==='loading')return null;
  const needsSetup=ready==='setup'&&pathname!=='/setup';
  const finishedSetup=ready==='app'&&pathname==='/setup';
  return <OnboardingContext.Provider value={{complete:()=>setReady('app')}}>
    {needsSetup?<Redirect href="/setup"/>:null}
    {finishedSetup?<Redirect href="/" />:null}
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
      <Stack.Screen name="shift-types" />
      <Stack.Screen name="events" />
      <Stack.Screen name="rotations" />
      <Stack.Screen name="edit-shift" />
    </Stack>
  </OnboardingContext.Provider>;
}
