"use client";

import type { FormEvent } from "react";
import { useDeferredValue, useEffect, useEffectEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Download,
  FileText,
  Loader2,
  LogOut,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { clearStoredSession, readAccessToken } from "@/lib/auth-storage";
import {
  buildApiUrl,
  createJobPosting,
  fetchJobPostings,
  fetchMe,
  fetchOptimizations,
  fetchResumes,
  logout,
  regenerateOptimization,
  runOptimization,
  uploadResume,
} from "@/lib/api";
import type {
  AuthUser,
  JobPostingRecord,
  OptimizationRunRecord,
  ResumeRecord,
} from "@/lib/types";

interface WorkspaceData {
  user: AuthUser;
  resumes: ResumeRecord[];
  jobPostings: JobPostingRecord[];
  optimizations: OptimizationRunRecord[];
}

const emptyJobForm = {
  source_url: "",
  title: "",
  company: "",
  description: "",
};

export function DashboardShell() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedJobPostingId, setSelectedJobPostingId] = useState<number | null>(null);
  const [activeOptimizationId, setActiveOptimizationId] = useState<number | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [customizationNotes, setCustomizationNotes] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const deferredHistoryQuery = useDeferredValue(historyQuery);

  const loadWorkspace = useEffectEvent(async () => {
    const [user, resumes, jobPostings, optimizations] = await Promise.all([
      fetchMe(),
      fetchResumes(),
      fetchJobPostings(),
      fetchOptimizations(),
    ]);

    setWorkspace({ user, resumes, jobPostings, optimizations });
    setSelectedResumeId((current) =>
      resumes.some((resume) => resume.id === current) ? current : (resumes[0]?.id ?? null),
    );
    setSelectedJobPostingId((current) =>
      jobPostings.some((jobPosting) => jobPosting.id === current)
        ? current
        : (jobPostings[0]?.id ?? null),
    );
    setActiveOptimizationId((current) =>
      optimizations.some((optimization) => optimization.id === current)
        ? current
        : (optimizations[0]?.id ?? null),
    );
  });

  useEffect(() => {
    if (!readAccessToken()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        await loadWorkspace();
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Unable to load dashboard data.";
          toast.error(message);
          clearStoredSession();
          router.replace("/login");
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
  }, [router]);

  async function refreshAfterMutation() {
    await loadWorkspace();
  }

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.replace("/login");
    });
  }

  function handleResumeUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumeFile) {
      toast.error("Choose a PDF or DOCX file first.");
      return;
    }

    startTransition(async () => {
      try {
        const resume = await uploadResume(resumeFile);
        await refreshAfterMutation();
        setSelectedResumeId(resume.id);
        setResumeFile(null);
        const input = document.getElementById("resume-upload-input") as HTMLInputElement | null;
        if (input) {
          input.value = "";
        }
        toast.success("Resume uploaded.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Resume upload failed.";
        toast.error(message);
      }
    });
  }

  function handleJobCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const created = await createJobPosting({
          source_url: jobForm.source_url || undefined,
          title: jobForm.title || undefined,
          company: jobForm.company || undefined,
          description: jobForm.description || undefined,
        });
        await refreshAfterMutation();
        setSelectedJobPostingId(created.id);
        setJobForm(emptyJobForm);
        toast.success("Job posting saved.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save job posting.";
        toast.error(message);
      }
    });
  }

  function handleOptimize() {
    if (!selectedResumeId || !selectedJobPostingId) {
      toast.error("Select both a resume and a job posting first.");
      return;
    }

    startTransition(async () => {
      try {
        const run = await runOptimization({
          resume_id: selectedResumeId,
          job_posting_id: selectedJobPostingId,
          customization_notes: customizationNotes || undefined,
        });
        await refreshAfterMutation();
        setActiveOptimizationId(run.id);
        toast.success("Optimization completed.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Optimization failed.";
        toast.error(message);
      }
    });
  }

  function handleRegenerate() {
    if (!activeOptimizationId) {
      toast.error("Run an optimization before regenerating.");
      return;
    }

    startTransition(async () => {
      try {
        const run = await regenerateOptimization(activeOptimizationId, {
          customization_notes: customizationNotes || undefined,
        });
        await refreshAfterMutation();
        setActiveOptimizationId(run.id);
        toast.success("Optimization regenerated.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Regeneration failed.";
        toast.error(message);
      }
    });
  }

  async function handleDownloadPdf() {
    const activeOptimization = workspace?.optimizations.find(
      (optimization) => optimization.id === activeOptimizationId,
    );

    if (!activeOptimization?.pdf_download_url) {
      toast.error("No PDF is available for this optimization yet.");
      return;
    }

    try {
      const response = await fetch(buildApiUrl(activeOptimization.pdf_download_url), {
        headers: {
          Authorization: `Bearer ${readAccessToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("PDF download failed.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `optimized-resume-${activeOptimization.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "PDF download failed.";
      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border bg-white/80 px-5 py-3 shadow-spotlight">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Connecting to the backend...</span>
        </div>
      </div>
    );
  }

  const activeOptimization =
    workspace?.optimizations.find((optimization) => optimization.id === activeOptimizationId) ??
    workspace?.optimizations[0] ??
    null;
  const selectedResume =
    workspace?.resumes.find((resume) => resume.id === selectedResumeId) ?? null;
  const selectedJobPosting =
    workspace?.jobPostings.find((jobPosting) => jobPosting.id === selectedJobPostingId) ?? null;
  const filteredOptimizations = (workspace?.optimizations ?? []).filter((optimization) => {
    const needle = deferredHistoryQuery.trim().toLowerCase();
    if (!needle) {
      return true;
    }
    return [
      optimization.target_job_title,
      optimization.target_company,
      optimization.optimized_resume_text,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge>Optimization workspace</Badge>
          <h1 className="text-4xl font-semibold tracking-[-0.04em]">
            {workspace?.user.name || workspace?.user.email}
          </h1>
          <p className="text-muted-foreground">
            Upload a resume, add a target job description, and generate LaTeX-backed resume drafts.
          </p>
        </div>

        <Button variant="secondary" onClick={handleLogout} disabled={isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <CardTitle className="mb-2">1. Resume intake</CardTitle>
                <CardDescription>
                  Upload a PDF or DOCX resume. The backend parses and stores the plaintext.
                </CardDescription>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleResumeUpload}>
              <div className="space-y-2">
                <Label htmlFor="resume-upload-input">Resume file</Label>
                <Input
                  id="resume-upload-input"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                />
              </div>
              <Button type="submit" disabled={isPending}>
                Upload resume
              </Button>
            </form>

            <SelectionStrip
              items={workspace?.resumes ?? []}
              selectedId={selectedResumeId}
              onSelect={setSelectedResumeId}
              getLabel={(resume) => resume.file_name}
              getMeta={(resume) => new Date(resume.created_at).toLocaleString()}
            />
          </Card>

          <Card>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <CardTitle className="mb-2">2. Target job description</CardTitle>
                <CardDescription>
                  Paste the description directly or include the source URL for reference.
                </CardDescription>
              </div>
              <div className="rounded-2xl bg-accent/50 p-3 text-foreground">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleJobCreate}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Job title"
                  value={jobForm.title}
                  onChange={(value) => setJobForm((current) => ({ ...current, title: value }))}
                />
                <Field
                  label="Company"
                  value={jobForm.company}
                  onChange={(value) => setJobForm((current) => ({ ...current, company: value }))}
                />
              </div>
              <Field
                label="Source URL"
                value={jobForm.source_url}
                placeholder="https://example.com/jobs/backend-engineer"
                onChange={(value) => setJobForm((current) => ({ ...current, source_url: value }))}
              />
              <div className="space-y-2">
                <Label htmlFor="job-description">Job description</Label>
                <Textarea
                  id="job-description"
                  value={jobForm.description}
                  onChange={(event) =>
                    setJobForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Paste the job description here."
                />
              </div>
              <Button type="submit" variant="secondary" disabled={isPending}>
                Save job posting
              </Button>
            </form>

            <SelectionStrip
              items={workspace?.jobPostings ?? []}
              selectedId={selectedJobPostingId}
              onSelect={setSelectedJobPostingId}
              getLabel={(jobPosting) => jobPosting.title || "Untitled job posting"}
              getMeta={(jobPosting) => jobPosting.company || jobPosting.source_url || "Manual entry"}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <CardTitle className="mb-2">3. Optimization controls</CardTitle>
                <CardDescription>
                  Add optional guidance, then generate or regenerate the output.
                </CardDescription>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold">Selected resume</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedResume?.file_name || "Choose a resume from the list."}
                </p>
              </div>
              <div className="rounded-[24px] border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold">Selected job posting</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedJobPosting?.title || "Choose a job posting from the list."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customization-notes">Customization notes</Label>
                <Textarea
                  id="customization-notes"
                  value={customizationNotes}
                  onChange={(event) => setCustomizationNotes(event.target.value)}
                  placeholder="Optional: emphasize platform work, leadership, or metrics."
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleOptimize} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running
                    </>
                  ) : (
                    "Run optimization"
                  )}
                </Button>
                <Button onClick={handleRegenerate} variant="secondary" disabled={isPending}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
                <Button onClick={handleDownloadPdf} variant="secondary" disabled={!activeOptimization}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-2">Current run</CardTitle>
            <CardDescription>
              Review the generated suggestions and the stored LaTeX source directly in the browser.
            </CardDescription>
            <Separator className="my-5" />
            {activeOptimization ? (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-border bg-muted/30 p-4">
                  <p className="text-sm font-semibold">
                    {activeOptimization.target_job_title || "Optimized resume draft"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeOptimization.target_company || "No company provided"} ·{" "}
                    {new Date(activeOptimization.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold">Suggestions</p>
                  <div className="space-y-3">
                    {activeOptimization.suggestions.map((suggestion, index) => (
                      <div
                        key={`${suggestion}-${index}`}
                        className="rounded-[22px] border border-border bg-white/80 p-4 text-sm text-muted-foreground"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold">LaTeX source</p>
                  <pre className="max-h-[360px] overflow-auto rounded-[24px] bg-slate-950 p-5 font-mono text-xs text-slate-100">
                    {activeOptimization.latex_content}
                  </pre>
                </div>
              </div>
            ) : (
              <EmptyState message="No optimization runs yet. Complete the first run to populate this panel." />
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardTitle className="mb-2">Source previews</CardTitle>
          <CardDescription>
            Confirm the parsed resume text and selected job description before rerunning the model.
          </CardDescription>
          <Separator className="my-5" />
          <div className="grid gap-4">
            <PreviewBlock title="Parsed resume text" content={selectedResume?.parsed_text || ""} />
            <PreviewBlock
              title="Job description"
              content={selectedJobPosting?.description || ""}
            />
          </div>
        </Card>

        <Card>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <CardTitle className="mb-2">Optimization history</CardTitle>
              <CardDescription>
                Search prior runs and switch the active viewer without rerunning anything.
              </CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                placeholder="Search runs"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredOptimizations.length > 0 ? (
              filteredOptimizations.map((optimization) => {
                const isActive = optimization.id === activeOptimization?.id;
                return (
                  <button
                    key={optimization.id}
                    type="button"
                    onClick={() => setActiveOptimizationId(optimization.id)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-white/80 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {optimization.target_job_title || "Resume draft"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {optimization.target_company || "No company"} ·{" "}
                          {new Date(optimization.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge className="shrink-0 bg-white text-foreground">
                        {optimization.job_keywords.length} keywords
                      </Badge>
                    </div>
                  </button>
                );
              })
            ) : (
              <EmptyState message="No optimization runs match the current search." />
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectionStrip<T extends { id: number }>({
  items,
  selectedId,
  onSelect,
  getLabel,
  getMeta,
}: {
  items: T[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  getLabel: (item: T) => string;
  getMeta: (item: T) => string;
}) {
  return (
    <div className="mt-5 space-y-3">
      {items.length > 0 ? (
        items.map((item) => {
          const active = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-white/70 hover:border-primary/40"
              }`}
            >
              <p className="font-semibold">{getLabel(item)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{getMeta(item)}</p>
            </button>
          );
        })
      ) : (
        <EmptyState message="Nothing has been added yet." />
      )}
    </div>
  );
}

function PreviewBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[24px] border border-border bg-white/80 p-4">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-sm text-muted-foreground">
        {content || "No content available yet."}
      </pre>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
