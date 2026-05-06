"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";
import Link from "next/link";
import { Building2, ExternalLink, Loader2, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { DetailRow, Eyebrow, KeywordPill } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteJobPosting } from "@/lib/api";
import { invalidateDashboardResource, loadJobPostings } from "@/lib/dashboard-cache";
import type { JobPostingRecord } from "@/lib/types";
import {
  readSelectedJobId,
  writeSelectedJobId,
} from "@/lib/workspace-selection";

export function DashboardJobDetailPage({ jobId }: { jobId: number }) {
  const router = useRouter();
  const [job, setJob] = useState<JobPostingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadJob = useEffectEvent(async () => {
    const jobPostings = await loadJobPostings();
    setJob(jobPostings.find((item) => item.id === jobId) ?? null);
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await loadJob();
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load that role.";
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
  }, []);

  function handleSelect() {
    writeSelectedJobId(jobId);
    toast.success("Role selected for optimization.");
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteJobPosting(jobId);
        invalidateDashboardResource("jobPostings");
        const nextJobs = await loadJobPostings();
        if (readSelectedJobId() === jobId) {
          writeSelectedJobId(nextJobs[0]?.id ?? null);
        }
        toast.success("Role deleted.");
        router.push("/dashboard/jobs");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed.";
        toast.error(message);
      }
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-white bg-white px-5 py-3 shadow-[0_20px_50px_rgba(20,37,84,0.08)]">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Loading role...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="rounded-[32px] p-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-[-0.06em]">Role not found</h1>
          <Button asChild variant="secondary">
            <Link href="/dashboard/jobs">Back to roles</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <Eyebrow>Role Detail</Eyebrow>
          <div className="space-y-3">
            <h1 className="text-5xl font-semibold tracking-[-0.07em] text-foreground">
              {job.title || "Untitled role"}
            </h1>
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-2xl font-medium tracking-[-0.04em] text-foreground">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                {job.company || "Target company"}
              </p>
              {job.source_url ? (
                <a
                  href={job.source_url}
                  rel="noreferrer"
                  target="_blank"
                  className="inline-flex items-center gap-2 break-all text-lg font-medium tracking-[-0.03em] text-primary transition hover:opacity-80"
                >
                  {job.source_url}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={handleSelect}>
            Select for optimization
          </Button>
          <Button size="lg" variant="destructive" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {job.keywords.slice(0, 8).map((keyword) => (
          <KeywordPill key={keyword.id} label={keyword.term} />
        ))}
      </div>

      <Card className="rounded-[32px] p-8">
        <div className="space-y-6">
          <DetailRow label="Company" value={job.company || "Target company"} icon={<Building2 className="h-4 w-4" />} />
          {job.source_url ? (
            <DetailRow
              label="Source URL"
              value={job.source_url}
              link={job.source_url}
              icon={<ExternalLink className="h-4 w-4" />}
            />
          ) : null}
          <div className="rounded-[28px] border border-border bg-[#fbfcff] p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                Job Description
              </h2>
            </div>
            <div className="space-y-6 text-lg leading-10 tracking-[-0.03em] text-foreground/88">
              {(job.description || "No description available.")
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 32)}`}>{paragraph}</p>
                ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
