import type {
  AuthErrorResponse,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
} from "@/types/auth";

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";
const AUTH_API_PREFIX = "/api/v1/auth";

export class AuthServiceError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  traceId?: string;

  constructor(message: string, status: number, response?: AuthErrorResponse) {
    super(message);
    this.name = "AuthServiceError";
    this.status = status;
    this.code = response?.code;
    this.details = response?.details;
    this.traceId = response?.traceId;
    Object.setPrototypeOf(this, AuthServiceError.prototype);
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();
  if (!raw) return null;
  if (!contentType.includes("application/json")) return raw;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildAuthErrorMessage(status: number, payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload && "message" in payload && typeof payload.message === "string") {
    return payload.message;
  }
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  return fallback || `Error de autenticación (${status})`;
}

async function authRequest<T>(path: string, init?: RequestInit, accessToken?: string | null): Promise<T> {
  const response = await fetch(`${AUTH_BASE_URL}${AUTH_API_PREFIX}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  const payload = await parseResponse(response);
  if (!response.ok) {
    const errorPayload = typeof payload === "object" && payload ? payload as AuthErrorResponse : undefined;
    throw new AuthServiceError(
      buildAuthErrorMessage(response.status, payload, response.statusText),
      response.status,
      errorPayload,
    );
  }

  return payload as T;
}

export const authService = {
  login: ({ usernameOrEmail, password }: LoginRequest) =>
    authRequest<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ usernameOrEmail, password }),
    }),

  me: (accessToken: string) => authRequest<AuthUser>("/me", { method: "GET" }, accessToken),

  logout: (accessToken: string) => authRequest<void>("/logout", { method: "POST", body: JSON.stringify({}) }, accessToken),

  forgotPassword: async (_payload: ForgotPasswordRequest) => {
    throw new AuthServiceError("Recuperación de contraseña pendiente de integración.", 501);
  },

  resetPassword: async (_payload: ResetPasswordRequest) => {
    throw new AuthServiceError("Restablecimiento de contraseña pendiente de integración.", 501);
  },

  googleLogin: async () => {
    throw new AuthServiceError("Inicio con Google pendiente de integración.", 501);
  },
};
