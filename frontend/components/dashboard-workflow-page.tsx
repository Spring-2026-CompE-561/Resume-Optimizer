"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import {
  Eyebrow,
  IconCircle,
  ProgressList,
} from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { invalidateDashboardResource, loadJobPostings, loadResumes } from "@/lib/dashboard-cache";
import { runOptimization } from "@/lib/api";
import type { JobPostingRecord, ResumeRecord } from "@/lib/types";
import { readSelectedJobId, readSelectedResumeId } from "@/lib/workspace-selection";

export function DashboardWorkflowPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPostingRecord[]>([]);
  const [customizationNotes, setCustomizationNotes] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadWorkflow = useEffectEvent(async () => {
    const [nextResumes, nextJobPostings] = await Promise.all([loadResumes(), loadJobPostings()]);
    setResumes(nextResumes);
    setJobPostings(nextJobPostings);
    setSelectedResumeId(readSelectedResumeId() ?? nextResumes[0]?.id ?? null);
    setSelectedJobId(readSelectedJobId() ?? nextJobPostings[0]?.id ?? null);
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await loadWorkflow();
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load your workflow.";
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

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedResumeId || !selectedJobId) {
      toast.error("Select both a resume and a role first.");
      return;
    }

    startTransition(async () => {
      try {
        const optimization = await runOptimization({
          resume_id: selectedResumeId,
          job_posting_id: selectedJobId,
          customization_notes: customizationNotes || undefined,
        });
        invalidateDashboardResource("optimizations");
        toast.success("Optimization completed.");
        router.push(`/dashboard/results/${optimization.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Optimization failed.";
        toast.error(message);
      }
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-[0_20px_50px_var(--soft-shadow)]">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Loading workflow...</span>
      </div>
    );
  }

  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId) ?? null;
  const selectedJob = jobPostings.find((job) => job.id === selectedJobId) ?? null;
  const progressSteps = [
    {
      complete: Boolean(selectedResume),
      description: selectedResume?.file_name,
      label: "Select resume",
    },
    {
      complete: Boolean(selectedJob),
      description: selectedJob
        ? `${selectedJob.title || "Saved role"}${selectedJob.company ? ` at ${selectedJob.company}` : ""}`
        : "Choose the role you want to target",
      label: "Select role",
    },
    {
      complete: customizationNotes.trim().length > 0,
      description: "Add any context to improve results",
      label: "Add notes (optional)",
    },
    {
      complete: false,
      description: "Create your optimized resume",
      label: "Generate draft",
      pending: true,
    },
  ];

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form className="space-y-8" onSubmit={handleGenerate}>
        <div className="space-y-4">
          <Eyebrow>Optimization Workflow</Eyebrow>
          <div className="space-y-3">
            <h1 className="text-5xl font-semibold tracking-[-0.07em] text-foreground">
              Optimization Workflow
            </h1>
            <p className="text-lg tracking-[-0.03em] text-muted-foreground">
              Follow these simple steps to create your optimized resume.
            </p>
          </div>
        </div>

        <WorkflowCard
          actionHref={selectedResume ? `/dashboard/resumes/${selectedResume.id}` : "/dashboard/resumes"}
          actionLabel="Change"
          icon={<FileText className="h-5 w-5" />}
          number={1}
          subtitle={selectedResume ? `Added ${new Date(selectedResume.created_at).toLocaleDateString()}` : "Choose the resume you want to use"}
          title="Selected Resume"
          value={selectedResume?.file_name ?? "No resume selected"}
        />

        <WorkflowCard
          actionHref={selectedJob ? `/dashboard/jobs/${selectedJob.id}` : "/dashboard/jobs"}
          actionLabel="Change"
          icon={<Target className="h-5 w-5" />}
          number={2}
          subtitle={selectedJob?.company || "Choose the role you want to target"}
          title="Selected Role"
          value={selectedJob?.title ?? "No role selected"}
        />

        <Card className="rounded-[32px] p-7">
          <div className="grid gap-5 md:grid-cols-[88px_minmax(0,1fr)]">
            <div className="flex items-start justify-center md:justify-start">
              <IconCircle>
                <FileText className="h-5 w-5" />
              </IconCircle>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                    3
                  </span>
                  <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                    Optional Notes
                  </h2>
                </div>
              </div>
              <Textarea
                value={customizationNotes}
                onChange={(event) => setCustomizationNotes(event.target.value.slice(0, 500))}
                placeholder="Add any additional context or specific areas to focus on..."
                className="min-h-[136px] rounded-[24px] bg-input"
              />
              <p className="text-right text-sm text-muted-foreground">{customizationNotes.length}/500</p>
            </div>
          </div>
        </Card>

        <Button className="w-full" size="lg" type="submit" disabled={isPending || !selectedResume || !selectedJob}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating draft...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate optimized draft
            </>
          )}
        </Button>
      </form>

      <Card className="h-fit rounded-[32px] p-7">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
            Your Progress
          </h2>
          <ProgressList steps={progressSteps} />
          <div className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-muted-foreground">
            {isPending ? "Generating..." : "Waiting..."}
          </div>
        </div>
      </Card>
    </div>
  );
}

function WorkflowCard({
  actionHref,
  actionLabel,
  icon,
  number,
  subtitle,
  title,
  value,
}: {
  actionHref: string;
  actionLabel: string;
  icon: ReactNode;
  number: number;
  subtitle: string;
  title: string;
  value: string;
}) {
  return (
    <Card className="rounded-[32px] p-7">
      <div className="grid gap-5 md:grid-cols-[88px_minmax(0,1fr)_120px] md:items-center">
        <div className="flex items-start justify-center md:justify-start">
          <IconCircle>{icon}</IconCircle>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {number}
            </span>
            <p className="text-xl font-semibold tracking-[-0.04em] text-foreground">{title}</p>
          </div>
          <h3 className="break-words text-3xl font-semibold tracking-[-0.06em] text-foreground">
            {value}
          </h3>
          <p className="text-base tracking-[-0.03em] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="md:justify-self-end">
          <Button asChild variant="secondary">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
