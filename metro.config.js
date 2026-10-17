import { getDefaultConfig } from 'expo/metro-config';

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('wasm');

export default config;
