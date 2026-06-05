import { AuthError, type AdminUser, type AdminUserRequest, type ApiErrorResponse, type AuthUser, type ForgotPasswordRequest, type LoginRequest, type LoginResponse, type MessageResponse, type PasswordResetResponse, type PermissionOption, type RegisterRequest, type ResetPasswordRequest, type RoleOption } from "@/types/auth";

export { AuthError } from "@/types/auth";

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (!rawBody) return null;
  if (!contentType.includes("application/json")) return rawBody;

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

function normalizeError(response: Response, payload: unknown): ApiErrorResponse {
  const payloadObject = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const message =
    (typeof payloadObject.message === "string" && payloadObject.message) ||
    (typeof payloadObject.error === "string" && payloadObject.error) ||
    (typeof payload === "string" && payload.trim()) ||
    `${response.status} ${response.statusText}`.trim() ||
    "Error de autenticación";

  return {
    status: response.status,
    code: typeof payloadObject.code === "string" ? payloadObject.code : undefined,
    message,
    details: payloadObject.details,
    traceId: typeof payloadObject.traceId === "string" ? payloadObject.traceId : undefined,
  };
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${AUTH_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
  } catch {
    throw new AuthError("No se pudo conectar con el servicio de autenticación.");
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const error = normalizeError(response, payload);
    throw new AuthError(error.message ?? "Error de autenticación", error);
  }

  return payload as T;
}

export const authService = {
  login({ usernameOrEmail, password }: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ usernameOrEmail, password }),
    });
  },

  me(token: string): Promise<AuthUser> {
    return request<AuthUser>("/api/v1/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async logout(token: string): Promise<void> {
    await request<void>("/api/v1/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  forgotPassword(requestPayload: ForgotPasswordRequest): Promise<PasswordResetResponse> {
    return request<PasswordResetResponse>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(requestPayload),
    });
  },

  resetPassword(requestPayload: ResetPasswordRequest): Promise<PasswordResetResponse> {
    return request<PasswordResetResponse>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(requestPayload),
    });
  },

  register(requestPayload: RegisterRequest): Promise<MessageResponse> {
    return request<MessageResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(requestPayload),
    });
  },

  googleLogin(idToken: string): Promise<LoginResponse | MessageResponse> {
    return request<LoginResponse | MessageResponse>("/api/v1/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  },

  adminUsers(token: string): Promise<AdminUser[]> {
    return request<AdminUser[]>("/api/v1/admin/users", { method: "GET", headers: { Authorization: `Bearer ${token}` } });
  },

  adminCreateUser(token: string, payload: AdminUserRequest): Promise<AdminUser> {
    return request<AdminUser>("/api/v1/admin/users", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  },

  adminUpdateUser(token: string, userId: string, payload: AdminUserRequest): Promise<AdminUser> {
    return request<AdminUser>(`/api/v1/admin/users/${userId}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  },

  adminApproveUser(token: string, userId: string, payload: { roles: string[]; permissions: string[] }): Promise<AdminUser> {
    return request<AdminUser>(`/api/v1/admin/users/${userId}/approve`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  },

  adminRejectUser(token: string, userId: string, motivo: string): Promise<AdminUser> {
    return request<AdminUser>(`/api/v1/admin/users/${userId}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ motivo }) });
  },

  adminChangeStatus(token: string, userId: string, estado: string): Promise<AdminUser> {
    return request<AdminUser>(`/api/v1/admin/users/${userId}/status`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ estado }) });
  },

  adminRoles(token: string): Promise<RoleOption[]> {
    return request<RoleOption[]>("/api/v1/admin/roles", { method: "GET", headers: { Authorization: `Bearer ${token}` } });
  },

  adminPermissions(token: string): Promise<PermissionOption[]> {
    return request<PermissionOption[]>("/api/v1/admin/permissions", { method: "GET", headers: { Authorization: `Bearer ${token}` } });
  },
};

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
