export interface AuthUser {
  id: string;
  username: string;
  email: string;
  nombre: string;
  apellido?: string | null;
  roles: string[];
  permissions: string[];
  authVersion: number;
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
  refreshToken: string;
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


export interface RegisterRequest {
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  password: string;
  confirmPassword: string;
}

export interface MessageResponse {
  code: string;
  message: string;
}

export type UserStatus = "PENDIENTE_APROBACION" | "ACTIVO" | "INACTIVO" | "RECHAZADO";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  estado: UserStatus;
  emailVerificado: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserRequest {
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  estado: UserStatus;
  roles: string[];
  permissions: string[];
}

export interface RoleOption {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  systemRole: boolean;
  permissions: string[];
}

export interface PermissionOption {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  modulo: string;
  recurso: string;
  accion: string;
  activo: boolean;
}

export interface RoleRequest {
  codigo: string;
  nombre: string;
  descripcion: string;
  permissions: string[];
}

export interface AuthAuditItem {
  id: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  actorId?: string | null;
  traceId?: string | null;
  requestPath?: string | null;
  oldValues?: string | null;
  newValues?: string | null;
  createdAt: string;
}
