import React, { createContext, useContext, useState, ReactNode } from 'react';
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

interface AppUser {
  name: string | null;
  email: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  user: AppUser | null;
  resumes: Resume[];
  jobPostings: JobPosting[];
  optimizationResults: OptimizationResult[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void> | void;
  signup: (name: string, email: string, password: string) => Promise<void>;
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

function readAccessToken(): string {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('You must be logged in to perform this action.');
  }
  return token;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);

  // Resume section - Amarjot
  const [resumes, setResumes] = useState<Resume[]>([]);
  // Job posting section - Eren
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  // Optimization section - John
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);

  // Auth section - Alden
  const login = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsAuthenticated(true);
    setUser({ name: 'Demo User', email });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const signup = async (name: string, email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsAuthenticated(true);
    setUser({ name, email });
  };

  // Resume section - Amarjot
  const loadResumes = async () => {
    const data = await apiListResumes(readAccessToken());
    setResumes(data.map(mapResume));
  };

  const getResumeById = async (id: number): Promise<Resume> => {
    const data = await apiGetResume(id, readAccessToken());
    return mapResume(data);
  };

  const addResume = async (file: File) => {
    await apiUploadResume(file, readAccessToken());
    await loadResumes();
  };

  const deleteResume = async (id: number) => {
    await apiDeleteResume(id, readAccessToken());
    setResumes((prev) => prev.filter((resume) => resume.id !== id));
  };

  // Job posting section - Eren
  const loadJobPostings = async () => {
    const data = await apiListJobPostings(readAccessToken());
    setJobPostings(data.map(mapJobPosting));
  };

  const getJobPostingById = async (id: number): Promise<JobPosting> => {
    const data = await apiGetJobPosting(id, readAccessToken());
    return mapJobPosting(data);
  };

  const addJobPosting = async (url: string) => {
    await apiCreateJobPosting(url, readAccessToken());
    await loadJobPostings();
  };

  const deleteJobPosting = async (id: number) => {
    await apiDeleteJobPosting(id, readAccessToken());
    setJobPostings((prev: JobPosting[]) => prev.filter((j) => j.id !== id));
  };

  // Optimization section - John
  const runOptimization = async (resumeId: string, jobPostingId: string): Promise<OptimizationResult> => {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const resume = resumes.find(r => r.id.toString() === resumeId);
    const job = jobPostings.find(j => j.id === Number(jobPostingId));

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
        user,
        resumes,
        jobPostings,
        optimizationResults,
        login,
        logout,
        signup,
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
