"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  DetailRow,
  DownloadButton,
  KeywordPill,
  PreviewResumeCard,
} from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchOptimization, regenerateOptimization } from "@/lib/api";
import { invalidateDashboardResource, loadResumes } from "@/lib/dashboard-cache";
import { downloadAuthenticatedFile } from "@/lib/download";
import type { OptimizationRunRecord, ResumeRecord } from "@/lib/types";

function deriveCandidateName(resume: ResumeRecord | null) {
  if (!resume?.file_name) {
    return "Your Resume";
  }

  const baseName = resume.file_name.replace(/\.(pdf|docx?)$/i, "");
  const leadingWords = baseName
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .filter((part) => !/resume/i.test(part))
    .slice(0, 3)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase());

  return leadingWords.length > 0 ? leadingWords.join(" ") : "Your Resume";
}

export function DashboardResultPage({ optimizationId }: { optimizationId: number }) {
  const router = useRouter();
  const [optimization, setOptimization] = useState<OptimizationRunRecord | null>(null);
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [baseDraftText, setBaseDraftText] = useState("");
  const [draftText, setDraftText] = useState("");
  const [appliedSuggestionIndexes, setAppliedSuggestionIndexes] = useState<Set<number>>(
    () => new Set(),
  );
  const appliedSuggestionIndexesRef = useRef<Set<number>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadResult = useEffectEvent(async () => {
    const [nextOptimization, resumes] = await Promise.all([
      fetchOptimization(optimizationId),
      loadResumes(),
    ]);
    const nextDraftText = nextOptimization.optimized_resume_text || "";
    appliedSuggestionIndexesRef.current = new Set();
    setOptimization(nextOptimization);
    setResume(resumes.find((item) => item.id === nextOptimization.resume_id) ?? null);
    setBaseDraftText(nextDraftText);
    setDraftText(nextDraftText);
    setAppliedSuggestionIndexes(new Set());
    setLoadError(null);
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await loadResult();
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load that result.";
          setLoadError(message);
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

  async function handleRetryLoad() {
    setIsLoading(true);
    setLoadError(null);
    try {
      await loadResult();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load that result.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownload() {
    if (!optimization?.pdf_download_url) {
      toast.error("No PDF is available for this draft yet.");
      return;
    }

    try {
      await downloadAuthenticatedFile(
        optimization.pdf_download_url,
        `optimized-resume-${optimization.id}.pdf`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed.";
      toast.error(message);
    }
  }

  function handleRegenerate() {
    if (!optimization) {
      return;
    }

    startTransition(async () => {
      try {
        const nextOptimization = await regenerateOptimization(optimization.id, {
          customization_notes: optimization.customization_notes || undefined,
        });
        invalidateDashboardResource("optimizations");
        toast.success("Optimization regenerated.");
        router.push(`/dashboard/results/${nextOptimization.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not regenerate that draft.";
        toast.error(message);
      }
    });
  }

  function commitAppliedSuggestions(nextAppliedIndexes: Set<number>) {
    if (!optimization) {
      return;
    }

    appliedSuggestionIndexesRef.current = nextAppliedIndexes;
    setAppliedSuggestionIndexes(new Set(nextAppliedIndexes));

    const appliedSuggestions = optimization.suggestions.filter((_, index) =>
      nextAppliedIndexes.has(index),
    );
    const nextDraftText = buildDraftWithAppliedSuggestions(baseDraftText, appliedSuggestions);
    setDraftText(nextDraftText);
    setOptimization((current) =>
      current ? { ...current, optimized_resume_text: nextDraftText } : current,
    );
  }

  function handleApplySuggestion(index: number) {
    if (!optimization || appliedSuggestionIndexesRef.current.has(index)) {
      return;
    }

    const suggestion = optimization.suggestions[index]?.trim();
    if (!suggestion) {
      return;
    }

    const nextAppliedIndexes = new Set(appliedSuggestionIndexesRef.current);
    nextAppliedIndexes.add(index);
    commitAppliedSuggestions(nextAppliedIndexes);
    toast.success("Suggestion applied.");
  }

  function handleApplyAllSuggestions() {
    if (!optimization) {
      return;
    }

    const nextAppliedIndexes = new Set(appliedSuggestionIndexesRef.current);
    optimization.suggestions.forEach((suggestion, index) => {
      if (suggestion.trim()) {
        nextAppliedIndexes.add(index);
      }
    });

    if (nextAppliedIndexes.size === appliedSuggestionIndexesRef.current.size) {
      return;
    }

    commitAppliedSuggestions(nextAppliedIndexes);
    toast.success("All suggestions applied.");
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-white bg-white px-5 py-3 shadow-[0_20px_50px_rgba(20,37,84,0.08)]">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Loading result...</span>
      </div>
    );
  }

  if (!optimization) {
    return (
      <Card className="rounded-[32px] p-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-[-0.06em]">
            {loadError ? "Unable to load result" : "Result not found"}
          </h1>
          <p className="max-w-xl text-base leading-7 tracking-[-0.03em] text-muted-foreground">
            {loadError || "This optimization result could not be found."}
          </p>
          <div className="flex flex-wrap gap-3">
            {loadError ? (
              <Button variant="secondary" onClick={handleRetryLoad}>
                Try again
              </Button>
            ) : null}
            <Button asChild variant="secondary">
              <Link href="/dashboard/history">Back to history</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const suggestions = optimization.suggestions;
  const unappliedCount = suggestions.filter(
    (_, index) => !appliedSuggestionIndexes.has(index),
  ).length;
  const allSuggestionsApplied = suggestions.length > 0 && unappliedCount === 0;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-[-0.03em] text-muted-foreground">
          Workspace &gt; Optimization Result
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-5xl font-semibold tracking-[-0.07em] text-foreground">
            Optimization Result
          </h1>
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <p className="text-lg tracking-[-0.03em] text-muted-foreground">
          Your resume has been optimized for the target role.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card className="rounded-[32px] p-5 sm:p-6">
            <div className="space-y-5">
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                Optimized Resume Preview
              </h2>
              <PreviewResumeCard
                content={draftText}
                title={deriveCandidateName(resume)}
                subtitle={optimization.target_job_title || "Optimized draft"}
                score={93}
              />
            </div>
          </Card>

          <Card className="rounded-[32px] p-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                  AI Suggestions
                </h2>
                {suggestions.length > 1 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleApplyAllSuggestions}
                    disabled={allSuggestionsApplied}
                  >
                    {allSuggestionsApplied ? "All applied" : `Apply all (${unappliedCount})`}
                  </Button>
                ) : null}
              </div>
              <div className="space-y-3">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => {
                    const isApplied = appliedSuggestionIndexes.has(index);
                    return (
                      <div
                        key={`${suggestion}-${index}`}
                        className={`flex flex-col gap-4 rounded-[22px] border px-4 py-4 text-base tracking-[-0.03em] sm:flex-row sm:items-center sm:justify-between ${
                          isApplied
                            ? "border-[rgba(43,193,122,0.35)] bg-[rgba(43,193,122,0.08)]"
                            : "border-transparent bg-accent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isApplied ? (
                            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[var(--color-success)]" />
                          ) : (
                            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary" />
                          )}
                          <div>
                            <p className="text-foreground">{suggestion}</p>
                            {isApplied ? (
                              <p className="mt-1 text-sm font-medium text-[var(--color-success)]">
                                Applied to preview
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant={isApplied ? "soft" : "secondary"}
                          onClick={() => handleApplySuggestion(index)}
                          disabled={isApplied}
                        >
                          {isApplied ? "Applied" : "Apply suggestion"}
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[22px] bg-accent px-4 py-3 text-base tracking-[-0.03em] text-foreground">
                    No follow-up suggestions were returned for this draft.
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-[32px] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                  Want different results?
                </h2>
                <p className="mt-2 text-base tracking-[-0.03em] text-muted-foreground">
                  Regenerate with your saved guidance to refine the optimized resume.
                </p>
              </div>
              <Button variant="secondary" onClick={handleRegenerate} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  "Regenerate with guidance"
                )}
              </Button>
            </div>
          </Card>
        </div>

        <Card className="h-fit rounded-[32px] p-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
              Optimization Summary
            </h2>
            <div className="space-y-5">
              <DetailRow
                label="Target Role"
                value={optimization.target_job_title || "Optimized draft"}
                icon={<BriefcaseBusiness className="h-4 w-4" />}
              />
              <DetailRow label="Company" value={optimization.target_company || "Target company"} />
              <DetailRow
                label="Optimization Date"
                value={new Date(optimization.created_at).toLocaleDateString()}
                icon={<CalendarDays className="h-4 w-4" />}
              />
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="mb-4 text-xl font-semibold tracking-[-0.05em] text-foreground">
                Top Keywords Added
              </h3>
              <div className="flex flex-wrap gap-3">
                {optimization.job_keywords.length > 0 ? (
                  optimization.job_keywords.map((keyword) => (
                    <KeywordPill key={keyword} label={keyword} />
                  ))
                ) : (
                  <KeywordPill label="Role-aligned keywords" />
                )}
              </div>
            </div>

            <DownloadButton onClick={handleDownload} disabled={!optimization.pdf_download_url} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function buildDraftWithAppliedSuggestions(baseDraftText: string, suggestions: string[]) {
  const cleanBase = baseDraftText.trim();
  const appliedLines = suggestions.map(formatAppliedSuggestion).filter(Boolean);

  if (appliedLines.length === 0) {
    return cleanBase;
  }

  const appliedSection = [
    "Applied Improvements",
    ...appliedLines.map((line) => `- ${line}`),
  ].join("\n");
  return cleanBase ? `${cleanBase}\n\n${appliedSection}` : appliedSection;
}

function formatAppliedSuggestion(suggestion: string) {
  const cleaned = suggestion.trim().replace(/\.$/, "");
  if (!cleaned) {
    return "";
  }

  const replacements: Array<[RegExp, string]> = [
    [/^add\b/i, "Added"],
    [/^highlight\b/i, "Highlighted"],
    [/^mirror\b/i, "Mirrored"],
    [/^lead\b/i, "Led"],
    [/^quantify\b/i, "Quantified"],
    [/^prioritize\b/i, "Prioritized"],
    [/^include\b/i, "Included"],
    [/^use\b/i, "Used"],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(cleaned)) {
      return `${cleaned.replace(pattern, replacement)}.`;
    }
  }

  return `Applied guidance: ${cleaned}.`;
}
