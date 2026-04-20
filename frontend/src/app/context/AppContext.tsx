import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  listJobPostings as apiListJobPostings,
  createJobPosting as apiCreateJobPosting,
  getJobPosting as apiGetJobPosting,
  deleteJobPosting as apiDeleteJobPosting,
  type JobPostingOut,
} from '../services/jobPostingApi';

export interface Resume {
  id: string;
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
  user: { name: string; email: string } | null;
  resumes: Resume[];
  jobPostings: JobPosting[];
  optimizationResults: OptimizationResult[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
  addResume: (file: File) => Promise<void>;
  deleteResume: (id: string) => void;
  addJobPosting: (url: string) => Promise<void>;
  deleteJobPosting: (id: number) => Promise<void>;
  loadJobPostings: () => Promise<void>;
  getJobPostingById: (id: number) => Promise<JobPosting>;
  runOptimization: (resumeId: string, jobPostingId: string) => Promise<OptimizationResult>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data
const mockResumes: Resume[] = [
  {
    id: '1',
    fileName: 'Remington_Steele_Resume.pdf',
    uploadDate: '2026-03-15',
    fileType: 'PDF',
    parsedText: 'Remington Steele\nSoftware Engineer\n\nExperience:\n- 5 years in full-stack development\n- Proficient in Python, JavaScript, React\n- Experience with REST APIs and microservices\n- Docker and CI/CD pipelines\n\nEducation:\nB.S. Computer Science, MIT',
    preview: 'Remington Steele - Software Engineer with 5 years in full-stack development...',
  },
  {
    id: '2',
    fileName: 'Software_Engineer_Resume.docx',
    uploadDate: '2026-03-20',
    fileType: 'DOCX',
    parsedText: 'Jane Developer\nSenior Software Engineer\n\nSkills:\n- Backend development with Python, FastAPI\n- Database design with PostgreSQL\n- API development and testing\n- Cloud infrastructure (AWS)\n\nExperience:\n- Built scalable APIs serving 1M+ users\n- Implemented automated testing pipelines',
    preview: 'Jane Developer - Senior Software Engineer specializing in backend development...',
  },
  {
    id: '3',
    fileName: 'Backend_API_Resume.pdf',
    uploadDate: '2026-04-01',
    fileType: 'PDF',
    parsedText: 'Alex Martinez\nBackend Engineer\n\nCore Competencies:\n- Python, FastAPI, SQLAlchemy\n- RESTful API design\n- Docker containerization\n- Unit and integration testing\n- Web scraping and data processing\n\nProjects:\n- Developed high-performance API serving 500k requests/day\n- Implemented CI/CD pipelines with GitHub Actions',
    preview: 'Alex Martinez - Backend Engineer with expertise in Python and FastAPI...',
  },
];

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
  return localStorage.getItem('accessToken') ?? '';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [resumes, setResumes] = useState<Resume[]>(mockResumes);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);

  const login = async (email: string, password: string) => {
    // Mock login - in real app this would call an API
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsAuthenticated(true);
    setUser({ name: 'Demo User', email });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const signup = async (name: string, email: string, password: string) => {
    // Mock signup
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsAuthenticated(true);
    setUser({ name, email });
  };

  const addResume = async (file: File) => {
    // Mock file upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newResume: Resume = {
      id: Date.now().toString(),
      fileName: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      fileType: file.name.split('.').pop()?.toUpperCase() || 'PDF',
      parsedText: 'Mock parsed text from ' + file.name,
      preview: 'Preview of ' + file.name,
    };
    setResumes([...resumes, newResume]);
  };

  const deleteResume = (id: string) => {
    setResumes(resumes.filter(r => r.id !== id));
  };

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

  const runOptimization = async (resumeId: string, jobPostingId: string): Promise<OptimizationResult> => {
    // Mock optimization process
    await new Promise(resolve => setTimeout(resolve, 2000));

    const resume = resumes.find(r => r.id === resumeId);
    const job = jobPostings.find(j => j.id === jobPostingId);

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
