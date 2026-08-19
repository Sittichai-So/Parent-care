import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { setAuthToken } from '@/services/api-client';
import * as authApi from '@/services/auth-api';

// Deliberately no `role` here — the mock data used to conflate "account
// type" with "role within a household," but those are genuinely different
// now: a User is just an identity, and role is a per-HouseholdMember thing
// (see family-context.tsx / households-api.ts) since one account can belong
// to more than one household with a different role in each.
export type User = {
  id: string;
  name: string;
  email: string;
  /** Shareable lookup code — lets another account find and invite this one
   *  (see family-context.tsx#lookupUser) without an open name search. */
  userCode: string | null;
  phone: string | null;
  address: string | null;
};

/** Step 1's fields, held only in memory (never persisted) while the caller
 *  fills out step 2 — register.tsx no longer calls the API itself; whichever
 *  household action the user completes in household-setup.tsx calls
 *  `register(...)` first, so the account is only ever created once both
 *  steps have real, validated data. See household-setup.tsx#ensureRegistered. */
export type PendingRegistration = { name: string; email: string; phone: string; address?: string; password: string };

type AuthContextValue = {
  user: User | null;
  token: string | null;
  /** True only while restoring a persisted session on app boot — distinct
   *  from `isLoading`, which covers an in-flight login/register call. */
  isRestoring: boolean;
  isLoading: boolean;
  /** Resolves with the logged-in user — callers that need to act right away
   *  shouldn't rely on `user` from context, since that only reflects the
   *  *next* render after this promise resolves. */
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

  // Restore a persisted session once on boot, so the app doesn't bounce to
  // the login screen on every reload.
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
      } catch {
        // Corrupt/unreadable storage — treat as logged out rather than crash boot.
      } finally {
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
      // Runs on both success and failure — a failed attempt used to leave
      // isLoading stuck true, permanently disabling the login form.
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
