import type { SQLiteDatabase } from 'expo-sqlite';

export const analyticsEvents = ['app_opened','shift_created','event_created','export_created','sync_completed','purchase_verified'] as const;
export type AnalyticsEvent = typeof analyticsEvents[number];
export type AnalyticsAdapter = { setCollectionEnabled(enabled:boolean):Promise<void>; logEvent(name:AnalyticsEvent):Promise<void> };
let adapter:AnalyticsAdapter|null=null;
export function configureAnalyticsAdapter(value:AnalyticsAdapter|null){adapter=value;}
export async function setAnalyticsConsent(db:SQLiteDatabase,granted:boolean){await db.runAsync('INSERT OR REPLACE INTO app_settings(key,value,updated_at) VALUES(?,?,?)','analytics.consent',granted?'granted':'denied',new Date().toISOString());await adapter?.setCollectionEnabled(granted);}
export async function hasAnalyticsConsent(db:SQLiteDatabase){const row=await db.getFirstAsync<{value:string}>('SELECT value FROM app_settings WHERE key=?','analytics.consent');return row?.value==='granted';}
export async function trackAnalyticsEvent(db:SQLiteDatabase,name:AnalyticsEvent){if(!analyticsEvents.includes(name)||!await hasAnalyticsConsent(db)||!adapter)return;await adapter.logEvent(name);}
