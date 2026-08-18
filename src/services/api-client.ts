/**
 * Thin fetch wrapper around the parent-care-backend API. Unwraps the
 * backend's `{success,message,data}` envelope and normalizes failures into
 * a typed ApiError, so callers just get back `data` or a thrown error with
 * a human-readable `message`.
 *
 * No axios/react-query here on purpose — this stays a hand-rolled wrapper
 * in the same minimal-dependency style as services/notifications.ts.
 */

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8024/api').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(message: string, status: number, errors: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

let authToken: string | null = null;

/** Called by auth-context after login/register/session-restore/logout. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

type QueryValue = string | number | boolean | undefined | null;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
};

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const base = `${BASE_URL}${path}`;
  if (!query) return base;

  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return params.length > 0 ? `${base}?${params.join('&')}` : base;
}

type Envelope<T> = { success: boolean; message?: string; data?: T; errors?: string[] };

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่', 0);
  }

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    // Non-JSON response (e.g. a proxy error page) — falls through to the
    // status-based error below.
  }

  if (!response.ok || !payload || payload.success === false) {
    throw new ApiError(payload?.message ?? `Request failed (${response.status})`, response.status, payload?.errors ?? []);
  }

  return payload.data as T;
}

export const apiGet = <T>(path: string, query?: Record<string, QueryValue>) => request<T>(path, { method: 'GET', query });
export const apiPost = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body });
export const apiPut = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body });
export const apiPatch = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body });
export const apiDelete = <T>(path: string) => request<T>(path, { method: 'DELETE' });

/** Multipart upload — separate from `request()` because a file body can't be
 *  JSON.stringify'd, and `fetch` must set its own `Content-Type` (with the
 *  multipart boundary) rather than the `application/json` `request()` always
 *  sends when a body is present. */
export async function apiUpload<T>(path: string, file: { uri: string; name: string; type: string }): Promise<T> {
  const form = new FormData();
  // React Native's FormData accepts this `{uri,name,type}` shape in place of
  // a real Blob/File — not expressible in the DOM FormData types TypeScript
  // has loaded here, hence the cast.
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path), { method: 'POST', headers, body: form });
  } catch {
    throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่', 0);
  }

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    // Non-JSON response — falls through to the status-based error below.
  }

  if (!response.ok || !payload || payload.success === false) {
    throw new ApiError(payload?.message ?? `Request failed (${response.status})`, response.status, payload?.errors ?? []);
  }

  return payload.data as T;
}
