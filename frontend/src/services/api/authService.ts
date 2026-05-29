import { AuthError, type ApiErrorResponse, type AuthUser, type LoginRequest, type LoginResponse } from "@/types/auth";

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
  login(payload: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
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

  async forgotPassword(): Promise<{ message: string }> {
    return { message: "Si la cuenta existe, enviaremos instrucciones para restablecer la contraseña." };
  },

  async resetPassword(): Promise<{ message: string }> {
    return { message: "Restablecimiento de contraseña pendiente de integración." };
  },

  async googleLogin(): Promise<{ message: string }> {
    return { message: "Inicio con Google pendiente de integración." };
  },
};

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
