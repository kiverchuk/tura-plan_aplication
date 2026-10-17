export const localApiOrigin = (process.env.EXPO_PUBLIC_API_URL_WEB ?? 'http://work-calendar').replace(/\/$/, '');
export const productionApiOrigin = (process.env.EXPO_PUBLIC_API_URL_NATIVE ?? 'https://wc.bruisergames.online').replace(/\/$/, '');

export function apiOrigin(platform: string, override?: string): string {
  const explicit = (override ?? '').trim().replace(/\/$/, '');
  if (explicit) return explicit;
  return platform === 'web' ? localApiOrigin : productionApiOrigin;
}
