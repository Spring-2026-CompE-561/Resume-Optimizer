import { API_BASE_URL } from './config';

type ApiError = Error & { status?: number };

function buildUrl(path: string) {
  return new URL(path, API_BASE_URL).toString();
}

function parseResponseBody(text: string) {
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

export function createAuthHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function apiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  const text = await response.text();
  const data = parseResponseBody(text);

  if (!response.ok) {
    if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
      throw createError(data.detail, response.status);
    }

    if (typeof data === 'string' && data) {
      throw createError(data, response.status);
    }

    throw createError(`Request failed with status ${response.status}`, response.status);
  }

  return data;
}
