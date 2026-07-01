import React, { createContext, useContext, useState } from "react";

export type WebUserRole = "agent" | "supervisor" | "superadmin";

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
  token: string | null;
  login: (user: WebAuthUser, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: false,
  setIsLoading: () => {},
});

const USER_STORAGE_KEY = "@cashcollect_web_user";
const TOKEN_STORAGE_KEY = "@cashcollect_web_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WebAuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  function login(newUser: WebAuthUser, newToken: string) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setUser(newUser);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isLoading, setIsLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
