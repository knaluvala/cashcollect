import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "@/lib/api";

export type UserRole = "agent" | "supervisor" | "superadmin";

export interface AuthUser {
  id: number;
  role: UserRole;
  name: string;
  email: string;
  code: string;
  route: string;
  agentCode?: string;
  supervisorCode?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (userCode: string, password: string) => Promise<LoginResult>;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false, error: "Not initialized" }),
  refreshSession: async () => false,
  logout: async () => {},
});

const AUTH_USER_STORAGE_KEY = "@cashcollect_mobile_user";
const AUTH_TOKEN_STORAGE_KEY = "@cashcollect_mobile_token";

function mapApiUser(apiUser: any): AuthUser {
  return {
    id: apiUser.id,
    role: apiUser.role,
    name: apiUser.name,
    email: apiUser.email,
    code: apiUser.agentCode,
    route: apiUser.routeCode,
    agentCode: apiUser.role === "agent" ? apiUser.agentCode : undefined,
    supervisorCode:
      apiUser.role === "supervisor" ? apiUser.agentCode : undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!token) return;

    const timer = setInterval(
      () => {
        refreshSession();
      },
      6 * 60 * 60 * 1000,
    );

    return () => clearInterval(timer);
  }, [token]);

  async function loadUser() {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_USER_STORAGE_KEY);
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);

        await refreshSession();
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  async function login(
    userCode: string,
    password: string,
  ): Promise<LoginResult> {
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ userCode, password }),
      });

      const result = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: result.error ?? "Invalid credentials",
        };
      }

      const mappedUser = mapApiUser(result.user);

      await AsyncStorage.setItem(
        AUTH_USER_STORAGE_KEY,
        JSON.stringify(mappedUser),
      );
      await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, result.token);

      setUser(mappedUser);
      setToken(result.token);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Network error while logging in",
      };
    }
  }

  async function refreshSession(): Promise<boolean> {
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

      if (!storedToken) {
        return false;
      }

      const res = await apiFetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        await logout();
        return false;
      }

      const mappedUser = mapApiUser(result.user);

      await AsyncStorage.setItem(
        AUTH_USER_STORAGE_KEY,
        JSON.stringify(mappedUser),
      );
      await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, result.token);

      setUser(mappedUser);
      setToken(result.token);

      return true;
    } catch {
      return false;
    }
  }

  async function logout() {
    await AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, refreshSession, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
