import React, { createContext, useContext, useMemo, useState } from 'react';

export type UserRole = 'caregiver' | 'elder' | 'admin';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const mockUsers: User[] = [
  { id: '1', name: 'คุณสมชาย', email: 'caregiver@gmail.com', role: 'caregiver' },
  { id: '2', name: 'แม่สมใจ', email: 'elder@gmail.com', role: 'elder' },
  { id: '3', name: 'Admin', email: 'admin@gmail.com', role: 'admin' },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const foundUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser && password.length >= 4) {
      setUser(foundUser);
    } else {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user,
    }),
    [user, isLoading]
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
