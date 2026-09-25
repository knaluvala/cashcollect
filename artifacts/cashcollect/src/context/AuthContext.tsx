import React, { createContext, useContext, useEffect, useState } from "react";

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
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WebAuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  function login(newUser: WebAuthUser, newToken: string) {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    sessionStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setUser(newUser);
    setToken(newToken);
  }

  function logout() {
    sessionStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }

  // Auto-logout after IDLE_TIMEOUT_MS of no user activity
  useEffect(() => {
    if (!token) return;

    let timer: ReturnType<typeof setTimeout>;
    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.removeItem(USER_STORAGE_KEY);
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
        setToken(null);
      }, IDLE_TIMEOUT_MS);
    }

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer),
    );
    resetTimer();

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer),
      );
    };
  }, [token]);

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
