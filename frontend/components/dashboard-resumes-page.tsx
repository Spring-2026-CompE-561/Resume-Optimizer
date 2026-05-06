"use client";

import type { FormEvent } from "react";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { EmptyPanel, Eyebrow, formatDate, IconCircle, PaginationControls } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteResume, fetchResumesPage, uploadResume } from "@/lib/api";
import { invalidateDashboardResource, loadResumes } from "@/lib/dashboard-cache";
import type { PaginationMeta, ResumeRecord } from "@/lib/types";
import {
  readSelectedResumeId,
  writeSelectedResumeId,
} from "@/lib/workspace-selection";

const PAGE_LIMIT = 5;

export function DashboardResumesPage() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const refreshResumes = useEffectEvent(async (targetPage: number) => {
    const response = await fetchResumesPage({ page: targetPage, limit: PAGE_LIMIT });
    setResumes(response.items);
    setPagination(response.pagination);
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setIsLoading(true);
        await refreshResumes(page);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load resumes.";
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [page]);

  function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resumeFile) {
      toast.error("Choose a PDF or DOCX file first.");
      return;
    }

    startTransition(async () => {
      try {
        const uploadedResume = await uploadResume(resumeFile);
        invalidateDashboardResource("resumes");
        if (page === 1) {
          await refreshResumes(1);
        } else {
          setPage(1);
        }
        writeSelectedResumeId(uploadedResume.id);
        setResumeFile(null);
        const input = document.getElementById("resume-upload-input") as HTMLInputElement | null;
        if (input) {
          input.value = "";
        }
        toast.success("Resume uploaded.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";
        toast.error(message);
      }
    });
  }

  function handleDelete(resumeId: number) {
    startTransition(async () => {
      try {
        await deleteResume(resumeId);
        invalidateDashboardResource("resumes");
        const nextResumes = await loadResumes();
        if (resumes.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          await refreshResumes(page);
        }
        if (readSelectedResumeId() === resumeId) {
          writeSelectedResumeId(nextResumes[0]?.id ?? null);
        }
        toast.success("Resume deleted.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed.";
        toast.error(message);
      }
    });
  }

  function handleSelect(resumeId: number) {
    writeSelectedResumeId(resumeId);
    toast.success("Resume selected for optimization.");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Eyebrow>Resume Management</Eyebrow>
        <div className="space-y-3">
          <h1 className="text-5xl font-semibold tracking-[-0.07em] text-foreground">
            Resume Management
          </h1>
          <p className="text-lg tracking-[-0.03em] text-muted-foreground">
            Upload the resume you want to tailor and keep your source versions organized.
          </p>
        </div>
      </div>

      <Card className="rounded-[32px] border-dashed border-[rgba(133,153,214,0.4)] p-8">
        <form className="space-y-6" onSubmit={handleUpload}>
          <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] bg-[#fbfcff] px-6 py-12 text-center">
            <IconCircle>
              <UploadCloud className="h-6 w-6" />
            </IconCircle>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                Upload a new resume
              </h2>
              <p className="text-base tracking-[-0.03em] text-muted-foreground">
                PDF and DOCX files are supported.
              </p>
            </div>
            <input
              id="resume-upload-input"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <label
                htmlFor="resume-upload-input"
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-accent px-5 text-sm font-medium text-primary transition hover:bg-[#ecf2ff]"
              >
                Choose file
              </label>
              <span className="text-sm text-muted-foreground">
                {resumeFile?.name || "No file chosen"}
              </span>
            </div>
            <Button size="lg" type="submit" disabled={isPending || !resumeFile}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload resume"
              )}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-[-0.06em] text-foreground">Your resumes</h2>

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-full border border-white bg-white px-5 py-3 shadow-[0_20px_50px_rgba(20,37,84,0.08)]">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Loading resumes...</span>
          </div>
        ) : resumes.length > 0 ? (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="rounded-[32px] p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/dashboard/resumes/${resume.id}`}
                        className="block truncate text-xl font-semibold tracking-[-0.04em] text-foreground transition hover:text-primary"
                      >
                        {resume.file_name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Added {formatDate(resume.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => handleSelect(resume.id)}>
                      Select
                    </Button>
                    <Button variant="destructive" onClick={() => handleDelete(resume.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {pagination ? <PaginationControls pagination={pagination} onPageChange={setPage} /> : null}
          </div>
        ) : (
          <EmptyPanel
            title="No resumes yet"
            description="Upload your first resume to start tailoring it to a role."
          />
        )}
      </div>
    </div>
  );
}
