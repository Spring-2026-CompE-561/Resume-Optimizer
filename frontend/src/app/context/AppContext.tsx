import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  listJobPostings as apiListJobPostings,
  createJobPosting as apiCreateJobPosting,
  getJobPosting as apiGetJobPosting,
  deleteJobPosting as apiDeleteJobPosting,
  type JobPostingOut,
} from '../services/jobPostingApi';
import {
  listResumes as apiListResumes,
  uploadResume as apiUploadResume,
  getResume as apiGetResume,
  deleteResume as apiDeleteResume,
  type ResumeResponse,
} from '../services/resumeApi';
import * as authApi from '../services/authApi';
import {
  AUTH_CLEARED_EVENT,
  AUTH_REFRESH_EVENT,
  readStoredAccessToken,
  readStoredRefreshToken,
  tryRefreshAccessToken,
  type LoginResponsePayload,
} from '../lib/authSession';

export interface AuthUser {
  id: number;
  name: string | null;
  email: string;
  isActive: boolean;
}

export interface Resume {
  id: number;
  fileName: string;
  uploadDate: string;
  fileType: string;
  parsedText: string;
  preview: string;
}

export interface JobPosting {
  id: number;
  title: string;
  company: string;
  sourceUrl: string;
  description: string;
  keywords: string[];
  addedDate: string;
}

export interface OptimizationResult {
  id: string;
  resumeId: string;
  jobPostingId: string;
  optimizedText: string;
  suggestions: string[];
  timestamp: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  sessionReady: boolean;
  user: AuthUser | null;
  /** Current access token for `apiRequest` / Remington; null if logged out. */
  getAccessToken: () => string | null;
  resumes: Resume[];
  jobPostings: JobPosting[];
  optimizationResults: OptimizationResult[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  addResume: (file: File) => Promise<void>;
  deleteResume: (id: number) => Promise<void>;
  loadResumes: () => Promise<void>;
  getResumeById: (id: number) => Promise<Resume>;
  addJobPosting: (url: string) => Promise<void>;
  deleteJobPosting: (id: number) => Promise<void>;
  loadJobPostings: () => Promise<void>;
  getJobPostingById: (id: number) => Promise<JobPosting>;
  runOptimization: (resumeId: string, jobPostingId: string) => Promise<OptimizationResult>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapUser(data: authApi.AuthUserResponse): AuthUser {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    isActive: data.is_active,
  };
}

function mapResume(data: ResumeResponse): Resume {
  const parsedText = data.parsed_text ?? '';
  const previewText = parsedText.trim();

  let fileType = data.mime_type;
  if (data.mime_type === 'application/pdf') {
    fileType = 'PDF';
  } else if (
    data.mime_type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    fileType = 'DOCX';
  }

  return {
    id: data.id,
    fileName: data.file_name,
    uploadDate: new Date(data.created_at).toISOString().split('T')[0],
    fileType,
    parsedText,
    preview:
      previewText.length <= 140
        ? previewText
        : `${previewText.slice(0, 140).trim()}...`,
  };
}

function mapJobPosting(data: JobPostingOut): JobPosting {
  return {
    id: data.id,
    title: data.title ?? 'Untitled job posting',
    company: data.company ?? 'Unknown company',
    sourceUrl: data.source_url,
    description: data.description ?? '',
    keywords: data.keywords.map((item) => item.term),
    addedDate: new Date(data.created_at).toISOString().split('T')[0],
  };
}

function readAccessTokenOrThrow(): string {
  const token = readStoredAccessToken();
  if (!token) {
    throw new Error('You must be logged in to perform this action.');
  }
  return token;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Resume section - Amarjot
  const [resumes, setResumes] = useState<Resume[]>([]);
  // Job posting section - Eren
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  // Optimization section - John
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);

  const getAccessToken = useCallback((): string | null => readStoredAccessToken(), []);

  const persistFromLoginResponse = useCallback((res: authApi.LoginResponse) => {
    localStorage.setItem('accessToken', res.access_token);
    localStorage.setItem('refreshToken', res.refresh_token);
    setUser(mapUser(res.user));
    setIsAuthenticated(true);
  }, []);

  const clearAuthState = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Sync React state when the shared `api` layer refreshes tokens or the session is cleared.
  useEffect(() => {
    const onCleared = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    const onRefreshed = (e: Event) => {
      const d = (e as CustomEvent<LoginResponsePayload>).detail;
      if (d?.user) {
        setUser(mapUser(d.user));
        setIsAuthenticated(true);
      }
    };
    window.addEventListener(AUTH_CLEARED_EVENT, onCleared);
    window.addEventListener(AUTH_REFRESH_EVENT, onRefreshed);
    return () => {
      window.removeEventListener(AUTH_CLEARED_EVENT, onCleared);
      window.removeEventListener(AUTH_REFRESH_EVENT, onRefreshed);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const done = () => {
      if (!cancelled) {
        setSessionReady(true);
      }
    };

    const bootstrap = async () => {
      const access = readStoredAccessToken();
      const storedRefresh = readStoredRefreshToken();

      if (!access && !storedRefresh) {
        done();
        return;
      }

      const trySessionRefresh = async () => {
        if (!readStoredRefreshToken()) {
          return false;
        }
        const res = await tryRefreshAccessToken();
        if (cancelled) {
          return true;
        }
        return res !== null;
      };

      try {
        if (access) {
          const me = await authApi.getMe(access);
          if (cancelled) {
            return;
          }
          setUser(mapUser(me));
          setIsAuthenticated(true);
        } else {
          const ok = await trySessionRefresh();
          if (!ok) {
            clearAuthState();
          }
        }
      } catch {
        if (cancelled) {
          return;
        }
        try {
          const ok = await trySessionRefresh();
          if (!ok) {
            clearAuthState();
          }
        } catch {
          clearAuthState();
        }
      } finally {
        done();
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [clearAuthState]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    persistFromLoginResponse(res);
  };

  const logout = async () => {
    const refreshToken = readStoredRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // still clear local session
      }
    }
    clearAuthState();
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    persistFromLoginResponse(res);
  };

  const forgotPassword = async (email: string) => {
    await authApi.forgotPassword({ email });
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await authApi.resetPassword({ token, newPassword });
  };

  // Resume section - Amarjot
  const loadResumes = async () => {
    const data = await apiListResumes(readAccessTokenOrThrow());
    setResumes(data.map(mapResume));
  };

  const getResumeById = async (id: number): Promise<Resume> => {
    const data = await apiGetResume(id, readAccessTokenOrThrow());
    return mapResume(data);
  };

  const addResume = async (file: File) => {
    await apiUploadResume(file, readAccessTokenOrThrow());
    await loadResumes();
  };

  const deleteResume = async (id: number) => {
    await apiDeleteResume(id, readAccessTokenOrThrow());
    setResumes((prev) => prev.filter((resume) => resume.id !== id));
  };

  // Job posting section - Eren
  const loadJobPostings = async () => {
    const data = await apiListJobPostings(readAccessTokenOrThrow());
    setJobPostings(data.map(mapJobPosting));
  };

  const getJobPostingById = async (id: number): Promise<JobPosting> => {
    const data = await apiGetJobPosting(id, readAccessTokenOrThrow());
    return mapJobPosting(data);
  };

  const addJobPosting = async (url: string) => {
    await apiCreateJobPosting(url, readAccessTokenOrThrow());
    await loadJobPostings();
  };

  const deleteJobPosting = async (id: number) => {
    await apiDeleteJobPosting(id, readAccessTokenOrThrow());
    setJobPostings((prev: JobPosting[]) => prev.filter((j) => j.id !== id));
  };

  // Optimization section - John
  const runOptimization = async (
    resumeId: string,
    jobPostingId: string,
  ): Promise<OptimizationResult> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const resume = resumes.find((r) => r.id.toString() === resumeId);
    const job = jobPostings.find((j) => j.id === Number(jobPostingId));

    const result: OptimizationResult = {
      id: Date.now().toString(),
      resumeId,
      jobPostingId,
      optimizedText: `Optimized version of ${resume?.fileName} for ${job?.title}:\n\n${resume?.parsedText}\n\n[Optimized to highlight: ${job?.keywords.join(', ')}]`,
      suggestions: [
        `Emphasize experience with ${job?.keywords[0]} in the summary section`,
        `Add specific project examples demonstrating ${job?.keywords[1]} skills`,
        `Quantify achievements related to ${job?.keywords[2]} to show measurable impact`,
        'Align technical skills section with job requirements',
        'Tailor the professional summary to match the company culture',
      ],
      timestamp: new Date().toISOString(),
    };

    setOptimizationResults([...optimizationResults, result]);
    return result;
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        sessionReady,
        user,
        getAccessToken,
        resumes,
        jobPostings,
        optimizationResults,
        login,
        logout,
        signup,
        forgotPassword,
        resetPassword,
        addResume,
        deleteResume,
        loadResumes,
        getResumeById,
        addJobPosting,
        deleteJobPosting,
        loadJobPostings,
        getJobPostingById,
        runOptimization,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
