import { apiPost } from './api-client';

export type ApiUser = {
  _id: string;
  name: string;
  email: string;
  userCode: string | null;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  role: string;
  isActive: boolean;
};

export type AuthResult = { user: ApiUser; token: string };

export const login = (email: string, password: string) => apiPost<AuthResult>('/auth/login', { email, password });

export const register = (name: string, email: string, password: string, phone: string, address?: string) =>
  apiPost<AuthResult>('/auth/register', { name, email, password, phone, address });
