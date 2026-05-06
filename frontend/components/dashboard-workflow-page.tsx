"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { formatDate, IconCircle } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  invalidateDashboardResource,
  loadCurrentUser,
  loadJobPostings,
  loadOptimizations,
  loadResumes,
} from "@/lib/dashboard-cache";
import { runOptimization } from "@/lib/api";
import type { AuthUser, JobPostingRecord, OptimizationRunRecord, ResumeRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getFirstName } from "@/lib/user-display";
import {
  readSelectedJobId,
  readSelectedResumeId,
  writeSelectedJobId,
  writeSelectedResumeId,
} from "@/lib/workspace-selection";

const draftLoadingMessages = [
  "Scanning your resume",
  "Finding role-specific keywords",
  "Matching your experience to the job",
  "Improving bullet points",
  "Strengthening action verbs",
  "Highlighting measurable impact",
  "Optimizing for ATS readability",
  "Tightening your wording",
  "Aligning skills with the role",
  "Polishing your summary",
  "Removing vague language",
  "Prioritizing relevant experience",
  "Checking keyword coverage",
  "Refining your phrasing",
  "Making your resume more targeted",
  "Preparing your optimized version",
];
const DRAFT_LOADING_MESSAGE_INTERVAL_MS = 3600;
const DRAFT_LOADING_MESSAGE_FADE_MS = 150;

export function DashboardWorkflowPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPostingRecord[]>([]);
  const [optimizations, setOptimizations] = useState<OptimizationRunRecord[]>([]);
  const [customizationNotes, setCustomizationNotes] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [resumePickerOpen, setResumePickerOpen] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [draftLoadingMessageIndex, setDraftLoadingMessageIndex] = useState(0);
  const [draftLoadingMessageVisible, setDraftLoadingMessageVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadWorkflow = useEffectEvent(async () => {
    const [nextUser, nextResumes, nextJobPostings, nextOptimizations] = await Promise.all([
      loadCurrentUser(),
      loadResumes(),
      loadJobPostings(),
      loadOptimizations(),
    ]);
    const storedResumeId = readSelectedResumeId();
    const storedJobId = readSelectedJobId();
    const nextResumeId =
      storedResumeId && nextResumes.some((resume) => resume.id === storedResumeId)
        ? storedResumeId
        : nextResumes[0]?.id ?? null;
    const nextJobId =
      storedJobId && nextJobPostings.some((job) => job.id === storedJobId)
        ? storedJobId
        : nextJobPostings[0]?.id ?? null;

    setUser(nextUser);
    setResumes(nextResumes);
    setJobPostings(nextJobPostings);
    setOptimizations(nextOptimizations);
    setSelectedResumeId(nextResumeId);
    setSelectedJobId(nextJobId);
    writeSelectedResumeId(nextResumeId);
    writeSelectedJobId(nextJobId);
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

  useEffect(() => {
    if (!isPending) {
      setDraftLoadingMessageIndex(0);
      setDraftLoadingMessageVisible(true);
      return;
    }

    let fadeTimeout: number | undefined;
    const interval = window.setInterval(() => {
      setDraftLoadingMessageVisible(false);
      fadeTimeout = window.setTimeout(() => {
        setDraftLoadingMessageIndex((current) => (current + 1) % draftLoadingMessages.length);
        setDraftLoadingMessageVisible(true);
      }, DRAFT_LOADING_MESSAGE_FADE_MS);
    }, DRAFT_LOADING_MESSAGE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      if (fadeTimeout) {
        window.clearTimeout(fadeTimeout);
      }
    };
  }, [isPending]);

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    if (!selectedResumeId || !selectedJobId) {
      toast.error("Select both a resume and a role first.");
      return;
    }

    const existingOptimization = optimizations.find(
      (optimization) =>
        optimization.resume_id === selectedResumeId &&
        optimization.job_posting_id === selectedJobId,
    );
    if (existingOptimization) {
      toast("Draft already generated", {
        description: "You already have an optimized draft for this resume and role.",
        action: {
          label: "View draft",
          onClick: () => router.push(`/dashboard/results/${existingOptimization.id}`),
        },
      });
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

  function handleSelectResume(resumeId: number) {
    setSelectedResumeId(resumeId);
    writeSelectedResumeId(resumeId);
    setResumePickerOpen(false);
    toast.success("Resume selected for optimization.");
  }

  function handleSelectRole(jobId: number) {
    setSelectedJobId(jobId);
    writeSelectedJobId(jobId);
    setRolePickerOpen(false);
    toast.success("Role selected for optimization.");
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
  const firstName = getFirstName(user);

  return (
    <form className="space-y-8" onSubmit={handleGenerate}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="space-y-3">
            <h1 className="text-5xl font-semibold tracking-[-0.07em] text-foreground">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}{" "}
              <span className="inline-block">👋</span>
            </h1>
            <p className="text-lg tracking-[-0.03em] text-muted-foreground">
              Follow these simple steps to create your optimized resume.
            </p>
          </div>
        </div>

        <Button
          className="w-full bg-primary font-semibold text-primary-foreground shadow-[0_18px_40px_var(--primary-shadow)] hover:bg-primary hover:brightness-95 disabled:border disabled:border-border disabled:bg-card disabled:text-foreground disabled:opacity-100 disabled:shadow-none sm:w-auto lg:mt-2"
          size="lg"
          type="submit"
          disabled={isPending || !selectedResume || !selectedJob}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span
                aria-live="polite"
                className={`inline-block min-w-0 text-left transition-opacity duration-150 sm:min-w-[230px] ${
                  draftLoadingMessageVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                {draftLoadingMessages[draftLoadingMessageIndex]}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate optimized draft
            </>
          )}
        </Button>
      </div>

      <WorkflowCard
        actionLabel={resumePickerOpen ? "Close" : "Change"}
        actionAriaLabel={resumePickerOpen ? "Close resume selector" : "Change selected resume"}
        expanded={resumePickerOpen}
        icon={<FileText className="h-5 w-5" />}
        number={1}
        onAction={() => setResumePickerOpen((current) => !current)}
        subtitle={selectedResume ? `Added ${formatDate(selectedResume.created_at)}` : "Choose the resume you want to use"}
        title="Selected Resume"
        value={selectedResume?.file_name ?? "No resume selected"}
      >
        <SelectionPanel
          addHref="/dashboard/resumes"
          addLabel="Add new resume"
          emptyText="No resumes have been added yet."
        >
          {resumes.map((resume) => (
            <SelectionOption
              key={resume.id}
              description={`Added ${formatDate(resume.created_at)}`}
              icon={<FileText className="h-4 w-4" />}
              isSelected={resume.id === selectedResumeId}
              label={resume.file_name}
              onSelect={() => handleSelectResume(resume.id)}
            />
          ))}
        </SelectionPanel>
      </WorkflowCard>

      <WorkflowCard
        actionLabel={rolePickerOpen ? "Close" : "Change"}
        actionAriaLabel={rolePickerOpen ? "Close role selector" : "Change selected role"}
        expanded={rolePickerOpen}
        icon={<Target className="h-5 w-5" />}
        number={2}
        onAction={() => setRolePickerOpen((current) => !current)}
        subtitle={selectedJob?.company || "Choose the role you want to target"}
        title="Selected Role"
        value={selectedJob?.title ?? "No role selected"}
      >
        <SelectionPanel
          addHref="/dashboard/jobs"
          addLabel="Add new role"
          emptyText="No roles have been added yet."
        >
          {jobPostings.map((job) => (
            <SelectionOption
              key={job.id}
              description={formatJobDescription(job)}
              icon={<Target className="h-4 w-4" />}
              isSelected={job.id === selectedJobId}
              label={job.title || "Untitled role"}
              onSelect={() => handleSelectRole(job.id)}
            />
          ))}
        </SelectionPanel>
      </WorkflowCard>

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
    </form>
  );
}

function WorkflowCard({
  actionLabel,
  actionAriaLabel,
  children,
  expanded,
  icon,
  number,
  onAction,
  subtitle,
  title,
  value,
}: {
  actionLabel: string;
  actionAriaLabel: string;
  children: ReactNode;
  expanded: boolean;
  icon: ReactNode;
  number: number;
  onAction: () => void;
  subtitle: string;
  title: string;
  value: string;
}) {
  return (
    <Card className="rounded-[32px] p-7">
      <div className="grid gap-5 md:grid-cols-[88px_minmax(0,1fr)_auto] md:items-center">
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
          <Button
            type="button"
            variant="secondary"
            onClick={onAction}
            aria-expanded={expanded}
            aria-label={actionAriaLabel}
          >
            {actionLabel}
            <ChevronDown
              className={cn("ml-2 h-4 w-4 transition-transform", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>
      {expanded ? <div className="mt-6 border-t border-border pt-5">{children}</div> : null}
    </Card>
  );
}

function SelectionPanel({
  addHref,
  addLabel,
  children,
  emptyText,
}: {
  addHref: string;
  addLabel: string;
  children: ReactNode;
  emptyText: string;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="space-y-4">
      {hasChildren ? (
        <div className="grid max-h-[360px] gap-3 overflow-y-auto pr-1">{children}</div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-border bg-card-elevated px-5 py-6 text-sm font-medium text-muted-foreground">
          {emptyText}
        </div>
      )}
      <Button asChild variant="secondary">
        <Link href={addHref}>
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Link>
      </Button>
    </div>
  );
}

function SelectionOption({
  description,
  icon,
  isSelected,
  label,
  onSelect,
}: {
  description: string;
  icon: ReactNode;
  isSelected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "flex w-full items-center gap-4 rounded-[24px] border px-4 py-4 text-left transition",
        isSelected
          ? "border-primary bg-accent text-foreground shadow-[0_12px_28px_var(--soft-shadow)]"
          : "border-border bg-card-elevated text-foreground hover:border-primary/40 hover:bg-accent",
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block truncate text-base font-semibold tracking-[-0.03em]">{label}</span>
        <span className="block truncate text-sm text-muted-foreground">{description}</span>
      </span>
      {isSelected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> : null}
    </button>
  );
}

function formatJobDescription(job: JobPostingRecord) {
  const company = job.company || "Saved role";
  return `${company} - Added ${formatDate(job.created_at)}`;
}
