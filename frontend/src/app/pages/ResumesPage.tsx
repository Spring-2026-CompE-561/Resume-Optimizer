import React, { useState, useRef } from 'react';
import { Link } from 'react-router';
import { AuthLayout } from '../components/AuthLayout';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { FileText, Upload, Trash2 } from 'lucide-react';

export function ResumesPage() {
  const { resumes, addResume, deleteResume } = useApp();
  const [uploading, setUploading] = useState(false);
  const [loadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setError(null);

    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be 5 MB or smaller.');
      return;
    }

    setUploading(true);
    try {
      await addResume(file);
      setError(null);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDelete = async (id: number, fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return;

    setError(null);

    try {
      await deleteResume(id);
    } catch (error) {
      console.error('Delete failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete resume.');
    }
  };

  return (
    <AuthLayout title="Resume Library">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-[20px] p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl mb-1">Upload Resume</h2>
              <p className="text-sm text-muted-foreground">
                Manage your resume library
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Resume
            </Button>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-[14px] p-12 text-center transition-all ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <Upload
              className={`w-12 h-12 mx-auto mb-4 ${
                dragActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <p className="text-lg mb-2">
              {uploading ? 'Uploading...' : 'Drag and drop your resume here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click the button above to browse
            </p>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Accepted file types: PDF, DOCX
              </p>
              <p className="text-sm text-muted-foreground">
                Maximum file size: 5 MB
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
              e.target.value = '';
            }}
            className="hidden"
          />
        </div>

        {loadingList ? (
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <p className="text-muted-foreground">Loading resumes...</p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-white rounded-[20px] p-12 shadow-md text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl mb-2">No Resumes Yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload your first resume to get started with optimization
            </p>
            <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
              Upload Your First Resume
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {resumes.map((resume) => (
              <div key={resume.id} className="bg-white rounded-[20px] p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="mb-1 truncate">{resume.fileName}</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      Uploaded {resume.uploadDate}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Type: {resume.fileType}
                    </p>
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {resume.preview}
                    </p>
                    <div className="flex gap-3 mt-4">
                      <Link to={`/resumes/${resume.id}`}>
                        <Button variant="primary" className="text-sm px-4 py-2">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        className="text-sm px-4 py-2"
                        onClick={() => handleDelete(resume.id, resume.fileName)}
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