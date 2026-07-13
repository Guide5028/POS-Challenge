import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "../lib/api";
import { tokens } from "../lib/tokens";
import type { Profile } from "../types";

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens.access) {
      setLoading(false);
      return;
    }
    authApi
      .profile()
      .then(setProfile)
      .catch(() => tokens.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    tokens.set(result.accessToken, result.refreshToken);
    setProfile(result.profile);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    await authApi.register(email, password, name);
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    tokens.clear();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
