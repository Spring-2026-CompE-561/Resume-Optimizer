/** Typed calls to `/api/v1/auth/*` (Alden). */
import { apiRequest } from '../lib/api';

const AUTH = '/api/v1/auth';

export interface AuthUserResponse {
  id: number;
  name: string | null;
  email: string;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUserResponse;
}

export interface RegisterPayload {
  name?: string | null;
  email: string;
  password: string;
}

export function register(payload: RegisterPayload): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(`${AUTH}/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password,
    }),
  });
}

export function login(payload: { email: string; password: string }): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(`${AUTH}/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
}

export function getMe(accessToken: string): Promise<AuthUserResponse> {
  return apiRequest<AuthUserResponse>(`${AUTH}/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function logout(refreshToken: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`${AUTH}/logout`, {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function refresh(refreshToken: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(`${AUTH}/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export interface ForgotPasswordResponse {
  message: string;
  reset_token?: string;
}

export function forgotPassword(payload: { email: string }): Promise<ForgotPasswordResponse> {
  return apiRequest<ForgotPasswordResponse>(`${AUTH}/forgot-password`, {
    method: 'POST',
    body: JSON.stringify({ email: payload.email }),
  });
}

export function resetPassword(payload: { token: string; newPassword: string }): Promise<{
  message: string;
}> {
  return apiRequest(`${AUTH}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ token: payload.token, new_password: payload.newPassword }),
  });
}
