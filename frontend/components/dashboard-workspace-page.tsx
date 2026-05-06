"use client";

import type { ReactNode } from "react";
import { useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { IconCircle } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  loadCurrentUser,
  loadJobPostings,
  loadOptimizations,
  loadResumes,
} from "@/lib/dashboard-cache";
import type {
  AuthUser,
  JobPostingRecord,
  OptimizationRunRecord,
  ResumeRecord,
} from "@/lib/types";
import { getFirstName } from "@/lib/user-display";
import {
  readSelectedJobId,
  readSelectedResumeId,
  writeSelectedJobId,
  writeSelectedResumeId,
} from "@/lib/workspace-selection";

interface WorkspaceBundle {
  jobPostings: JobPostingRecord[];
  optimizations: OptimizationRunRecord[];
  resumes: ResumeRecord[];
  user: AuthUser;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DashboardWorkspacePage() {
  const [data, setData] = useState<WorkspaceBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const loadWorkspace = useEffectEvent(async () => {
    const [user, resumes, jobPostings, optimizations] = await Promise.all([
      loadCurrentUser(),
      loadResumes(),
      loadJobPostings(),
      loadOptimizations(),
    ]);

    const storedResumeId = readSelectedResumeId();
    const storedJobId = readSelectedJobId();
    const nextResumeId =
      resumes.some((resume) => resume.id === storedResumeId) ? storedResumeId : (resumes[0]?.id ?? null);
    const nextJobId =
      jobPostings.some((job) => job.id === storedJobId) ? storedJobId : (jobPostings[0]?.id ?? null);

    writeSelectedResumeId(nextResumeId);
    writeSelectedJobId(nextJobId);
    setSelectedResumeId(nextResumeId);
    setSelectedJobId(nextJobId);
    setData({
      jobPostings,
      optimizations: [...optimizations].sort(
        (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      ),
      resumes,
      user,
    });
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await loadWorkspace();
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load your workspace.";
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-[0_20px_50px_var(--soft-shadow)]">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Loading workspace...</span>
      </div>
    );
  }

  const selectedResume =
    data?.resumes.find((resume) => resume.id === selectedResumeId) ?? data?.resumes[0] ?? null;
  const selectedJob =
    data?.jobPostings.find((job) => job.id === selectedJobId) ?? data?.jobPostings[0] ?? null;
  const latestOptimization = data?.optimizations[0] ?? null;
  const firstName = getFirstName(data?.user ?? null);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-5xl font-semibold tracking-[-0.07em] text-foreground">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}{" "}
          <span className="inline-block">👋</span>
        </p>
        <p className="text-lg tracking-[-0.03em] text-muted-foreground">
          Pick up where you left off and keep your next application moving.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <OverviewCard
          actionHref={selectedResume ? `/dashboard/resumes/${selectedResume.id}` : "/dashboard/resumes"}
          actionLabel={selectedResume ? "View resume" : "Add resume"}
          icon={<FileText className="h-5 w-5" />}
          subtitle={
            selectedResume
              ? `Added ${formatDate(selectedResume.created_at)}`
              : "Upload the resume you want to tailor."
          }
          title="Resume"
          value={selectedResume?.file_name ?? "No resume selected"}
        />

        <OverviewCard
          actionHref={selectedJob ? `/dashboard/jobs/${selectedJob.id}` : "/dashboard/jobs"}
          actionLabel={selectedJob ? "View role" : "Add role"}
          icon={<BriefcaseBusiness className="h-5 w-5" />}
          subtitle={
            selectedJob
              ? selectedJob.company || "Saved target role"
              : "Add the job you want to optimize for."
          }
          title="Role"
          value={selectedJob?.title ?? "No role selected"}
        />

        <OverviewCard
          actionHref={
            latestOptimization ? `/dashboard/results/${latestOptimization.id}` : "/dashboard/history"
          }
          actionLabel={latestOptimization ? "Open draft" : "View history"}
          icon={<Sparkles className="h-5 w-5" />}
          subtitle={
            latestOptimization
              ? `${latestOptimization.target_company || "Target company"} - ${formatDate(latestOptimization.created_at)}`
              : "Your latest generated resume will appear here."
          }
          title="Latest Draft"
          value={latestOptimization?.target_job_title ?? "No optimized draft yet"}
        />

        <Card className="rounded-[32px] p-7">
          <div className="flex h-full flex-col gap-6">
            <IconCircle>
              <ArrowRight className="h-5 w-5" />
            </IconCircle>
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Start optimizing
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.06em] text-foreground">
                Build a tailored draft
              </h2>
              <p className="text-base leading-7 tracking-[-0.03em] text-muted-foreground">
                Review your selected resume and role, add optional guidance, and generate your next
                optimized version.
              </p>
            </div>
            <div className="mt-auto">
              <Button asChild size="lg">
                <Link href="/dashboard/workflow">Open workflow</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function OverviewCard({
  actionHref,
  actionLabel,
  icon,
  subtitle,
  title,
  value,
}: {
  actionHref: string;
  actionLabel: string;
  icon: ReactNode;
  subtitle: string;
  title: string;
  value: string;
}) {
  return (
    <Card className="rounded-[32px] p-7">
      <div className="flex h-full flex-col gap-6">
        <IconCircle>{icon}</IconCircle>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{title}</p>
          <h2 className="break-words text-3xl font-semibold tracking-[-0.06em] text-foreground">
            {value}
          </h2>
          <p className="text-base leading-7 tracking-[-0.03em] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mt-auto">
          <Button asChild variant="secondary">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
