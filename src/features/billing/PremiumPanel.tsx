import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { finishTransaction, getAvailablePurchases, useIAP, type Purchase } from 'expo-iap';
import { api } from '@/features/sync/client';
import { purchaseVerificationRequest } from './purchase-payload';
import { useLanguage } from '@/features/localization/use-language';

const sku = {
  monthly: process.env.EXPO_PUBLIC_STORE_PRODUCT_MONTHLY ?? '',
  yearly: process.env.EXPO_PUBLIC_STORE_PRODUCT_YEARLY ?? '',
  lifetime: process.env.EXPO_PUBLIC_STORE_PRODUCT_LIFETIME ?? '',
};
const styles=StyleSheet.create({box:{backgroundColor:'#fff',borderRadius:16,padding:15,gap:10},row:{flexDirection:'row',gap:8},button:{backgroundColor:'#E7F2EC',borderRadius:12,padding:12,flex:1,alignItems:'center'},label:{fontSize:13,fontWeight:'700',color:'#16664A'},muted:{fontSize:12,lineHeight:18,color:'#64736C'}});

export default function PremiumPanel(){
  const {t}=useLanguage();const [working,setWorking]=useState(false);const [status,setStatus]=useState('');
  const verify=useCallback(async(purchase:Purchase)=>{
    setWorking(true);
    try{const request=purchaseVerificationRequest(purchase);await api(request.path,{method:'POST',body:JSON.stringify(request.body)});await finishTransaction({purchase,isConsumable:false});setStatus(t('billing_verified'));}
    catch(error){Alert.alert(t('billing_title'),error instanceof Error?error.message:t('billing_error'));}
    finally{setWorking(false);}
  },[t]);
  const {connected,subscriptions,products,fetchProducts,requestPurchase}=useIAP({onPurchaseSuccess:purchase=>{void verify(purchase);},onPurchaseError:error=>{if(error.code!=='user-cancelled')Alert.alert(t('billing_title'),error.message);}});
  useEffect(()=>{if(!connected)return;const subscriptionIds=[sku.monthly,sku.yearly].filter(Boolean),oneTimeIds=[sku.lifetime].filter(Boolean);if(subscriptionIds.length)void fetchProducts({skus:subscriptionIds,type:'subs'});if(oneTimeIds.length)void fetchProducts({skus:oneTimeIds,type:'in-app'});},[connected,fetchProducts]);
  async function buy(id:string,type:'subs'|'in-app'){if(!await SecureStore.getItemAsync('turaplan.access_token')){Alert.alert(t('billing_title'),t('billing_login_required'));return;}try{await requestPurchase({request:{apple:{sku:id},google:{skus:[id]}},type});}catch(error){Alert.alert(t('billing_title'),error instanceof Error?error.message:t('billing_error'));}}
  async function restore(){if(!await SecureStore.getItemAsync('turaplan.access_token')){Alert.alert(t('billing_title'),t('billing_login_required'));return;}setWorking(true);try{const purchases=await getAvailablePurchases();const apple_transaction_ids=purchases.filter(x=>x.store==='apple'&&x.transactionId).map(x=>x.transactionId!);const google_purchases=purchases.filter(x=>x.store==='google'&&x.purchaseToken).map(x=>({product_id:x.productId,purchase_token:x.purchaseToken!}));const result=await api<{restored:unknown[]}>('/billing/restore',{method:'POST',body:JSON.stringify({apple_transaction_ids,google_purchases})});setStatus(`${t('billing_restored')} (${result.data.restored.length})`);}catch(error){Alert.alert(t('billing_title'),error instanceof Error?error.message:t('billing_error'));}finally{setWorking(false);}}
  if(Platform.OS==='web')return null;
  const all=[...subscriptions,...products];const configured=[['monthly',sku.monthly,'subs'],['yearly',sku.yearly,'subs'],['lifetime',sku.lifetime,'in-app']] as const;
  return <View style={styles.box}><Text style={styles.muted}>{t('billing_notice')}</Text>{!Object.values(sku).some(Boolean)&&<Text style={styles.muted}>{t('billing_products_pending')}</Text>}<View style={styles.row}>{configured.filter(([,id])=>id).map(([key,id,type])=>{const product=all.find(x=>x.id===id);return <Pressable key={id} disabled={!connected||working} onPress={()=>void buy(id,type)} style={styles.button}><Text style={styles.label}>{product?.displayPrice??t(`billing_${key}`)}</Text></Pressable>;})}</View><Pressable disabled={working} onPress={()=>void restore()} style={styles.button}><Text style={styles.label}>{t('billing_restore')}</Text></Pressable>{status!==''&&<Text style={styles.muted}>{status}</Text>}</View>;
}
