import { clearStoredAccessToken, getStoredAccessToken } from "@/lib/authStorage";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8081/api/v1";
const API_PREFIX = "/api/v1";

export const USE_API = import.meta.env.VITE_USE_API === "true";

export type QueryValue = string | number | boolean | null | undefined;

export function buildQueryParams(params?: Record<string, QueryValue>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    search.set(k, String(v));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

function redirectToLoginAfterUnauthorized() {
  if (typeof window === "undefined") return;
  const currentPath = `${window.location.pathname}${window.location.search}`;

  if (window.location.pathname !== "/login") {
    window.location.assign(`/login?from=${encodeURIComponent(currentPath)}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = API_BASE_URL.endsWith(API_PREFIX) && path.startsWith(API_PREFIX)
    ? path.slice(API_PREFIX.length) || "/"
    : path;
  const url = `${API_BASE_URL}${normalizedPath}`;
  const token = getStoredAccessToken();
  const headers = new Headers(init?.headers);

  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const rawResponseText = await response.text();

  let payload: unknown = rawResponseText;
  if (isJson && rawResponseText) {
    try {
      payload = JSON.parse(rawResponseText);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[apiClient] No se pudo parsear una respuesta JSON.", { status: response.status, error });
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAccessToken();
      redirectToLoginAfterUnauthorized();
    }

    if (response.status === 403) {
      throw new ApiError("No tenés permisos para realizar esta acción.", response.status);
    }

    const message =
      (typeof payload === "object" && payload && "message" in payload && String(payload.message)) ||
      (typeof payload === "string" && payload.trim()) ||
      `${response.status} ${response.statusText}`.trim();
    throw new ApiError(`${response.status} ${message}`.trim(), response.status);
  }

  return payload as T;
}

export const apiClient = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  put: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  patch: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: <T = any>(path: string) => request<T>(path, { method: "DELETE" }),
};
