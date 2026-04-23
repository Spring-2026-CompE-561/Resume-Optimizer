import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { AuthLayout } from '../components/AuthLayout';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { ArrowLeft, Trash2, Sparkles } from 'lucide-react';

export function ResumeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { resumes, deleteResume } = useApp();

  const [resume, setResume] = useState<(typeof resumes)[number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!id) {
        setError('Resume id is missing.');
        setResume(null);
        setLoading(false);
        return;
    }

    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
        setError('Invalid resume id.');
        setResume(null);
        setLoading(false);
        return;
    }

    const foundResume = resumes.find((item) => item.id === numericId);

    setResume(foundResume ?? null);
    setLoading(false);
    }, [id, resumes]);

  const handleDelete = async () => {
    if (!resume) return;
    if (!confirm(`Delete ${resume.fileName}?`)) return;

    setError(null);

    try {
      await deleteResume(resume.id);
      navigate('/resumes');
    } catch (error) {
      console.error('Delete failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete resume.');
    }
  };

  if (loading) {
    return (
      <AuthLayout title="Resume Details">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <p className="text-muted-foreground">Loading resume...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (error && !resume) {
    return (
      <AuthLayout title="Resume Details">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <h2 className="text-2xl mb-4">Unable to Load Resume</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link to="/resumes">
              <Button variant="primary">Back to Resume Library</Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!resume) {
    return (
      <AuthLayout title="Resume Not Found">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <h2 className="text-2xl mb-4">Resume Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The resume you're looking for doesn't exist.
            </p>
            <Link to="/resumes">
              <Button variant="primary">Back to Resume Library</Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Resume Details">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/resumes" className="flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Resume Library
        </Link>

        <div className="bg-white rounded-[20px] p-8 shadow-md">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl mb-2">{resume.fileName}</h2>
              <div className="space-y-1 text-muted-foreground">
                <p>Uploaded: {resume.uploadDate}</p>
                <p>File Type: {resume.fileType}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/optimize">
                <Button variant="primary">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Optimize This Resume
                </Button>
              </Link>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          )}

          <div className="border-t border-border pt-6">
            <h3 className="mb-4">Parsed Text</h3>
            <div className="bg-background rounded-[14px] p-6 font-mono text-sm whitespace-pre-wrap">
              {resume.parsedText}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}