import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { setAuthToken } from '@/services/api-client';
import * as authApi from '@/services/auth-api';

export type User = {
  id: string;
  name: string;
  email: string;
  userCode: string | null;
  phone: string | null;
  address: string | null;
};

export type PendingRegistration = { name: string; email: string; phone: string; address?: string; password: string };

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isRestoring: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone: string, address?: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  pendingRegistration: PendingRegistration | null;
  setPendingRegistration: (draft: PendingRegistration | null) => void;
};

const STORAGE_KEY = 'parent-care.session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const toUser = (apiUser: authApi.ApiUser): User => ({
  id: apiUser._id,
  name: apiUser.name,
  email: apiUser.email,
  userCode: apiUser.userCode,
  phone: apiUser.phone,
  address: apiUser.address,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as { token: string; user: User };
          setAuthToken(stored.token);
          setToken(stored.token);
          setUser(stored.user);
        }
      } catch {} finally {
        setIsRestoring(false);
      }
    })();
  }, []);

  const persist = async (nextToken: string, nextUser: User) => {
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.login(email.trim(), password);
      const nextUser = toUser(result.user);
      await persist(result.token, nextUser);
      return nextUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone: string, address?: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.register(name.trim(), email.trim(), password, phone, address);
      const nextUser = toUser(result.user);
      await persist(result.token, nextUser);
      return nextUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isRestoring,
      isLoading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      pendingRegistration,
      setPendingRegistration,
    }),
    [user, token, isRestoring, isLoading, pendingRegistration]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
