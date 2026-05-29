import type { AuthUser } from "@/types/auth";

const ACCESS_TOKEN_KEY = "morosos.auth.accessToken";
const USER_KEY = "morosos.auth.user";
const STORAGE_KIND_KEY = "morosos.auth.storageKind";

type StorageKind = "local" | "session";

function getBrowserStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

export function getStoredAccessToken(): string | null {
  return getBrowserStorage("local")?.getItem(ACCESS_TOKEN_KEY)
    ?? getBrowserStorage("session")?.getItem(ACCESS_TOKEN_KEY)
    ?? null;
}

export function getStoredUser(): AuthUser | null {
  const raw = getBrowserStorage("local")?.getItem(USER_KEY)
    ?? getBrowserStorage("session")?.getItem(USER_KEY)
    ?? null;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function persistSession(accessToken: string, user: AuthUser, rememberMe?: boolean) {
  const targetKind: StorageKind = rememberMe ? "local" : "session";
  const otherKind: StorageKind = rememberMe ? "session" : "local";
  const target = getBrowserStorage(targetKind);
  const other = getBrowserStorage(otherKind);

  other?.removeItem(ACCESS_TOKEN_KEY);
  other?.removeItem(USER_KEY);
  other?.removeItem(STORAGE_KIND_KEY);

  target?.setItem(ACCESS_TOKEN_KEY, accessToken);
  target?.setItem(USER_KEY, JSON.stringify(user));
  target?.setItem(STORAGE_KIND_KEY, targetKind);
}

export function persistUser(user: AuthUser) {
  const kind: StorageKind = getBrowserStorage("local")?.getItem(ACCESS_TOKEN_KEY) ? "local" : "session";
  getBrowserStorage(kind)?.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredSession() {
  ["local", "session"].forEach((kind) => {
    const storage = getBrowserStorage(kind as StorageKind);
    storage?.removeItem(ACCESS_TOKEN_KEY);
    storage?.removeItem(USER_KEY);
    storage?.removeItem(STORAGE_KIND_KEY);
  });
}
