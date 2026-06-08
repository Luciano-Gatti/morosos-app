import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthError, authService } from "@/services/api/authService";
import {
  clearStoredSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  persistSession,
  persistUser,
} from "@/services/api/authStorage";
import { AuthContext, type AuthContextValue } from "@/context/authContextCore";
import type { AuthState, LoginRequest } from "@/types/auth";

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>(() => {
    const accessToken = getStoredAccessToken();
    const user = getStoredUser();
    return {
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isLoading: true,
    };
  });

  const clearSession = useCallback(() => {
    clearStoredSession();
    setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  }, []);

  const refreshSessionFromMe = useCallback(async () => {
    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      clearSession();
      return;
    }

    setState((current) => ({ ...current, accessToken, isLoading: true }));

    try {
      const user = await authService.me(accessToken);
      persistUser(user);
      setState({ user, accessToken, isAuthenticated: true, isLoading: false });
    } catch (error) {
      clearSession();
      if (error instanceof AuthError && (error.status === 401 || error.status === 403)) {
        navigate("/login", { replace: true });
      }
    }
  }, [clearSession, navigate]);

  useEffect(() => {
    void refreshSessionFromMe();
  }, [refreshSessionFromMe]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      navigate("/login", { replace: true });
    };

    const handleForbidden = () => {
      toast.error("No tenés permisos para realizar esta acción.");
    };

    window.addEventListener("morosos:auth:unauthorized", handleUnauthorized);
    window.addEventListener("morosos:auth:forbidden", handleForbidden);

    return () => {
      window.removeEventListener("morosos:auth:unauthorized", handleUnauthorized);
      window.removeEventListener("morosos:auth:forbidden", handleForbidden);
    };
  }, [clearSession, navigate]);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authService.login(payload);
    persistSession(response.accessToken, response.refreshToken, response.user, payload.rememberMe);
    setState({
      user: response.user,
      accessToken: response.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const loginWithGoogleToken = useCallback(async (idToken: string) => {
    const response = await authService.googleLogin(idToken);
    if ("accessToken" in response) {
      persistSession(response.accessToken, response.refreshToken, response.user, false);
      setState({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return null;
    }
    return response.message;
  }, []);

  const loginWithGoogleCode = useCallback(async (code: string, redirectUri: string) => {
    const response = await authService.googleLoginWithCode(code, redirectUri);
    if ("accessToken" in response) {
      persistSession(response.accessToken, response.refreshToken, response.user, false);
      setState({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return null;
    }
    return response.message;
  }, []);

  const logout = useCallback(async () => {
    const accessToken = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();
    if (accessToken) {
      try {
        await authService.logout(accessToken, refreshToken);
      } catch {
        // Local cleanup must happen even if the network call fails.
      }
    }

    clearSession();
    navigate("/login", { replace: true });
  }, [clearSession, navigate]);

  const hasPermission = useCallback(
    (permissionCode: string) => state.user?.permissions.some((permission) => normalizeCode(permission) === normalizeCode(permissionCode)) ?? false,
    [state.user],
  );

  const hasAnyPermission = useCallback(
    (permissionCodes: string[]) => permissionCodes.some((permissionCode) => hasPermission(permissionCode)),
    [hasPermission],
  );

  const hasAllPermissions = useCallback(
    (permissionCodes: string[]) => permissionCodes.every((permissionCode) => hasPermission(permissionCode)),
    [hasPermission],
  );

  const hasRole = useCallback(
    (roleCode: string) => state.user?.roles.some((role) => normalizeCode(role) === normalizeCode(roleCode)) ?? false,
    [state.user],
  );

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    login,
    loginWithGoogleToken,
    loginWithGoogleCode,
    logout,
    refreshSessionFromMe,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  }), [state, login, loginWithGoogleToken, loginWithGoogleCode, logout, refreshSessionFromMe, hasPermission, hasAnyPermission, hasAllPermissions, hasRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
