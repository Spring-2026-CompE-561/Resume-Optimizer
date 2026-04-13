import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { AuthLayout } from '../components/AuthLayout';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { ArrowLeft, Trash2, Sparkles, ExternalLink } from 'lucide-react';

export function JobPostingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { jobPostings, deleteJobPosting } = useApp();

  const [job, setJob] = useState(jobPostings.find(j => j.id === id) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const found = jobPostings.find(j => j.id === id);
    if (found) {
      setJob(found);
      setError(null);
    } else {
      setJob(null);
      setError('Job posting not found.');
    }
    setLoading(false);
  }, [id, jobPostings]);

  if (loading) {
    return (
      <AuthLayout title="Job Posting Details">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <p className="text-muted-foreground">Loading job posting...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (error || !job) {
    return (
      <AuthLayout title="Job Posting Not Found">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <h2 className="text-2xl mb-4">Job Posting Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || "The job posting you're looking for doesn't exist."}
            </p>
            <Link to="/job-postings">
              <Button variant="primary">Back to Job Posting Library</Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const handleDelete = () => {
    if (confirm(`Delete job posting: ${job.title}?`)) {
      deleteJobPosting(job.id);
      navigate('/job-postings');
    }
  };

  return (
    <AuthLayout title="Job Posting Details">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Link to="/job-postings" className="flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Job Posting Library
        </Link>

        {/* Job Info Card */}
        <div className="bg-white rounded-[20px] p-8 shadow-md">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl mb-2">{job.title}</h2>
              <p className="text-xl text-muted-foreground mb-4">{job.company}</p>
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline font-mono text-sm"
              >
                {job.sourceUrl}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link to="/optimize">
                <Button variant="primary">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Optimize Resume
                </Button>
              </Link>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Keywords */}
          <div className="mb-6 pb-6 border-b border-border">
            <h3 className="mb-3">Extracted Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {job.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-4">Job Description</h3>
            <div className="bg-background rounded-[14px] p-6 text-foreground whitespace-pre-wrap">
              {job.description}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
