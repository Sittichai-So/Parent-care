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
  } catch {}

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

export async function apiUpload<T>(path: string, file: { uri: string; name: string; type: string }): Promise<T> {
  const form = new FormData();
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
  } catch {}

  if (!response.ok || !payload || payload.success === false) {
    throw new ApiError(payload?.message ?? `Request failed (${response.status})`, response.status, payload?.errors ?? []);
  }

  return payload.data as T;
}
