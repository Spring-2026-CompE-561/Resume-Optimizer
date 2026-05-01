"use client";

import { API_BASE_URL } from "@/lib/env";
import {
  clearStoredSession,
  readAccessToken,
  readRefreshToken,
  updateStoredAccessToken,
  updateStoredRefreshToken,
  updateStoredUser,
} from "@/lib/auth-storage";
import type {
  AuthUser,
  JobPostingRecord,
  LoginResponse,
  OptimizationRunRecord,
  ResumeRecord,
} from "@/lib/types";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildUrl(path: string) {
  return new URL(path, API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`).toString();
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string" && data) {
    return data;
  }

  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

async function refreshAccessToken() {
  const refreshToken = readRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const response = await fetch(buildUrl("auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await parseResponse(response);
  if (!response.ok) {
    clearStoredSession();
    return null;
  }

  const payload = data as LoginResponse;
  updateStoredAccessToken(payload.access_token);
  updateStoredRefreshToken(payload.refresh_token);
  updateStoredUser(payload.user);
  return payload.access_token;
}

async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  const accessToken = readAccessToken();

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  const data = await parseResponse(response);

  if (response.status === 401 && retry && !path.startsWith("auth/")) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Authorization", `Bearer ${nextAccessToken}`);
      return apiRequest<T>(path, { ...init, headers: retryHeaders }, false);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(data, `Request failed with status ${response.status}`),
      response.status,
    );
  }

  return data as T;
}

export async function login(email: string, password: string) {
  return apiRequest<LoginResponse>("auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  const refreshToken = readRefreshToken();
  if (!refreshToken) {
    clearStoredSession();
    return;
  }

  try {
    await apiRequest("auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } finally {
    clearStoredSession();
  }
}

export async function fetchMe() {
  return apiRequest<AuthUser>("auth/me");
}

export async function fetchResumes() {
  return apiRequest<ResumeRecord[]>("resumes");
}

export async function fetchJobPostings() {
  return apiRequest<JobPostingRecord[]>("job-postings");
}

export async function fetchOptimizations() {
  return apiRequest<OptimizationRunRecord[]>("optimize");
}
