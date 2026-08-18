import { apiUpload } from './api-client';

/** `url` is the path the backend actually returned (e.g. `/uploads/…`) —
 *  passed straight through to whatever stores it (e.g. `MedicationLog.image`
 *  via medicines-api.ts#logDose), same as the backend's own seed data does. */
export type ApiUpload = { url: string };

const guessMimeType = (uri: string): string => {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
};

/** Uploads a local image (e.g. an `expo-image-picker` capture's `uri`) and
 *  returns the URL the backend stored it at. */
export const uploadImage = (uri: string) => {
  const name = uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  return apiUpload<ApiUpload>('/uploads', { uri, name, type: guessMimeType(uri) });
};