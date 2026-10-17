import type { SQLiteDatabase } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

export async function initializeDatabase(db: SQLiteDatabase) {
  if (Platform.OS !== 'web') {
    let key = await SecureStore.getItemAsync('turaplan.sqlite.key');
    if (!key) {
      key = Array.from(await Crypto.getRandomBytesAsync(32), byte => byte.toString(16).padStart(2, '0')).join('');
      await SecureStore.setItemAsync('turaplan.sqlite.key', key, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
    }
    await db.execAsync(`PRAGMA key = "x'${key}'"; PRAGMA cipher_memory_security = ON;`);
    await db.getFirstAsync('SELECT count(*) FROM sqlite_master');
  }
  await db.execAsync(`PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS employers (id TEXT PRIMARY KEY, name TEXT NOT NULL, currency TEXT NOT NULL DEFAULT 'RON', archived INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, deleted_at TEXT);
    CREATE TABLE IF NOT EXISTS calendars (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT, timezone TEXT NOT NULL, region TEXT, visible INTEGER NOT NULL DEFAULT 1, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, deleted_at TEXT);
    CREATE TABLE IF NOT EXISTS shifts (id TEXT PRIMARY KEY, title TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, timezone TEXT NOT NULL, break_minutes INTEGER NOT NULL DEFAULT 0, hourly_rate_minor INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'RON', note TEXT, employer_id TEXT REFERENCES employers(id), calendar_id TEXT REFERENCES calendars(id), shift_type_id TEXT, rotation_id TEXT, actual_minutes INTEGER, planned INTEGER NOT NULL DEFAULT 1, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, deleted_at TEXT);
    CREATE INDEX IF NOT EXISTS shifts_start_idx ON shifts(starts_at);
    CREATE INDEX IF NOT EXISTS shifts_employer_idx ON shifts(employer_id, starts_at);
    CREATE TABLE IF NOT EXISTS personal_events (id TEXT PRIMARY KEY, title TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, starts_local TEXT, ends_local TEXT, timezone TEXT NOT NULL DEFAULT 'UTC', all_day INTEGER NOT NULL DEFAULT 0, note TEXT, calendar_id TEXT REFERENCES calendars(id), revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, deleted_at TEXT);
    CREATE TABLE IF NOT EXISTS shift_types (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, icon TEXT, default_start TEXT, default_end TEXT, hourly_rate_minor INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'RON', archived INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, deleted_at TEXT);
    CREATE TABLE IF NOT EXISTS rotation_templates (id TEXT PRIMARY KEY, name TEXT NOT NULL, anchor_date TEXT NOT NULL, cycle_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, deleted_at TEXT);
    CREATE TABLE IF NOT EXISTS pay_rules (id TEXT PRIMARY KEY, employer_id TEXT REFERENCES employers(id), name TEXT NOT NULL, currency TEXT NOT NULL, hourly_rate_minor INTEGER NOT NULL, overtime_json TEXT, night_json TEXT, holiday_json TEXT, active_from TEXT NOT NULL, active_to TEXT, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, deleted_at TEXT);
    CREATE TABLE IF NOT EXISTS pay_rule_versions (id TEXT PRIMARY KEY, pay_rule_id TEXT NOT NULL REFERENCES pay_rules(id), valid_from TEXT NOT NULL, snapshot_json TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY, shift_id TEXT NOT NULL REFERENCES shifts(id), minutes_before INTEGER NOT NULL, notification_id TEXT, enabled INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS holiday_packs (id TEXT PRIMARY KEY, country TEXT NOT NULL, region TEXT, year INTEGER NOT NULL, locale TEXT NOT NULL, version TEXT NOT NULL, source_url TEXT NOT NULL, license TEXT NOT NULL, verified_at TEXT NOT NULL, stale INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS holiday_entries (id TEXT PRIMARY KEY, pack_id TEXT NOT NULL REFERENCES holiday_packs(id), date TEXT NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS mutation_outbox (id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, operation TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT);
    CREATE TABLE IF NOT EXISTS sync_tombstones (entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, deleted_at TEXT NOT NULL, revision INTEGER NOT NULL, PRIMARY KEY(entity_type, entity_id));
    CREATE TABLE IF NOT EXISTS sync_conflicts (id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, local_payload TEXT NOT NULL, remote_payload TEXT NOT NULL, detected_at TEXT NOT NULL, resolved_at TEXT, resolution TEXT);
    INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (1, datetime('now'));`);
  const columns = await db.getAllAsync<{name:string}>('PRAGMA table_info(shifts)');
  if (!columns.some(column => column.name === 'starts_local')) await db.execAsync('ALTER TABLE shifts ADD COLUMN starts_local TEXT');
  if (!columns.some(column => column.name === 'ends_local')) await db.execAsync('ALTER TABLE shifts ADD COLUMN ends_local TEXT');
  await db.runAsync('INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (2, ?)', nowIso());
}

export function newId() { return Crypto.randomUUID(); }
export function nowIso() { return new Date().toISOString(); }
