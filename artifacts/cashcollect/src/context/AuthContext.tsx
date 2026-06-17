import React, { createContext, useContext, useState } from 'react';

export type WebUserRole = 'agent' | 'supervisor' | 'superadmin';

export interface WebAuthUser {
  id: number;
  role: WebUserRole;
  name: string;
  email: string;
  agentCode?: string;
  supervisorCode?: string;
}

interface AuthContextType {
  user: WebAuthUser | null;
  login: (user: WebAuthUser) => void;
  logout: () => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: false,
  setIsLoading: () => {},
});

const STORAGE_KEY = '@cashcollect_web_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WebAuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  function login(newUser: WebAuthUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, setIsLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
