const ACCESS_TOKEN_KEY = "morosos_access_token";

function canUseWebStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredAccessToken(): string | null {
  if (!canUseWebStorage()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function storeAccessToken(accessToken: string, rememberMe: boolean): void {
  if (!canUseWebStorage()) return;

  if (rememberMe) {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearStoredAccessToken(): void {
  if (!canUseWebStorage()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
