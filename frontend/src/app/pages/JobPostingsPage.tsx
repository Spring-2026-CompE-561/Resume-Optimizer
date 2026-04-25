import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { AuthLayout } from '../components/AuthLayout';
import { useApp } from '../context/AppContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Briefcase, Link as LinkIcon, Trash2, Loader2, AlertCircle } from 'lucide-react';

export function JobPostingsPage() {
  const { jobPostings, addJobPosting, deleteJobPosting, loadJobPostings } = useApp();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingList(true);
    setListError(null);
    loadJobPostings()
      .catch((err: unknown) =>
        setListError(err instanceof Error ? err.message : 'Failed to load job postings.'),
      )
      .finally(() => setLoadingList(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!url) return;

    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL.');
      return;
    }

    setLoading(true);
    try {
      await addJobPosting(url);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add job posting.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete job posting: ${title}?`)) return;
    try {
      await deleteJobPosting(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job posting.');
    }
  };

  return (
    <AuthLayout title="Job Posting Library">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-[20px] p-6 shadow-md">
          <div className="mb-4">
            <h2 className="text-xl mb-1">Add Job Posting</h2>
            <p className="text-sm text-muted-foreground">
              Save job postings to optimize your resumes against
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Paste job posting URL (e.g., https://company.com/careers/job-id)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Analyzing...' : 'Analyze Job Posting'}
            </Button>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </form>

          <div className="mt-6 p-4 bg-secondary/30 rounded-xl">
            <p className="text-sm text-muted-foreground">
              Our system will scrape the page and extract job title, company, description, and relevant keywords to help optimize your resume.
            </p>
          </div>
        </div>

        {/* Job Postings List */}
        {loadingList ? (
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Loading job postings...</p>
          </div>
        ) : listError ? (
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl mb-2">Could not load job postings</h3>
            <p className="text-muted-foreground">{listError}</p>
          </div>
        ) : jobPostings.length === 0 ? (
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl mb-2">No Job Postings Yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first job posting URL to start optimizing your resumes
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobPostings.map((job) => (
              <div key={job.id} className="bg-white rounded-[20px] p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl mb-1">{job.title}</h3>
                    <p className="text-muted-foreground mb-2">{job.company}</p>

                    <div className="flex items-center gap-2 mb-3">
                      <LinkIcon className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={job.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline font-mono truncate"
                      >
                        {job.sourceUrl}
                      </a>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Link to={`/job-postings/${job.id}`}>
                        <Button variant="primary" className="text-sm px-4 py-2">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        className="text-sm px-4 py-2"
                        onClick={() => handleDelete(job.id, job.title)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
