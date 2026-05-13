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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = API_BASE_URL.endsWith(API_PREFIX) && path.startsWith(API_PREFIX)
    ? path.slice(API_PREFIX.length) || "/"
    : path;
  const url = `${API_BASE_URL}${normalizedPath}`;
  const method = init?.method ?? "GET";
  console.debug("[apiClient] request:start", { url, method });

  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...init?.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const rawResponseText = await response.text();

  console.debug("[apiClient] request:response", {
    url,
    method,
    status: response.status,
    ok: response.ok,
    rawResponseText,
  });

  let payload: unknown = rawResponseText;
  if (isJson && rawResponseText) {
    try {
      payload = JSON.parse(rawResponseText);
      console.debug("[apiClient] request:parsed-json", { url, method, payload });
    } catch (error) {
      console.warn("[apiClient] request:json-parse-error", { url, method, error });
    }
  }

  if (!response.ok) {
    const message =
      (typeof payload === "object" && payload && "message" in payload && String(payload.message)) ||
      (typeof payload === "string" && payload.trim()) ||
      `${response.status} ${response.statusText}`.trim();
    throw new ApiError(`${response.status} ${message}`.trim(), response.status, { rawResponseText, payload });
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
