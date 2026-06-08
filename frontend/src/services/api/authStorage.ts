import type { AuthUser } from "@/types/auth";

const ACCESS_TOKEN_KEY = "morosos.auth.accessToken";
const REFRESH_TOKEN_KEY = "morosos.auth.refreshToken";
const USER_KEY = "morosos.auth.user";
const STORAGE_KIND_KEY = "morosos.auth.storageKind";
const LEGACY_ACCESS_TOKEN_KEY = "morosos_access_token";

type StorageKind = "local" | "session";

function getBrowserStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

function getPreferredStorageKind(): StorageKind {
  const local = getBrowserStorage("local");
  const session = getBrowserStorage("session");
  const storedKind = local?.getItem(STORAGE_KIND_KEY) ?? session?.getItem(STORAGE_KIND_KEY);

  if (storedKind === "local" || storedKind === "session") return storedKind;
  if (local?.getItem(ACCESS_TOKEN_KEY)) return "local";
  return "session";
}

export function getStoredAccessToken(): string | null {
  return getBrowserStorage("local")?.getItem(ACCESS_TOKEN_KEY)
    ?? getBrowserStorage("session")?.getItem(ACCESS_TOKEN_KEY)
    ?? null;
}

export function setStoredAccessToken(token: string, rememberMe?: boolean): void {
  const targetKind: StorageKind = rememberMe ? "local" : "session";
  const otherKind: StorageKind = rememberMe ? "session" : "local";
  const target = getBrowserStorage(targetKind);
  const other = getBrowserStorage(otherKind);

  other?.removeItem(ACCESS_TOKEN_KEY);
  other?.removeItem(REFRESH_TOKEN_KEY);
  other?.removeItem(USER_KEY);
  other?.removeItem(STORAGE_KIND_KEY);
  other?.removeItem(LEGACY_ACCESS_TOKEN_KEY);

  target?.setItem(ACCESS_TOKEN_KEY, token);
  target?.setItem(STORAGE_KIND_KEY, targetKind);
  target?.removeItem(LEGACY_ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return getBrowserStorage("local")?.getItem(REFRESH_TOKEN_KEY)
    ?? getBrowserStorage("session")?.getItem(REFRESH_TOKEN_KEY)
    ?? null;
}

export function setStoredRefreshToken(token: string, rememberMe?: boolean): void {
  const targetKind: StorageKind = rememberMe ? "local" : "session";
  const otherKind: StorageKind = rememberMe ? "session" : "local";
  getBrowserStorage(otherKind)?.removeItem(REFRESH_TOKEN_KEY);
  getBrowserStorage(targetKind)?.setItem(REFRESH_TOKEN_KEY, token);
  getBrowserStorage(targetKind)?.setItem(STORAGE_KIND_KEY, targetKind);
}

export function clearStoredAuth(): void {
  (["local", "session"] as StorageKind[]).forEach((kind) => {
    const storage = getBrowserStorage(kind);
    storage?.removeItem(ACCESS_TOKEN_KEY);
    storage?.removeItem(REFRESH_TOKEN_KEY);
    storage?.removeItem(USER_KEY);
    storage?.removeItem(STORAGE_KIND_KEY);
    storage?.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  });
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

export function setStoredUser(user: AuthUser, rememberMe?: boolean): void {
  const targetKind = rememberMe === undefined ? getPreferredStorageKind() : rememberMe ? "local" : "session";
  const otherKind: StorageKind = targetKind === "local" ? "session" : "local";

  getBrowserStorage(otherKind)?.removeItem(USER_KEY);
  getBrowserStorage(targetKind)?.setItem(USER_KEY, JSON.stringify(user));
  getBrowserStorage(targetKind)?.setItem(STORAGE_KIND_KEY, targetKind);
}

export function clearStoredUser(): void {
  (["local", "session"] as StorageKind[]).forEach((kind) => {
    getBrowserStorage(kind)?.removeItem(USER_KEY);
  });
}

export function persistSession(accessToken: string, refreshToken: string, user: AuthUser, rememberMe?: boolean): void {
  setStoredAccessToken(accessToken, rememberMe);
  setStoredRefreshToken(refreshToken, rememberMe);
  setStoredUser(user, rememberMe);
}

export const persistUser = setStoredUser;
export const clearStoredSession = clearStoredAuth;
