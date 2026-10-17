import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { apiOrigin } from './api-base';

const API=apiOrigin(Platform.OS);
type ApiResult<T>={data:T};
async function request<T>(path:string,init:RequestInit={},authenticated=true):Promise<ApiResult<T>>{
  if(!API)throw new Error('sync.server_not_configured');
  let token=authenticated?await SecureStore.getItemAsync('turaplan.access_token'):null;
  const send=()=>fetch(`${API}/api/v1${path}`,{...init,headers:{Accept:'application/json','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...init.headers}});
  let response=await send();
  if(response.status===401&&authenticated){const refresh=await SecureStore.getItemAsync('turaplan.refresh_token');if(refresh){const deviceId=await SecureStore.getItemAsync('turaplan.device_id');const renewed=await request<{access_token:string;refresh_token:string;device_id:string}>('/auth/refresh',{method:'POST',body:JSON.stringify({refresh_token:refresh,device_id:deviceId})},false);token=renewed.data.access_token;await SecureStore.setItemAsync('turaplan.access_token',renewed.data.access_token);await SecureStore.setItemAsync('turaplan.refresh_token',renewed.data.refresh_token);await SecureStore.setItemAsync('turaplan.device_id',renewed.data.device_id);response=await send();}}
  const body=await response.json().catch(()=>null);if(!response.ok)throw new Error(body?.error?.code??`sync.http_${response.status}`);return body as ApiResult<T>;
}
export async function account(action:'register'|'login',email:string,password:string,name?:string){const deviceId=await SecureStore.getItemAsync('turaplan.device_id')??Crypto.randomUUID();const result=await request<{access_token:string;refresh_token:string;device_id:string;user:{id:string;name:string;email:string}}>('/auth/'+action,{method:'POST',body:JSON.stringify({email,password,...(action==='register'?{name,password_confirmation:password}:{}),device_name:'TuraPlan mobile',platform:Platform.OS,device_id:deviceId})},false);await SecureStore.setItemAsync('turaplan.access_token',result.data.access_token);await SecureStore.setItemAsync('turaplan.refresh_token',result.data.refresh_token);await SecureStore.setItemAsync('turaplan.device_id',result.data.device_id);return result.data.user;}
export async function signOut(){const refresh=await SecureStore.getItemAsync('turaplan.refresh_token');try{await request('/auth/logout',{method:'POST',body:JSON.stringify({refresh_token:refresh})});}finally{await SecureStore.deleteItemAsync('turaplan.access_token');await SecureStore.deleteItemAsync('turaplan.refresh_token');}}
export async function api<T>(path:string,init?:RequestInit){return request<T>(path,init);}
export async function requestAccountErase(password:string){const result=await api<{id:string;status:string}>('/privacy/erase',{method:'POST',body:JSON.stringify({password})});await SecureStore.deleteItemAsync('turaplan.access_token');await SecureStore.deleteItemAsync('turaplan.refresh_token');await SecureStore.deleteItemAsync('turaplan.device_id');return result.data;}
export async function privacyRequestStatus(id:string){return request<{id:string;kind:string;status:string;created_at:string;completed_at:string|null}>(`/privacy/requests/${encodeURIComponent(id)}`,{},false);}
export function serverConfigured(){return Boolean(API);}
