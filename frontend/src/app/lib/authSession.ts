/**
 * Browser-only helpers for access/refresh tokens and refresh coordination.
 * Dispatches window events so AppContext can stay in sync with apiRequest retries.
 */
import { API_BASE_URL } from './config';

const REFRESH_PATH = '/api/v1/auth/refresh';

export const AUTH_CLEARED_EVENT = 'resume-optimizer:auth-cleared';
export const AUTH_REFRESH_EVENT = 'resume-optimizer:auth-refresh';

export type LoginResponsePayload = {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    name: string | null;
    email: string;
    is_active: boolean;
  };
};

export function readStoredAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function readStoredRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

export function writeTokens(access: string, refresh: string): void {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

function clearStoredTokensOnly(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function clearSessionAndNotify(): void {
  clearStoredTokensOnly();
  window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
}

const AUTH_EXEMPT_PREFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
];

export function isAuthExemptPath(path: string): boolean {
  return AUTH_EXEMPT_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

/**
 * Refreshes access/refresh tokens using the stored refresh token.
 * On success: updates localStorage and dispatches AUTH_REFRESH_EVENT so AppContext can sync React state.
 * On failure: clears tokens and dispatches AUTH_CLEARED_EVENT.
 */
export async function tryRefreshAccessToken(): Promise<LoginResponsePayload | null> {
  const refreshToken = readStoredRefreshToken();
  if (!refreshToken) {
    clearSessionAndNotify();
    return null;
  }
  try {
    const res = await fetch(new URL(REFRESH_PATH, API_BASE_URL).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const text = await res.text();
    if (!res.ok) {
      clearSessionAndNotify();
      return null;
    }
    let data: LoginResponsePayload;
    try {
      data = JSON.parse(text) as LoginResponsePayload;
    } catch {
      clearSessionAndNotify();
      return null;
    }
    writeTokens(data.access_token, data.refresh_token);
    window.dispatchEvent(new CustomEvent<LoginResponsePayload>(AUTH_REFRESH_EVENT, { detail: data }));
    return data;
  } catch {
    clearSessionAndNotify();
    return null;
  }
}
