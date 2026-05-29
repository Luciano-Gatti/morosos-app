import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { authService } from "@/services/api/authService";
import { clearStoredAccessToken, getStoredAccessToken, storeAccessToken } from "@/lib/authStorage";
import type { AuthState } from "@/types/auth";

interface AuthContextValue extends AuthState {
  login: (emailOrUsername: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshSessionFromMe: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasRole: (roleCode: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const emptyState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(emptyState);

  const clearSession = useCallback(() => {
    clearStoredAccessToken();
    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshSessionFromMe = useCallback(async () => {
    const token = getStoredAccessToken();

    if (!token) {
      setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    setState((current) => ({ ...current, accessToken: token, isLoading: true }));

    try {
      const user = await authService.me(token);
      setState({
        user,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    void refreshSessionFromMe();
  }, [refreshSessionFromMe]);

  const login = useCallback(async (emailOrUsername: string, password: string, rememberMe: boolean) => {
    const response = await authService.login({ usernameOrEmail: emailOrUsername, password });
    storeAccessToken(response.accessToken, rememberMe);
    setState({
      user: response.user,
      accessToken: response.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    const token = getStoredAccessToken();

    try {
      if (token) {
        await authService.logout(token);
      }
    } catch {
      // La sesión local se limpia aunque el logout remoto no responda.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const hasPermission = useCallback(
    (permissionCode: string) => Boolean(state.user?.permissions?.includes(permissionCode)),
    [state.user?.permissions],
  );

  const hasAnyPermission = useCallback(
    (permissionCodes: string[]) => permissionCodes.some((permissionCode) => state.user?.permissions?.includes(permissionCode)),
    [state.user?.permissions],
  );

  const hasRole = useCallback(
    (roleCode: string) => Boolean(state.user?.roles?.includes(roleCode)),
    [state.user?.roles],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshSessionFromMe,
      hasPermission,
      hasAnyPermission,
      hasRole,
    }),
    [hasAnyPermission, hasPermission, hasRole, login, logout, refreshSessionFromMe, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
