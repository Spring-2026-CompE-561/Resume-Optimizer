import { apiRequest } from '../lib/api';

export interface KeywordOut {
  id: number;
  term: string;
  category: string | null;
  significance_score: number;
}

export interface JobPostingSkillOut {
  id: number;
  skill_name: string;
}

export interface JobPostingOut {
  id: number;
  owner_id: number;
  source_url: string;
  title: string | null;
  company: string | null;
  description: string | null;
  created_at: string;
  keywords: KeywordOut[];
  skills: JobPostingSkillOut[];
}

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export function listJobPostings(accessToken: string): Promise<JobPostingOut[]> {
  return apiRequest('/api/v1/job-postings', {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
}

export function createJobPosting(
  sourceUrl: string,
  accessToken: string,
): Promise<JobPostingOut> {
  return apiRequest('/api/v1/job-postings', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ source_url: sourceUrl }),
  });
}

export function getJobPosting(
  id: number,
  accessToken: string,
): Promise<JobPostingOut> {
  return apiRequest(`/api/v1/job-postings/${id}`, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
}

export function deleteJobPosting(
  id: number,
  accessToken: string,
): Promise<void> {
  return apiRequest(`/api/v1/job-postings/${id}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
}
