export interface AuthUser {
  id: string;
  username: string;
  email: string;
  nombre: string;
  apellido?: string | null;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ForgotPasswordRequest {
  usernameOrEmail?: string;
  email?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetResponse {
  message: string;
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

export interface ApiErrorResponse {
  status?: number;
  code?: string;
  message?: string;
  details?: unknown;
  traceId?: string;
}

export class AuthError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  traceId?: string;

  constructor(message: string, error?: ApiErrorResponse) {
    super(message);
    this.name = "AuthError";
    this.status = error?.status;
    this.code = error?.code;
    this.details = error?.details;
    this.traceId = error?.traceId;
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}
