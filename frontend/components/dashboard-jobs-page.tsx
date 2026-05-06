"use client";

import type { FormEvent } from "react";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Globe,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyPanel, formatDate, PaginationControls } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createJobPosting, deleteJobPosting, fetchJobPostingsPage } from "@/lib/api";
import { invalidateDashboardResource, loadJobPostings } from "@/lib/dashboard-cache";
import type { JobPostingRecord, PaginationMeta } from "@/lib/types";
import {
  readSelectedJobId,
  writeSelectedJobId,
} from "@/lib/workspace-selection";

const emptyManualForm = {
  company: "",
  description: "",
  title: "",
};

const emptyUrlForm = {
  source_url: "",
  title: "",
};

const PAGE_LIMIT = 5;

export function DashboardJobsPage() {
  const [entryMode, setEntryMode] = useState<"manual" | "url">("manual");
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [urlForm, setUrlForm] = useState(emptyUrlForm);
  const [jobs, setJobs] = useState<JobPostingRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const refreshJobs = useEffectEvent(async (targetPage: number) => {
    const response = await fetchJobPostingsPage({ page: targetPage, limit: PAGE_LIMIT });
    setJobs(response.items);
    setPagination(response.pagination);
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setIsLoading(true);
        await refreshJobs(page);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load roles.";
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

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (entryMode === "manual" && !manualForm.description.trim()) {
      toast.error("Add the job description first.");
      return;
    }

    if (entryMode === "url" && !urlForm.source_url.trim()) {
      toast.error("Add the job posting URL first.");
      return;
    }

    startTransition(async () => {
      try {
        const created =
          entryMode === "manual"
            ? await createJobPosting({
                company: manualForm.company.trim() || undefined,
                description: manualForm.description.trim(),
                title: manualForm.title.trim() || undefined,
              })
            : await createJobPosting({
                source_url: urlForm.source_url.trim(),
                title: urlForm.title.trim() || undefined,
              });
        invalidateDashboardResource("jobPostings");
        if (page === 1) {
          await refreshJobs(1);
        } else {
          setPage(1);
        }
        setManualForm(emptyManualForm);
        setUrlForm(emptyUrlForm);
        writeSelectedJobId(created.id);
        toast.success("Role saved.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save role.";
        toast.error(message);
      }
    });
  }

  function handleDelete(jobId: number) {
    startTransition(async () => {
      try {
        await deleteJobPosting(jobId);
        invalidateDashboardResource("jobPostings");
        const nextJobs = await loadJobPostings();
        if (jobs.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          await refreshJobs(page);
        }
        if (readSelectedJobId() === jobId) {
          writeSelectedJobId(nextJobs[0]?.id ?? null);
        }
        toast.success("Role deleted.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed.";
        toast.error(message);
      }
    });
  }

  function handleSelect(jobId: number) {
    writeSelectedJobId(jobId);
    toast.success("Role selected for optimization.");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-3">
          <h1 className="text-5xl font-semibold tracking-[-0.07em] text-foreground">
            Role Management
          </h1>
          <p className="text-lg tracking-[-0.03em] text-muted-foreground">
            Save the role you want to target, whether you paste it manually or pull it from a URL.
          </p>
        </div>
      </div>

      <Card className="rounded-[32px] p-8">
        <div className="space-y-8">
          <div className="inline-flex rounded-2xl bg-accent p-1.5">
            <button
              type="button"
              onClick={() => setEntryMode("manual")}
              className={`rounded-[14px] px-5 py-3 text-sm font-medium tracking-[-0.03em] transition ${
                entryMode === "manual"
                  ? "bg-card text-foreground shadow-[0_10px_24px_var(--soft-shadow)]"
                  : "text-muted-foreground"
              }`}
            >
              Manual entry
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("url")}
              className={`rounded-[14px] px-5 py-3 text-sm font-medium tracking-[-0.03em] transition ${
                entryMode === "url"
                  ? "bg-card text-foreground shadow-[0_10px_24px_var(--soft-shadow)]"
                  : "text-muted-foreground"
              }`}
            >
              From URL
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleCreate}>
            {entryMode === "manual" ? (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label htmlFor="job-title">Job Title</Label>
                    <Input
                      id="job-title"
                      value={manualForm.title}
                      onChange={(event) =>
                        setManualForm((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Senior Product Manager"
                      className="h-12 rounded-2xl bg-input"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="job-company">Company</Label>
                    <Input
                      id="job-company"
                      value={manualForm.company}
                      onChange={(event) =>
                        setManualForm((current) => ({ ...current, company: event.target.value }))
                      }
                      placeholder="NovaTech"
                      className="h-12 rounded-2xl bg-input"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="job-description">Job Description</Label>
                  <Textarea
                    id="job-description"
                    value={manualForm.description}
                    onChange={(event) =>
                      setManualForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Paste the job description here..."
                    className="min-h-[220px] rounded-[24px] bg-input"
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2.5">
                  <Label htmlFor="job-url-title">Job Title <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    id="job-url-title"
                    value={urlForm.title}
                    onChange={(event) =>
                      setUrlForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Senior Product Manager"
                    className="h-12 rounded-2xl bg-input"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="job-source-url">Source URL</Label>
                  <Input
                    id="job-source-url"
                    type="url"
                    value={urlForm.source_url}
                    onChange={(event) =>
                      setUrlForm((current) => ({ ...current, source_url: event.target.value }))
                    }
                    placeholder="https://company.com/careers/role"
                    className="h-12 rounded-2xl bg-input"
                  />
                </div>
              </div>
            )}

            <Button
              className="bg-primary font-semibold text-primary-foreground shadow-[0_18px_40px_var(--primary-shadow)] hover:bg-primary hover:brightness-95 disabled:border disabled:border-border disabled:bg-card disabled:text-foreground disabled:opacity-100 disabled:shadow-none"
              size="lg"
              type="submit"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save role"
              )}
            </Button>
          </form>
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-[-0.06em] text-foreground">Saved roles</h2>

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-[0_20px_50px_var(--soft-shadow)]">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Loading roles...</span>
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="rounded-[32px] p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
                      {job.source_url ? <Globe className="h-5 w-5" /> : <BriefcaseBusiness className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="block truncate text-xl font-semibold tracking-[-0.04em] text-foreground transition hover:text-primary"
                      >
                        {job.title || "Untitled role"}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {job.company || "Saved role"} - Added {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => handleSelect(job.id)}>
                      Select
                    </Button>
                    <Button variant="destructive" onClick={() => handleDelete(job.id)}>
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
            title="No roles yet"
            description="Save a target role to start generating a more tailored resume."
          />
        )}
      </div>
    </div>
  );
}
