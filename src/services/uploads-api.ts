import { apiUpload } from './api-client';

export type ApiUpload = { url: string };

const guessMimeType = (uri: string): string => {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
};

export const uploadImage = (uri: string) => {
  const name = uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  return apiUpload<ApiUpload>('/uploads', { uri, name, type: guessMimeType(uri) });
};