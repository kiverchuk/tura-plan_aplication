import { useCallback, useState } from 'react';
import { useFocusEffect, Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/features/localization/use-language';
import { paidMinutes } from '@/features/calendar/domain';
import { localDateKey, weekRange } from '@/features/calendar/planning';
import { formatClock, usePreferences } from '@/features/preferences/use-preferences';

type Row = { id:string; title:string; starts_at:string; ends_at:string; starts_local:string; ends_local:string; currency:string; hourly_rate_minor:number; break_minutes:number; employer:string|null };
const ink='#17231F', muted='#64736C', green='#16664A', pale='#E7F2EC', paper='#F5F7F4', card='#FFFFFF';
export default function TodayScreen() {
  const db=useSQLiteContext(), {t,language}=useLanguage(), {timeFormat,weekStart}=usePreferences(); const [shifts,setShifts]=useState<Row[]>([]); const [weekMinutes,setWeekMinutes]=useState(0); const [weekCount,setWeekCount]=useState(0);
  const reload=useCallback(async()=>{
    const upcoming=await db.getAllAsync<Row>('SELECT s.id,s.title,s.starts_at,s.ends_at,s.starts_local,s.ends_local,s.currency,s.hourly_rate_minor,s.break_minutes,e.name AS employer FROM shifts s LEFT JOIN employers e ON e.id=s.employer_id WHERE s.deleted_at IS NULL AND s.ends_at >= ? ORDER BY s.starts_at LIMIT 8',new Date().toISOString());
    const range=weekRange(new Date(),weekStart);
    const week=await db.getAllAsync<{starts_at:string;ends_at:string;break_minutes:number}>('SELECT starts_at,ends_at,break_minutes FROM shifts WHERE deleted_at IS NULL AND starts_local >= ? AND starts_local < ?',`${range.from}T00:00:00`,`${range.to}T00:00:00`);
    setShifts(upcoming); setWeekCount(week.length); setWeekMinutes(week.reduce((sum,row)=>sum+paidMinutes({startsAt:row.starts_at,endsAt:row.ends_at,breakMinutes:row.break_minutes}),0));
  },[db,weekStart]);
  useFocusEffect(useCallback(()=>{void reload();},[reload]));
  const today=new Date();
  const todayKey=localDateKey(today);
  const now=Date.now();
  const todays=shifts.filter(s=>(s.starts_local?.slice(0,10)??new Date(s.starts_at).toISOString().slice(0,10))===todayKey);
  const active=todays.find(s=>Date.parse(s.starts_at)<=now&&Date.parse(s.ends_at)>now);
  const next=shifts.find(s=>Date.parse(s.ends_at)>now);
  const hero=active??todays[0];
  const status=hero?active?`${t('continues_until')} ${formatClock(hero.ends_local,hero.ends_at,language,timeFormat)}`:startsIn(hero.starts_at,t):t('off');
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <View style={s.top}><View><Text style={s.eyebrow}>{today.toLocaleDateString(language,{weekday:'long'}).toUpperCase()}</Text><Text style={s.date}>{today.toLocaleDateString(language,{day:'numeric',month:'long'})}</Text></View><Link href="/settings" style={s.logo}><Text style={s.logoText}>T</Text></Link></View>
    <View style={s.hero}><Text style={s.heroLabel}>{hero ? t('today') : t('off')}</Text><Text style={s.heroTitle}>{hero ? hero.title : t('off')}</Text><Text style={s.heroSub}>{hero ? `${formatClock(hero.starts_local,hero.starts_at,language,timeFormat)} – ${formatClock(hero.ends_local,hero.ends_at,language,timeFormat)} · ${hero.employer??t('employer')}` : t('empty')}</Text><Text style={s.status}>{status}</Text><View style={s.pill}><View style={s.dot}/><Text style={s.pillText}>{t('local')}</Text></View></View>
    <View style={s.week}><Text style={s.heading}>{t('this_week')}</Text><Text style={s.weekStat}>{weekCount} · {Math.floor(weekMinutes/60)}h {weekMinutes%60}m</Text></View>
    <View style={s.actions}><Link href="/calendar" style={s.action}>{t('quick_add')}</Link><Link href="/events" style={s.action}>{t('mark_leave')}</Link></View>
    <View style={s.sectionHead}><Text style={s.heading}>{t('next')}</Text><Link href="/calendar" style={s.link}>{t('calendar')} ›</Link></View>
    {next ? <View style={s.nextCard}><View style={s.dateBlock}><Text style={s.month}>{localDate(next.starts_local,next.starts_at).toLocaleDateString(language,{month:'short'}).toUpperCase()}</Text><Text style={s.day}>{localDate(next.starts_local,next.starts_at).getDate()}</Text></View><View style={s.nextInfo}><Text style={s.nextTitle}>{next.title}</Text><Text style={s.muted}>{formatClock(next.starts_local,next.starts_at,language,timeFormat)} – {formatClock(next.ends_local,next.ends_at,language,timeFormat)}</Text></View><Text style={s.arrow}>›</Text></View> : <View style={s.emptyCard}><Text style={s.emptyTitle}>{t('empty')}</Text><Link href="/calendar" style={s.addLink}>＋ {t('add')}</Link></View>}
    <View style={s.sectionHead}><Text style={s.heading}>{t('recent')}</Text></View>
    {shifts.slice(0,4).map(x=><View key={x.id} style={s.row}><View style={s.rowDot}/><View style={s.rowMain}><Text style={s.rowTitle}>{x.title}</Text><Text style={s.muted}>{localDate(x.starts_local,x.starts_at).toLocaleDateString(language,{weekday:'short',month:'short',day:'numeric'})} · {formatClock(x.starts_local,x.starts_at,language,timeFormat)}</Text></View><Text style={s.rowArrow}>›</Text></View>)}
  </ScrollView></SafeAreaView>;
}
function localDate(local:string|undefined,utc:string){return local?new Date(`${local.slice(0,10)}T12:00:00`):new Date(utc);}
function startsIn(startsAt:string,t:(key:string)=>string){const minutes=Math.max(0,Math.round((Date.parse(startsAt)-Date.now())/60000));if(minutes<60)return `${t('starts_in')} ${minutes}m`;return `${t('starts_in')} ${Math.floor(minutes/60)}h ${minutes%60}m`;}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:paper},page:{paddingHorizontal:22,paddingTop:10,paddingBottom:28},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:22},eyebrow:{color:muted,fontSize:11,fontWeight:'700',letterSpacing:1.5},date:{color:ink,fontWeight:'700',fontSize:24,marginTop:3},logo:{height:42,width:42,borderRadius:15,backgroundColor:pale,alignItems:'center',justifyContent:'center'},logoText:{fontWeight:'800',fontSize:22,color:green},hero:{backgroundColor:green,borderRadius:26,padding:22,minHeight:188,justifyContent:'center',overflow:'hidden'},heroLabel:{color:'#C9E7D7',fontSize:13,fontWeight:'600'},heroTitle:{color:'#fff',fontSize:30,fontWeight:'800',marginTop:7},heroSub:{color:'#D8EADF',fontSize:14,marginTop:5},status:{color:'#F3D7A2',fontSize:13,fontWeight:'700',marginTop:8},pill:{flexDirection:'row',alignItems:'center',gap:7,alignSelf:'flex-start',backgroundColor:'#FFFFFF20',paddingHorizontal:11,paddingVertical:7,borderRadius:20,marginTop:18},dot:{height:7,width:7,borderRadius:4,backgroundColor:'#BDE2C9'},pillText:{color:'#EAF5EE',fontSize:11},sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:27,marginBottom:12},heading:{color:ink,fontSize:18,fontWeight:'700'},link:{color:green,fontWeight:'700',fontSize:13},week:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:18,backgroundColor:card,borderRadius:16,padding:14},weekStat:{color:green,fontWeight:'800'},actions:{flexDirection:'row',gap:8,marginTop:10},action:{flex:1,textAlign:'center',backgroundColor:pale,color:green,fontWeight:'800',paddingVertical:12,borderRadius:14,overflow:'hidden'},nextCard:{flexDirection:'row',alignItems:'center',padding:14,backgroundColor:card,borderRadius:20,gap:13},dateBlock:{height:55,width:55,borderRadius:16,backgroundColor:pale,alignItems:'center',justifyContent:'center'},month:{fontSize:10,color:green,fontWeight:'800'},day:{fontSize:19,color:ink,fontWeight:'800'},nextInfo:{flex:1,gap:4},nextTitle:{fontSize:15,color:ink,fontWeight:'700'},muted:{fontSize:12,color:muted},arrow:{fontSize:26,color:muted},emptyCard:{padding:19,backgroundColor:card,borderRadius:20,gap:13},emptyTitle:{color:muted,fontSize:14,lineHeight:20},addLink:{color:green,fontWeight:'700',fontSize:14},row:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:13,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#DFE6E1'},rowDot:{height:10,width:10,borderRadius:5,backgroundColor:'#E7A66A'},rowMain:{flex:1,gap:4},rowTitle:{fontSize:14,fontWeight:'700',color:ink},rowArrow:{fontSize:22,color:muted}});
