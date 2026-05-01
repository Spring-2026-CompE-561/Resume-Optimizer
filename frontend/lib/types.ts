export interface AuthUser {
  id: number;
  name: string | null;
  email: string;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface ResumeRecord {
  id: number;
  user_id: number;
  file_name: string;
  mime_type: string;
  storage_path: string;
  parsed_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobKeyword {
  id: number;
  term: string;
  category: string | null;
  significance_score: number;
}

export interface JobSkill {
  id: number;
  skill_name: string;
}

export interface JobPostingRecord {
  id: number;
  owner_id: number;
  source_url: string | null;
  title: string | null;
  company: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  keywords: JobKeyword[];
  skills: JobSkill[];
}

export interface OptimizationRunRecord {
  id: number;
  user_id: number;
  resume_id: number | null;
  job_posting_id: number | null;
  optimized_resume_text: string;
  latex_content: string;
  suggestions: string[];
  job_keywords: string[];
  customization_notes: string | null;
  target_job_title: string | null;
  target_company: string | null;
  provider_name: string | null;
  latency_ms: number | null;
  pdf_download_url: string | null;
  created_at: string;
}
