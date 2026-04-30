/**
 * Shared fetch wrapper for the backend API (Remington baseline + 401 refresh retry).
 */
import {
  isAuthExemptPath,
  readStoredAccessToken,
  tryRefreshAccessToken,
} from './authSession';
import { API_BASE_URL } from './config';

type ApiError = Error & { status?: number };

function buildUrl(path: string): string {
  return new URL(path, API_BASE_URL).toString();
}

function parseResponseBody(text: string): unknown {
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function createError(message: string, status: number): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  return error;
}

function throwHttpError(status: number, data: unknown): never {
  if (data && typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === 'string') {
      throw createError(detail, status);
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string } | undefined;
      if (first && typeof first.msg === 'string') {
        throw createError(first.msg, status);
      }
    }
  }
  if (typeof data === 'string' && data) {
    throw createError(data, status);
  }
  throw createError(`Request failed with status ${status}`, status);
}

export function createAuthHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

/**
 * Shared API helper. On 401 (except auth paths), attempts one refresh + retry so the app can recover from an expired access token.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retryAfterRefresh = false,
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (
    !isFormData &&
    init.body !== undefined &&
    typeof init.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  const text = await response.text();
  const data = parseResponseBody(text);

  if (response.status === 401 && !retryAfterRefresh && !isAuthExemptPath(path)) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(init.headers);
      const token = readStoredAccessToken();
      if (token) {
        retryHeaders.set('Authorization', `Bearer ${token}`);
      }
      return apiRequest<T>(path, { ...init, headers: retryHeaders }, true);
    }
  }

  if (!response.ok) {
    throwHttpError(response.status, data);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return data as T;
}
