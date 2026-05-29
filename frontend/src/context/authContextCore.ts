import { createContext } from "react";
import type { AuthState, LoginRequest } from "@/types/auth";

export interface AuthContextValue extends AuthState {
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSessionFromMe: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasRole: (roleCode: string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
