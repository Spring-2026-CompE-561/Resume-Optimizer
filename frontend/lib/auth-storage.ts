import type { AuthUser, LoginResponse } from "@/lib/types";

const ACCESS_TOKEN_KEY = "resume-optimizer.access-token";
const REFRESH_TOKEN_KEY = "resume-optimizer.refresh-token";
const AUTH_USER_KEY = "resume-optimizer.auth-user";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readAccessToken() {
  if (!canUseStorage()) {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function readRefreshToken() {
  if (!canUseStorage()) {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function readStoredUser(): AuthUser | null {
  if (!canUseStorage()) {
    return null;
  }
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function storeSession(payload: LoginResponse) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
}

export function updateStoredAccessToken(accessToken: string) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function updateStoredRefreshToken(refreshToken: string) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function updateStoredUser(user: AuthUser) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredSession() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}
