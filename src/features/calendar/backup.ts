import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

const tableKeys = ['employers','calendars','shifts','personal_events','shift_types','rotation_templates','pay_rules','pay_rule_versions','reminders','holiday_packs','holiday_entries','app_settings','mutation_outbox','sync_tombstones','sync_conflicts'] as const;
type TableName=typeof tableKeys[number];
const primaryKeys:Record<TableName,string|string[]>={employers:'id',calendars:'id',shifts:'id',personal_events:'id',shift_types:'id',rotation_templates:'id',pay_rules:'id',pay_rule_versions:'id',reminders:'id',holiday_packs:'id',holiday_entries:'id',app_settings:'key',mutation_outbox:'id',sync_tombstones:['entity_type','entity_id'],sync_conflicts:'id'};
type Backup={schemaVersion:number;createdAt:string;tables:Record<TableName,Record<string,unknown>[]>};

export async function exportCalendar(db:SQLiteDatabase,format:'json'|'csv'|'ics'|'pdf'){
  const backup=await readBackup(db);const rows=backup.tables.shifts.filter(row=>!row.deleted_at);let contents='',mime='text/plain',extension=format;
  if(format==='json'){contents=JSON.stringify(backup,null,2);mime='application/json';}
  if(format==='csv'){contents=toCsv(rows);mime='text/csv';}
  if(format==='ics'){contents=toIcs(rows);mime='text/calendar';}
  let uri:string;
  if(format==='pdf'){
    const html=toHtml(rows);uri=(await Print.printToFileAsync({html})).uri;
  }else{
    const directory=FileSystem.cacheDirectory??FileSystem.documentDirectory;if(!directory)throw new Error('export.storage_unavailable');uri=`${directory}turaplan-${Date.now()}.${extension}`;await FileSystem.writeAsStringAsync(uri,contents,{encoding:FileSystem.EncodingType.UTF8});
  }
  if(!await Sharing.isAvailableAsync())throw new Error('export.sharing_unavailable');await Sharing.shareAsync(uri,{mimeType:mime,dialogTitle:'TuraPlan export',UTI:format==='ics'?'com.apple.ical.ics':'public.data'});
}

export async function importCalendar(db:SQLiteDatabase){
  const picked=await DocumentPicker.getDocumentAsync({type:['application/json','text/json'],copyToCacheDirectory:true,multiple:false});if(picked.canceled)return null;
  const contents=await FileSystem.readAsStringAsync(picked.assets[0].uri);const backup=JSON.parse(contents) as Backup;const counts=validateBackup(backup);if(counts.errors.length)throw new Error(`import.invalid_backup:${counts.errors.join(',')}`);
  return {counts:counts.counts,commit:async(strategy:'merge'|'replace'='merge')=>{
    await db.withTransactionAsync(async()=>{
      if(strategy==='replace')for(const table of [...tableKeys].reverse())await db.runAsync(`DELETE FROM "${table}"`);
      for(const table of tableKeys){const primary=Array.isArray(primaryKeys[table])?primaryKeys[table] as string[]:[primaryKeys[table] as string];for(const row of backup.tables[table]??[]){const columns=Object.keys(row);const schema=await db.getAllAsync<{name:string}>(`PRAGMA table_info("${table}")`);const allowed=new Set(schema.map(x=>x.name));if(columns.some(key=>!allowed.has(key)))throw new Error(`import.unknown_column:${table}`);const values=columns.map(key=>row[key]);const updates=columns.filter(key=>!primary.includes(key)).map(key=>`"${key}"=excluded."${key}"`).join(',');const sql=`INSERT INTO "${table}" (${columns.map(k=>`"${k}"`).join(',')}) VALUES (${columns.map(()=>'?').join(',')}) ON CONFLICT(${primary.map(k=>`"${k}"`).join(',')}) DO ${strategy==='merge'&&updates?'UPDATE SET '+updates:'NOTHING'}`;await db.runAsync(sql,...values as (string|number|null)[]);}}
    });
    return counts.counts;
  }};
}

async function readBackup(db:SQLiteDatabase):Promise<Backup>{const tables={} as Backup['tables'];for(const table of tableKeys)tables[table]=await db.getAllAsync<Record<string,unknown>>(`SELECT * FROM "${table}"`);return {schemaVersion:1,createdAt:new Date().toISOString(),tables};}
function validateBackup(value:Backup){const errors:string[]=[],counts={} as Record<TableName,number>;if(!value||value.schemaVersion!==1||!value.tables||typeof value.tables!=='object')return {errors:['schemaVersion'],counts};for(const table of tableKeys){const rows=value.tables[table];if(!Array.isArray(rows)){errors.push(table);counts[table]=0;continue;}counts[table]=rows.length;const keys=Array.isArray(primaryKeys[table])?primaryKeys[table] as string[]:[primaryKeys[table] as string];for(const [i,row]of rows.entries()){if(!row||typeof row!=='object'||keys.some(key=>typeof row[key]!=='string'))errors.push(`${table}[${i}]`);if(i>=100000)errors.push(`${table}.too_many_rows`);}}return {errors,counts};}
function safeCsv(value:unknown){let text=String(value??'');if(/^[=+\-@\t\r]/.test(text))text=`'${text}`;return `"${text.replaceAll('"','""')}"`;}
function toCsv(rows:Record<string,unknown>[]){const fields=['title','starts_local','ends_local','timezone','employer_id','currency','hourly_rate_minor','break_minutes','note'];return [fields.join(','),...rows.map(r=>fields.map(k=>safeCsv(r[k])).join(','))].join('\r\n');}
function icsEscape(value:string){return value.replaceAll('\\','\\\\').replaceAll(';','\\;').replaceAll(',','\\,').replaceAll('\n','\\n');}
function toIcs(rows:Record<string,unknown>[]){const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//TuraPlan//Shift Calendar 1.0//EN','CALSCALE:GREGORIAN'];for(const r of rows){lines.push('BEGIN:VEVENT',`UID:${r.id}@turaplan`,`DTSTAMP:${utcStamp(new Date())}`,`DTSTART:${utcStamp(new Date(String(r.starts_at)))}`,`DTEND:${utcStamp(new Date(String(r.ends_at)))}`,`SUMMARY:${icsEscape(String(r.title??'Shift'))}`,'END:VEVENT');}lines.push('END:VCALENDAR');return lines.join('\r\n')+'\r\n';}
function utcStamp(value:Date){return value.toISOString().replaceAll('-','').replaceAll(':','').replace(/\.\d{3}Z$/,'Z');}
function escapeHtml(value:unknown){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}
function toHtml(rows:Record<string,unknown>[]){return `<!doctype html><meta charset="utf-8"><style>body{font:12px Arial;color:#17231f}h1{color:#16664a}table{width:100%;border-collapse:collapse}th,td{padding:7px;border-bottom:1px solid #dce5df;text-align:left}</style><h1>TuraPlan · shift calendar</h1><table><thead><tr><th>Shift</th><th>Start</th><th>End</th><th>Timezone</th><th>Rate</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.title)}</td><td>${escapeHtml(r.starts_local??r.starts_at)}</td><td>${escapeHtml(r.ends_local??r.ends_at)}</td><td>${escapeHtml(r.timezone)}</td><td>${escapeHtml(r.hourly_rate_minor)} ${escapeHtml(r.currency)}</td></tr>`).join('')}</tbody></table><p>Estimated values only. Not payroll or tax advice.</p>`;}
