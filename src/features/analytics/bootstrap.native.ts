import type { SQLiteDatabase } from 'expo-sqlite';
import { configureAnalyticsAdapter, hasAnalyticsConsent, setAnalyticsConsent, type AnalyticsEvent } from './analytics';

configureAnalyticsAdapter({
  setCollectionEnabled:async enabled=>{try{const {getAnalytics,setAnalyticsCollectionEnabled}=await import('@react-native-firebase/analytics');await setAnalyticsCollectionEnabled(getAnalytics(),enabled);}catch{/* Analytics remains unavailable until Firebase platform files are installed. */}},
  logEvent:async(name:AnalyticsEvent)=>{try{const {getAnalytics,logEvent}=await import('@react-native-firebase/analytics');await logEvent(getAnalytics(),name);}catch{/* Analytics must never interrupt calendar features. */}},
});

export async function initializeAnalytics(db:SQLiteDatabase){
  await setAnalyticsConsent(db,await hasAnalyticsConsent(db));
}
