export interface AuthUser {
  id: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthErrorResponse {
  status?: number;
  code?: string;
  message?: string;
  details?: unknown;
  traceId?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}
