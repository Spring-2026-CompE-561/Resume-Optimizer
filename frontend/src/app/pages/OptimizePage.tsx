import React, { useState } from 'react';
import { Link } from 'react-router';
import { AuthLayout } from '../components/AuthLayout';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { FileText, Briefcase, Sparkles, Copy, CheckCircle, Loader2 } from 'lucide-react';
import type { OptimizationResult } from '../context/AppContext';

export function OptimizePage() {
  const { resumes, jobPostings, runOptimization } = useApp();
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOptimize = async () => {
    if (!selectedResumeId || !selectedJobId) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const optimization = await runOptimization(selectedResumeId, selectedJobId);
      setResult(optimization);
    } catch (err: any) {
      if (err?.status === 429) {
        setError('AI provider rate limit exceeded, please try again later');
      } else if (err?.detail) {
        setError(err.detail);
      } else {
        setError(err?.message || 'Optimization failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.optimizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canOptimize = selectedResumeId && selectedJobId && !loading;

  return (
    <AuthLayout title="Optimize Studio">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-[20px] p-6 shadow-md">
          <h2 className="text-xl mb-2">Resume Optimization</h2>
          <p className="text-muted-foreground">
            Select a resume and job posting to generate an optimized version tailored to the job requirements.
          </p>
        </div>

        {resumes.length === 0 || jobPostings.length === 0 ? (
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl mb-2">Missing Required Items</h3>
            <p className="text-muted-foreground mb-6">
              You need at least one resume and one job posting to run optimization.
            </p>
            <div className="flex gap-4 justify-center">
              {resumes.length === 0 && (
                <Link to="/resumes">
                  <Button variant="primary">Upload Resume</Button>
                </Link>
              )}
              {jobPostings.length === 0 && (
                <Link to="/job-postings">
                  <Button variant="primary">Add Job Posting</Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Resume Selection */}
            <div className="bg-white rounded-[20px] p-6 shadow-md">
              <h3 className="mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Select Resume
              </h3>
              <div className="space-y-3">
                {resumes.map((resume) => (
                  <label
                    key={resume.id}
                    className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedResumeId === resume.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resume"
                      value={resume.id}
                      checked={selectedResumeId === resume.id}
                      onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                        selectedResumeId === resume.id
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      }`}>
                        {selectedResumeId === resume.id && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm mb-1 truncate">{resume.fileName}</p>
                        <p className="text-xs text-muted-foreground">{resume.uploadDate}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Job Posting Selection */}
            <div className="bg-white rounded-[20px] p-6 shadow-md">
              <h3 className="mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent" />
                Select Job Posting
              </h3>
              <div className="space-y-3">
                {jobPostings.map((job) => (
                  <label
                    key={job.id}
                    className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedJobId === job.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="job"
                      value={job.id}
                      checked={selectedJobId === job.id}
                      onChange={(e) => setSelectedJobId(Number(e.target.value))}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                        selectedJobId === job.id
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      }`}>
                        {selectedJobId === job.id && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm mb-1 truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Run Optimization */}
            <div className="bg-white rounded-[20px] p-6 shadow-md">
              <h3 className="mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Run Optimization
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {!selectedResumeId && !selectedJobId
                    ? 'Select a resume and job posting to continue'
                    : !selectedResumeId
                    ? 'Select a resume to continue'
                    : !selectedJobId
                    ? 'Select a job posting to continue'
                    : 'Ready to optimize!'}
                </p>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleOptimize}
                  disabled={!canOptimize}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Run Optimization
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-[20px] p-6 text-red-700">
            <p className="font-medium">Optimization failed</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
            <h3 className="text-xl mb-2">Analyzing job keywords and generating optimized resume...</h3>
            <p className="text-muted-foreground">This may take a few moments</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="bg-white rounded-[20px] p-8 shadow-md">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-8 h-8 text-primary" />
                  <h2 className="text-2xl">Your optimized resume is ready</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generated on {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copy Text
                  </>
                )}
              </Button>
            </div>

            {/* Optimized Text */}
            <div className="mb-6">
              <h3 className="mb-3">Optimized Resume Text</h3>
              <div className="bg-background rounded-[14px] p-6 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                {result.optimizedText}
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <h3 className="mb-3">Suggestions</h3>
              <div className="space-y-3">
                {result.suggestions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No suggestions returned.</p>
                ) : (
                  result.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex gap-3 p-4 bg-accent/10 rounded-xl">
                      <div className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                        {idx + 1}
                      </div>
                      <p className="text-foreground">{suggestion}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}