import { apiRequest } from '../lib/api';

export interface ResumeResponse {
  id: number;
  file_name: string;
  mime_type: string;
  parsed_text: string | null;
  created_at: string;
}

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export function listResumes(accessToken: string): Promise<ResumeResponse[]> {
  return apiRequest('/api/v1/resumes', {
    method: 'GET',
    headers: authHeaders(accessToken),
  }) as Promise<ResumeResponse[]>;
}

export function uploadResume(
  file: File,
  accessToken: string,
): Promise<ResumeResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest('/api/v1/resumes', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: formData,
  }) as Promise<ResumeResponse>;
}

export function getResume(
  id: number,
  accessToken: string,
): Promise<ResumeResponse> {
  return apiRequest(`/api/v1/resumes/${id}`, {
    method: 'GET',
    headers: authHeaders(accessToken),
  }) as Promise<ResumeResponse>;
}

export function deleteResume(
  id: number,
  accessToken: string,
): Promise<void> {
  return apiRequest(`/api/v1/resumes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  }) as Promise<void>;
}