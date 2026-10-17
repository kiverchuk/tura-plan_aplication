import { existsSync, readFileSync } from 'node:fs';

const config=JSON.parse(readFileSync(new URL('./app.json',import.meta.url),'utf8'));
const androidServices='./google-services.json';
const iosServices='./GoogleService-Info.plist';
if(existsSync(new URL(androidServices,import.meta.url))&&existsSync(new URL(iosServices,import.meta.url))){
  config.expo.android.googleServicesFile=androidServices;
  config.expo.ios.googleServicesFile=iosServices;
  config.expo.plugins.push('@react-native-firebase/app',['@react-native-firebase/analytics',{ios:{withoutAdIdSupport:true}}]);
}

export default config;
