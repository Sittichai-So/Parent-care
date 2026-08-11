import { apiPost } from './api-client';

export type ApiUser = {
  _id: string;
  name: string;
  email: string;
  // Short code the user can share out-of-band so someone else can look them
  // up by exact match (see households-api.ts#lookupUser) — null for
  // accounts created before this field existed.
  userCode: string | null;
  phone: string | null;
  profileImage: string | null;
  role: string;
  isActive: boolean;
};

export type AuthResult = { user: ApiUser; token: string };

export const login = (email: string, password: string) => apiPost<AuthResult>('/auth/login', { email, password });

export const register = (name: string, email: string, password: string, phone?: string) =>
  apiPost<AuthResult>('/auth/register', { name, email, password, phone });
