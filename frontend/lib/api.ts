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
  PaginatedResponse,
  ResumeRecord,
} from "@/lib/types";

type PaginationParams = {
  page?: number;
  limit?: number;
};

const API_MAX_PAGE_LIMIT = 50;

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

export function buildApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return buildUrl(path);
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

export async function register(input: { name?: string; email: string; password: string }) {
  return apiRequest<LoginResponse>("auth/register", {
    method: "POST",
    body: JSON.stringify(input),
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
  return fetchAllPages<ResumeRecord>("resumes");
}

export async function fetchResumesPage(params: PaginationParams = {}) {
  return apiRequest<PaginatedResponse<ResumeRecord>>(buildPaginatedPath("resumes", params));
}

export async function fetchResume(resumeId: number) {
  return apiRequest<ResumeRecord>(`resumes/${resumeId}`);
}

export async function fetchJobPostings() {
  return fetchAllPages<JobPostingRecord>("job-postings");
}

export async function fetchJobPostingsPage(params: PaginationParams = {}) {
  return apiRequest<PaginatedResponse<JobPostingRecord>>(buildPaginatedPath("job-postings", params));
}

export async function fetchJobPosting(jobPostingId: number) {
  return apiRequest<JobPostingRecord>(`job-postings/${jobPostingId}`);
}

export async function fetchOptimizations() {
  return fetchAllPages<OptimizationRunRecord>("optimize");
}

export async function fetchOptimizationsPage(params: PaginationParams = {}) {
  return apiRequest<PaginatedResponse<OptimizationRunRecord>>(buildPaginatedPath("optimize", params));
}

export async function fetchOptimization(optimizationRunId: number) {
  return apiRequest<OptimizationRunRecord>(`optimize/${optimizationRunId}`);
}

export async function deleteOptimization(optimizationRunId: number) {
  return apiRequest<null>(`optimize/${optimizationRunId}`, {
    method: "DELETE",
  });
}

export async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<ResumeRecord>("resumes", {
    method: "POST",
    body: formData,
  });
}

type ManualJobPostingInput = {
  title?: string;
  company?: string;
  description: string;
  source_url?: never;
};

type UrlJobPostingInput = {
  source_url: string;
  title?: string;
  company?: never;
  description?: never;
};

export async function createJobPosting(input: ManualJobPostingInput | UrlJobPostingInput) {
  return apiRequest<JobPostingRecord>("job-postings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteResume(resumeId: number) {
  return apiRequest<{ message: string }>(`resumes/${resumeId}`, {
    method: "DELETE",
  });
}

export async function deleteJobPosting(jobPostingId: number) {
  return apiRequest<null>(`job-postings/${jobPostingId}`, {
    method: "DELETE",
  });
}

export async function runOptimization(input: {
  resume_id: number;
  job_posting_id: number;
  customization_notes?: string;
}) {
  return apiRequest<OptimizationRunRecord>("optimize", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function regenerateOptimization(
  optimizationRunId: number,
  input: { customization_notes?: string },
) {
  return apiRequest<OptimizationRunRecord>(`optimize/${optimizationRunId}/regenerate`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

function buildPaginatedPath(path: string, params: PaginationParams) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }
  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

async function fetchAllPages<T>(path: string) {
  const firstPage = await apiRequest<PaginatedResponse<T>>(
    buildPaginatedPath(path, { page: 1, limit: API_MAX_PAGE_LIMIT }),
  );
  const items = [...firstPage.items];

  for (let page = 2; page <= firstPage.pagination.pages; page += 1) {
    const nextPage = await apiRequest<PaginatedResponse<T>>(
      buildPaginatedPath(path, { page, limit: API_MAX_PAGE_LIMIT }),
    );
    items.push(...nextPage.items);
  }

  return items;
}
